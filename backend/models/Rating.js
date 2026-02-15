const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    rater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ratedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    stars: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true },
);

// One rating per rater→ratedUser per team
ratingSchema.index({ rater: 1, ratedUser: 1, team: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
