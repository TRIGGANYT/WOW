const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

// Index for fast retrieval by team
messageSchema.index({ team: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
