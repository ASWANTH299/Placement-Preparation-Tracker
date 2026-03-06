const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      minlength: 5,
      maxlength: 200,
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: 10000
    },
    topics: [String],
    companies: [String],
    visibility: {
      type: String,
      enum: ['Private', 'Public'],
      default: 'Private'
    },
    viewCount: {
      type: Number,
      default: 0
    },
    isPinned: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes
noteSchema.index({ studentId: 1 });
noteSchema.index({ visibility: 1 });
noteSchema.index({ createdAt: -1 });
noteSchema.index({ visibility: 1, createdAt: -1 });
noteSchema.index({ topics: 1 });

module.exports = mongoose.model('Note', noteSchema);
