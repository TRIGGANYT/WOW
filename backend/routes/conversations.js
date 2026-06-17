const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// GET /api/conversations — list user's conversations (title, id, updatedAt)
router.get('/', async (req, res) => {
  try {
    const conversations = await Conversation.find({ user: req.user.userId })
      .select('title folder updatedAt')
      .sort({ updatedAt: -1 });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: 'Fehler beim Laden der Conversations' });
  }
});

// GET /api/conversations/:id — load full conversation
router.get('/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });
    if (!conversation) return res.status(404).json({ message: 'Conversation nicht gefunden' });
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ message: 'Fehler beim Laden der Conversation' });
  }
});

// POST /api/conversations — create new conversation
router.post('/', async (req, res) => {
  try {
    const { title, messages } = req.body;
    const conversation = new Conversation({
      user: req.user.userId,
      title: title || 'Neuer Chat',
      messages: messages || [],
    });
    await conversation.save();
    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ message: 'Fehler beim Erstellen der Conversation' });
  }
});

// PUT /api/conversations/:id — update conversation (messages, title)
router.put('/:id', async (req, res) => {
  try {
    const { title, messages, folder } = req.body;
    const update = {};
    if (title) update.title = title;
    if (messages) update.messages = messages;
    if (folder !== undefined) update.folder = folder;

    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      update,
      { new: true },
    );
    if (!conversation) return res.status(404).json({ message: 'Conversation nicht gefunden' });
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ message: 'Fehler beim Aktualisieren der Conversation' });
  }
});

// DELETE /api/conversations/:id — delete a conversation
router.delete('/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });
    if (!conversation) return res.status(404).json({ message: 'Conversation nicht gefunden' });
    res.json({ message: 'Conversation gelöscht' });
  } catch (err) {
    res.status(500).json({ message: 'Fehler beim Löschen der Conversation' });
  }
});

module.exports = router;
