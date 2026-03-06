const mongoose = require('mongoose');

const companyQuestionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      maxlength: 200,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 5000
    },
    company: {
      type: String,
      required: [true, 'Company is required']
    },
    topics: {
      type: [String],
      required: [true, 'At least one topic is required']
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: true
    },
    exampleInput: String,
    exampleOutput: String,
    inputOutputExamples: [
      {
        input: String,
        output: String,
        explanation: String
      }
    ],
    constraints: String,
    hints: String,
    pseudocode: String,
    javaSolution: String,
    explanation: String,
    timeComplexity: String,
    spaceComplexity: String,
    solutionApproach: String,
    solutionCode: String,
    tags: [String],
    status: {
      type: String,
      enum: ['Active', 'Archived'],
      default: 'Active'
    },
    solvedCount: {
      type: Number,
      default: 0
    },
    viewCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Indexes
companyQuestionSchema.index({ company: 1 });
companyQuestionSchema.index({ difficulty: 1 });
companyQuestionSchema.index({ topics: 1 });
companyQuestionSchema.index({ solvedCount: -1 });
companyQuestionSchema.index({ status: 1 });
companyQuestionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CompanyQuestion', companyQuestionSchema);
