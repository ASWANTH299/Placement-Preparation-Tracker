const mongoose = require('mongoose');

const conceptVideoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 180
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true,
      maxlength: 100
    },
    youtubeUrl: {
      type: String,
      required: [true, 'YouTube URL is required'],
      trim: true,
      validate: {
        validator: (value) => {
          try {
            const parsed = new URL(String(value || '').trim());
            const host = String(parsed.hostname || '').toLowerCase().replace(/^www\./, '');
            return host === 'youtube.com' || host === 'youtu.be';
          } catch {
            return false;
          }
        },
        message: 'Please provide a valid YouTube URL'
      }
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner'
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ''
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

conceptVideoSchema.index({ createdAt: -1 });
conceptVideoSchema.index({ topic: 1, level: 1 });
conceptVideoSchema.index({ isActive: 1 });

module.exports = mongoose.model('ConceptVideo', conceptVideoSchema);
