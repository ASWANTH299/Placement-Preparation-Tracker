const mongoose = require('mongoose');

const projectFileSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
      trim: true
    },
    storedName: {
      type: String,
      required: true,
      trim: true
    },
    filePath: {
      type: String,
      required: true,
      trim: true
    },
    relativePath: {
      type: String,
      default: ''
    },
    size: {
      type: Number,
      required: true,
      min: 0
    },
    mimeType: {
      type: String,
      default: 'application/octet-stream'
    }
  },
  { _id: false }
);

const studentProjectSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    projectName: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    description: {
      type: String,
      default: '',
      maxlength: 1000
    },
    technologyStack: {
      type: [String],
      default: []
    },
    totalSize: {
      type: Number,
      required: true,
      min: 0
    },
    files: {
      type: [projectFileSchema],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: 'At least one project file is required'
      }
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

studentProjectSchema.index({ studentId: 1, createdAt: -1 });
studentProjectSchema.index({ studentId: 1, uploadDate: -1 });

module.exports = mongoose.model('StudentProject', studentProjectSchema);
