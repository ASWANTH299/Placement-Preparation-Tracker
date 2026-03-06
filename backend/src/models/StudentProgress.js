const mongoose = require('mongoose');

const studentProgressSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LearningPath',
      required: false
    },
    weekId: {
      type: Number,
      required: false
    },
    completedProblemIndexes: {
      type: [Number],
      default: []
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started'
    },
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    notes: [
      {
        content: {
          type: String,
          maxlength: 1000
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    startedAt: Date,
    completedAt: Date
  },
  {
    timestamps: true
  }
);

// Compound index for unique constraint
studentProgressSchema.index({ studentId: 1, weekId: 1 }, { unique: true, sparse: true });
studentProgressSchema.index({ studentId: 1, topicId: 1 }, { unique: true, sparse: true });
studentProgressSchema.index({ studentId: 1 });
studentProgressSchema.index({ status: 1 });

module.exports = mongoose.model('StudentProgress', studentProgressSchema);
