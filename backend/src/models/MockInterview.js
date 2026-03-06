const mongoose = require('mongoose');

const mockInterviewSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    company: {
      type: String,
      required: [true, 'Company is required']
    },
    interviewDate: {
      type: Date,
      required: [true, 'Interview date is required']
    },
    interviewTime: String,
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: 0,
      max: 100
    },
    overallFeedback: {
      type: String,
      required: [true, 'Overall feedback is required'],
      maxlength: 1000
    },
    technicalSkills: {
      type: String,
      maxlength: 500
    },
    communication: {
      type: String,
      maxlength: 500
    },
    problemSolving: {
      type: String,
      maxlength: 500
    },
    improvements: {
      type: String,
      maxlength: 500
    },
    interviewerName: {
      type: String,
      maxlength: 100
    },
    duration: Number
  },
  {
    timestamps: true
  }
);

// Indexes
mockInterviewSchema.index({ studentId: 1 });
mockInterviewSchema.index({ company: 1 });
mockInterviewSchema.index({ score: -1 });
mockInterviewSchema.index({ interviewDate: -1 });

module.exports = mongoose.model('MockInterview', mockInterviewSchema);
