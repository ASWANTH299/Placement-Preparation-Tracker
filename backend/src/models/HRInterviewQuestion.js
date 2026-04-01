const mongoose = require('mongoose');

const hrInterviewQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
      maxlength: 300
    },
    answer: {
      type: String,
      required: [true, 'Answer is required'],
      trim: true,
      maxlength: 4000
    },
    explanation: {
      type: String,
      required: [true, 'Explanation is required'],
      trim: true,
      maxlength: 2000
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

hrInterviewQuestionSchema.index({ createdAt: -1 });
hrInterviewQuestionSchema.index({ isActive: 1 });

module.exports = mongoose.model('HRInterviewQuestion', hrInterviewQuestionSchema);
