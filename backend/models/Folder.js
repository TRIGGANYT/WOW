const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

// One folder name per user
folderSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Folder', folderSchema);
