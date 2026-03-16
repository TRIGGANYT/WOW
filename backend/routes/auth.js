const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { sendVerificationEmail, generateCode } = require('../utils/email');

const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 10,
  message: { message: 'Zu viele Anfragen. Bitte warte 15 Minuten.' },
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Fehler' });
  }
});

// PUT /api/auth/me - Update profile
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { username, age, hobbies, lifeStage } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    // Check username uniqueness if changed
    if (username && username !== user.username) {
      const existing = await User.findOne({ username: username.trim() });
      if (existing) {
        return res.status(400).json({ message: 'Dieser Benutzername ist bereits vergeben.' });
      }
      user.username = username.trim();
    }

    if (age !== undefined) user.age = age;
    if (hobbies !== undefined) user.hobbies = hobbies;
    if (lifeStage !== undefined) user.lifeStage = lifeStage;

    await user.save();

    const updated = await User.findById(user._id).select('-password');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server Fehler' });
  }
});

// GET /api/auth/check-available?email=...&username=...
router.get('/check-available', async (req, res) => {
  try {
    const { email, username } = req.query;
    const result = {};

    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
      result.emailAvailable = !existingEmail;
    }

    if (username) {
      const existingUsername = await User.findOne({ username: username.trim() });
      result.usernameAvailable = !existingUsername;
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server Fehler' });
  }
});

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, username, age, hobbies, lifeStage } = req.body;

    // Email-Format prüfen
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: 'Ungültige Email-Adresse' });
    }

    // Passwort-Validierung
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Passwort muss mindestens 8 Zeichen lang sein' });
    }

    // Validate hobbies
    if (!hobbies || !Array.isArray(hobbies) || hobbies.length === 0) {
      return res.status(400).json({ message: 'Mindestens ein Hobby/Interesse ist erforderlich' });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Diese Email ist bereits registriert.' });
    }

    // Check if username already exists
    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ message: 'Dieser Benutzername ist bereits vergeben.' });
      }
    }

    // Generate verification code
    const code = generateCode();

    // Create new user (unverified)
    const user = new User({
      email,
      password,
      username,
      age: age || undefined,
      hobbies,
      lifeStage,
      verificationCode: code,
      verificationExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 min
    });
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(email, code);
    } catch (emailErr) {
      console.error('Email send error:', emailErr);
      // Delete user if email fails so they can retry
      await User.findByIdAndDelete(user._id);
      return res
        .status(500)
        .json({
          message: 'Verifikations-Email konnte nicht gesendet werden. Bitte versuche es erneut.',
        });
    }

    res.status(201).json({ message: 'Verifikationscode wurde an deine Email gesendet.', email });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server Fehler' });
  }
});

// POST /api/auth/verify - Verify email with 6-digit code
router.post('/verify', authLimiter, async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email ist bereits verifiziert' });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: 'Ungültiger Verifikationscode' });
    }

    if (user.verificationExpires < new Date()) {
      return res
        .status(400)
        .json({ message: 'Verifikationscode abgelaufen. Bitte neuen Code anfordern.' });
    }

    // Mark as verified and clear code
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationExpires = undefined;
    await user.save();

    // Auto-login after verification
    const accessToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ message: 'Email erfolgreich verifiziert!', accessToken });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ message: 'Server Fehler' });
  }
});

// POST /api/auth/resend-code - Resend verification code
router.post('/resend-code', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email ist bereits verifiziert' });
    }

    // Generate new code
    const code = generateCode();
    user.verificationCode = code;
    user.verificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(email, code);

    res.json({ message: 'Neuer Verifikationscode wurde gesendet.' });
  } catch (error) {
    console.error('Resend error:', error);
    res.status(500).json({ message: 'Server Fehler' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res
        .status(403)
        .json({
          message: 'Email noch nicht verifiziert. Bitte überprüfe dein Postfach.',
          needsVerification: true,
          email: user.email,
        });
    }

    // Create JWT token
    const accessToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ accessToken });
  } catch (error) {
    res.status(500).json({ message: 'Server Fehler' });
  }
});

// DELETE /api/auth/me - Delete user account
router.delete('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }
    res.json({ message: 'Konto erfolgreich gelöscht' });
  } catch (error) {
    res.status(500).json({ message: 'Server Fehler' });
  }
});
const Rating = require('../models/Rating');

// XP to level calculation: XP_needed = round(100 * 1.5^(level-1))
function calculateLevel(xp) {
  let level = 1;
  let totalNeeded = 0;
  while (level < 10) {
    const needed = Math.round(100 * Math.pow(1.5, level - 1));
    if (xp < totalNeeded + needed) break;
    totalNeeded += needed;
    level++;
  }
  return level;
}

// XP per star rating for mentor
const MENTOR_XP_MAP = { 1: 5, 2: 15, 3: 30, 4: 50, 5: 80 };

// POST /api/auth/add-xp - Add XP and recalculate level
router.post('/add-xp', authMiddleware, async (req, res) => {
  try {
    const { type, amount } = req.body; // type: 'mentor' or 'challenge'
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'Benutzer nicht gefunden' });

    if (type === 'mentor') {
      user.mentorXp += amount;
      user.mentorLevel = calculateLevel(user.mentorXp);
    } else if (type === 'challenge') {
      user.challengeXp += amount;
      user.challengeLevel = calculateLevel(user.challengeXp);
    } else {
      return res.status(400).json({ message: 'Ungültiger XP-Typ' });
    }

    await user.save();
    res.json({
      mentorXp: user.mentorXp,
      mentorLevel: user.mentorLevel,
      challengeXp: user.challengeXp,
      challengeLevel: user.challengeLevel,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Fehler' });
  }
});

// GET /api/auth/ratings/:userId - Get rating history
router.get('/ratings/:userId', async (req, res) => {
  try {
    const ratings = await Rating.find({ ratedUser: req.params.userId })
      .populate('rater', 'email username')
      .populate('team', 'name')
      .sort({ createdAt: -1 });
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ message: 'Server Fehler', error: error.message });
  }
});

module.exports = router;
