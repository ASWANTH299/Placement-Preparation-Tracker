const mongoose = require('mongoose');

const learningPathSchema = new mongoose.Schema(
  {
    week: {
      type: Number,
      required: [true, 'Week is required'],
      unique: true,
      min: 1,
      max: 52
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      maxlength: 100,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 1000
    },
    estimatedDurationHours: {
      type: Number,
      default: 0
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      required: true
    },
    resources: [
      {
        title: String,
        url: String,
        type: {
          type: String,
          enum: ['article', 'video', 'documentation']
        }
      }
    ],
    subtopics: [String],
    status: {
      type: String,
      enum: ['Active', 'Archived'],
      default: 'Active'
    }
  },
  {
    timestamps: true
  }
);

// Indexes
learningPathSchema.index({ week: 1 });
learningPathSchema.index({ status: 1 });

module.exports = mongoose.model('LearningPath', learningPathSchema);
