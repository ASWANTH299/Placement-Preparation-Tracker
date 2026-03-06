const mongoose = require('mongoose');

const codingProfileSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    platform: {
      type: String,
      enum: ['LeetCode', 'CodeChef', 'HackerRank', 'Codeforces'],
      required: true
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      maxlength: 50
    },
    profileUrl: String,
    problemsSolved: Number,
    currentRating: Number,
    lastSyncedAt: Date,
    syncStatus: {
      type: String,
      enum: ['Syncing', 'Success', 'Failed'],
      default: 'Success'
    }
  },
  {
    timestamps: true
  }
);

// Compound index for unique constraint
codingProfileSchema.index({ studentId: 1, platform: 1 }, { unique: true });
codingProfileSchema.index({ studentId: 1 });

module.exports = mongoose.model('CodingProfile', codingProfileSchema);
