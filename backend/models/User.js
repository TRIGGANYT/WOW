const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    age: {
      type: Number,
      min: 1,
      max: 150,
    },
    hobbies: {
      type: [String],
      default: [],
    },
    lifeStage: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    mentorXp: {
      type: Number,
      default: 0,
    },
    mentorLevel: {
      type: Number,
      default: 1,
    },
    challengeXp: {
      type: Number,
      default: 0,
    },
    challengeLevel: {
      type: Number,
      default: 1,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
    },
    verificationExpires: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
