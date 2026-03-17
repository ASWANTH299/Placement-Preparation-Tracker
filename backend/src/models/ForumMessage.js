const mongoose = require('mongoose');

const forumMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: 1,
      maxlength: 1000
    },
    parentMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ForumMessage',
      default: null
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

forumMessageSchema.index({ created_at: 1 });
forumMessageSchema.index({ parentMessageId: 1, created_at: 1 });
forumMessageSchema.index({ userId: 1, created_at: -1 });

module.exports = mongoose.model('ForumMessage', forumMessageSchema);
