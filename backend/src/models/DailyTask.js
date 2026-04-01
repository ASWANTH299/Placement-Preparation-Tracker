const mongoose = require('mongoose');

const dailyTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 160
    },
    platform: {
      type: String,
      required: [true, 'Platform is required'],
      trim: true,
      enum: ['LeetCode', 'CodeChef', 'HackerRank', 'GeeksforGeeks', 'Other'],
      default: 'LeetCode'
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty is required'],
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Easy'
    },
    company: {
      type: String,
      trim: true,
      maxlength: 100,
      default: ''
    },
    estimatedTime: {
      type: String,
      trim: true,
      maxlength: 40,
      default: ''
    },
    prompt: {
      type: String,
      required: [true, 'Prompt is required'],
      maxlength: 1200,
      trim: true
    },
    practiceUrl: {
      type: String,
      required: [true, 'Practice URL is required'],
      trim: true
    },
    tags: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

dailyTaskSchema.index({ createdAt: -1 });
dailyTaskSchema.index({ platform: 1, difficulty: 1 });
dailyTaskSchema.index({ isActive: 1 });

module.exports = mongoose.model('DailyTask', dailyTaskSchema);