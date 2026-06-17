const express = require('express');
const router = express.Router();
const Folder = require('../models/Folder');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/folders — list user's folders
router.get('/', async (req, res) => {
  try {
    const folders = await Folder.find({ user: req.user.userId })
      .sort({ name: 1 });
    res.json(folders);
  } catch (err) {
    res.status(500).json({ message: 'Fehler beim Laden der Ordner' });
  }
});

// POST /api/folders — create a folder
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Ordnername ist erforderlich' });
    }
    const folder = new Folder({
      user: req.user.userId,
      name: name.trim(),
    });
    await folder.save();
    res.status(201).json(folder);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Ordner existiert bereits' });
    }
    res.status(500).json({ message: 'Fehler beim Erstellen des Ordners' });
  }
});

// PUT /api/folders/:id — rename a folder
router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Ordnername ist erforderlich' });
    }

    const folder = await Folder.findOne({ _id: req.params.id, user: req.user.userId });
    if (!folder) return res.status(404).json({ message: 'Ordner nicht gefunden' });

    const oldName = folder.name;
    const newName = name.trim();

    if (oldName !== newName) {
      // Check if new name already exists
      const existing = await Folder.findOne({ user: req.user.userId, name: newName });
      if (existing) {
        return res.status(409).json({ message: 'Ordner existiert bereits' });
      }

      folder.name = newName;
      await folder.save();

      // Update conversations referencing this folder
      const Conversation = require('../models/Conversation');
      await Conversation.updateMany(
        { user: req.user.userId, folder: oldName },
        { $set: { folder: newName } },
      );
    }
    res.json(folder);
  } catch (err) {
    res.status(500).json({ message: 'Fehler beim Aktualisieren des Ordners' });
  }
});

// DELETE /api/folders/:id — delete a folder (chats inside get unassigned)
router.delete('/:id', async (req, res) => {
  try {
    const folder = await Folder.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });
    if (!folder) return res.status(404).json({ message: 'Ordner nicht gefunden' });

    // Unassign conversations in this folder
    const Conversation = require('../models/Conversation');
    await Conversation.updateMany(
      { user: req.user.userId, folder: folder.name },
      { $set: { folder: null } },
    );

    res.json({ message: 'Ordner gelöscht' });
  } catch (err) {
    res.status(500).json({ message: 'Fehler beim Löschen des Ordners' });
  }
});

module.exports = router;
