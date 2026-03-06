const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    fileName: {
      type: String,
      required: [true, 'File name is required']
    },
    filePath: {
      type: String,
      required: [true, 'File path is required']
    },
    fileSize: {
      type: Number,
      required: true
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx'],
      required: true
    },
    isActive: {
      type: Boolean,
      default: false
    },
    customName: {
      type: String,
      maxlength: 100
    }
  },
  {
    timestamps: true
  }
);

// Indexes
resumeSchema.index({ studentId: 1 });
resumeSchema.index({ isActive: 1 });
resumeSchema.index(
  { studentId: 1, isActive: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true }
  }
);

module.exports = mongoose.model('Resume', resumeSchema);
