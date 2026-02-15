const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const Rating = require('../models/Rating');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// GET all teams
router.get('/', authMiddleware, async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('members', 'email username')
      .populate('creator', 'email username');
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teams', error: error.message });
  }
});

// GET single team by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members', 'email username')
      .populate('creator', 'email username');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json(team);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching team', error: error.message });
  }
});

// POST create new team
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, icon, maxMembers, creatorId } = req.body;

    // Check if creatorId looks like a valid ObjectId (24 hex chars)
    const isValidObjectId = creatorId && /^[a-fA-F0-9]{24}$/.test(creatorId);

    const team = new Team({
      name,
      description,
      icon: icon || '👥',
      maxMembers: maxMembers || 8,
      creator: isValidObjectId ? creatorId : undefined,
      members: isValidObjectId ? [creatorId] : [],
    });

    await team.save();
    res.status(201).json(team);
  } catch (error) {
    res.status(400).json({ message: 'Error creating team', error: error.message });
  }
});

// POST join team
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.members.length >= team.maxMembers) {
      return res.status(400).json({ message: 'Team is full' });
    }

    // Check if user already a member
    const memberExists = team.members.some((m) => m.toString() === userId);
    if (memberExists) {
      return res.status(400).json({ message: 'Already a member' });
    }

    // Check if valid ObjectId
    const isValidObjectId = userId && /^[a-fA-F0-9]{24}$/.test(userId);
    if (isValidObjectId) {
      team.members.push(userId);
    }
    await team.save();

    // Return populated team data
    const populatedTeam = await Team.findById(team._id)
      .populate('members', 'email username')
      .populate('creator', 'email username');

    res.json(populatedTeam);
  } catch (error) {
    res.status(400).json({ message: 'Error joining team', error: error.message });
  }
});

// DELETE leave team
router.delete('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    team.members = team.members.filter((m) => m.toString() !== userId);
    await team.save();

    res.json(team);
  } catch (error) {
    res.status(400).json({ message: 'Error leaving team', error: error.message });
  }
});

// POST beacon-leave (for navigator.sendBeacon on browser close)
// sendBeacon sends as text/plain to avoid CORS preflight, so we parse manually
router.post('/:id/beacon-leave', express.text({ type: '*/*' }), async (req, res) => {
  try {
    // Body arrives as a plain text string, parse it as JSON
    let userId;
    try {
      const parsed = JSON.parse(req.body);
      userId = parsed.userId;
    } catch {
      userId = req.body?.userId; // fallback if already parsed as JSON
    }

    if (!userId) return res.status(400).json({ message: 'User ID required' });

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    team.members = team.members.filter((m) => m.toString() !== userId);
    await team.save();

    res.json({ message: 'Left team via beacon' });
  } catch (error) {
    res.status(400).json({ message: 'Error leaving team', error: error.message });
  }
});

// DELETE team completely (dissolve)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json({ message: 'Team successfully deleted', teamId: req.params.id });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting team', error: error.message });
  }
});

// POST vote to dissolve team
router.post('/:id/vote-dissolve', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is a member
    const isMember = team.members.some((m) => m.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ message: 'Only members can vote' });
    }

    // Check if already voted
    const hasVoted = team.dissolveVotes.some((v) => v.toString() === userId);
    if (!hasVoted) {
      team.dissolveVotes.push(userId);
      await team.save();
    }

    // Check if majority has voted
    const totalMembers = team.members.length;
    const votesNeeded = Math.floor(totalMembers / 2) + 1;
    const currentVotes = team.dissolveVotes.length;

    if (currentVotes >= votesNeeded) {
      // Majority reached - delete the team
      await Team.findByIdAndDelete(req.params.id);
      return res.json({
        dissolved: true,
        message: 'Team dissolved by majority vote',
        teamId: req.params.id,
      });
    }

    // Return updated team with vote count
    const populatedTeam = await Team.findById(team._id)
      .populate('members', 'email username')
      .populate('creator', 'email')
      .populate('dissolveVotes', 'email');

    res.json({
      dissolved: false,
      team: populatedTeam,
      votesNeeded,
      currentVotes,
    });
  } catch (error) {
    res.status(400).json({ message: 'Error voting to dissolve', error: error.message });
  }
});

// ===== CHAT MESSAGES =====

const Message = require('../models/Message');

// GET messages for a team
router.get('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ team: req.params.id })
      .populate('sender', 'email username')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

// POST send a message
router.post('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { userId, text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const message = new Message({
      team: req.params.id,
      sender: userId,
      text: text.trim(),
    });

    await message.save();

    // Return populated message
    const populated = await Message.findById(message._id).populate('sender', 'email username');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: 'Error sending message', error: error.message });
  }
});

// XP per star rating
const MENTOR_XP_MAP = { 1: 5, 2: 15, 3: 30, 4: 50, 5: 80 };

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

// POST /api/teams/:id/rate - Rate a team member
router.post('/:id/rate', authMiddleware, async (req, res) => {
  try {
    const { raterId, ratedUserId, stars } = req.body;

    // Validate
    if (raterId === ratedUserId) {
      return res.status(400).json({ message: 'Du kannst dich nicht selbst bewerten' });
    }
    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ message: 'Bewertung muss zwischen 1 und 5 sein' });
    }

    // Check if already rated
    const existing = await Rating.findOne({
      rater: raterId,
      ratedUser: ratedUserId,
      team: req.params.id,
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: 'Du hast diesen Nutzer in diesem Team bereits bewertet' });
    }

    // Create rating
    const rating = new Rating({
      rater: raterId,
      ratedUser: ratedUserId,
      team: req.params.id,
      stars,
    });
    await rating.save();

    // Award Mentor XP to rated user
    const xpAmount = MENTOR_XP_MAP[stars] || 5;
    const ratedUser = await User.findById(ratedUserId);
    if (ratedUser) {
      ratedUser.mentorXp += xpAmount;
      ratedUser.mentorLevel = calculateLevel(ratedUser.mentorXp);
      await ratedUser.save();
    }

    res
      .status(201)
      .json({ message: `Bewertung gespeichert! +${xpAmount} Mentor XP`, xpAwarded: xpAmount });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: 'Du hast diesen Nutzer in diesem Team bereits bewertet' });
    }
    res.status(500).json({ message: 'Server Fehler', error: error.message });
  }
});

module.exports = router;
