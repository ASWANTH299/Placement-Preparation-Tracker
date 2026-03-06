const mongoose = require('mongoose');

const learningPathSchema = new mongoose.Schema(
  {
    topicId: {
      type: String,
      trim: true,
      lowercase: true,
      index: true
    },
    order: {
      type: Number,
      min: 1,
      index: true
    },
    week: {
      type: Number,
      required: false,
      unique: false,
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
    explanation: {
      type: String,
      maxlength: 5000,
      default: ''
    },
    javaSyntaxExample: {
      type: String,
      maxlength: 10000,
      default: ''
    },
    pseudocodeExplanation: {
      type: String,
      maxlength: 10000,
      default: ''
    },
    problems: [
      {
        title: {
          type: String,
          required: true,
          maxlength: 250,
          trim: true
        },
        description: {
          type: String,
          required: true,
          maxlength: 5000
        },
        pseudocode: {
          type: String,
          default: ''
        },
        javaSolution: {
          type: String,
          default: ''
        }
      }
    ],
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
learningPathSchema.index({ topicId: 1 }, { unique: true, sparse: true });
learningPathSchema.index({ order: 1 });
learningPathSchema.index({ status: 1 });

module.exports = mongoose.model('LearningPath', learningPathSchema);
