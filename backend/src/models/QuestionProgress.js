const mongoose = require('mongoose');

const questionProgressSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyQuestion',
      required: true
    },
    status: {
      type: String,
      enum: ['Not Attempted', 'Attempted', 'Solved'],
      default: 'Not Attempted'
    },
    isSolved: {
      type: Boolean,
      default: false
    },
    isBookmarked: {
      type: Boolean,
      default: false
    },
    attemptCount: {
      type: Number,
      default: 0
    },
    firstAttemptDate: Date,
    lastAttemptDate: Date,
    solvedDate: Date,
    timeTakenMinutes: Number,
    approachNotes: {
      type: String,
      maxlength: 500
    }
  },
  {
    timestamps: true
  }
);

// Compound index for unique constraint
questionProgressSchema.index({ studentId: 1, questionId: 1 }, { unique: true });
questionProgressSchema.index({ studentId: 1 });
questionProgressSchema.index({ isSolved: 1 });
questionProgressSchema.index({ isBookmarked: 1 });
questionProgressSchema.index({ solvedDate: -1 });

module.exports = mongoose.model('QuestionProgress', questionProgressSchema);
