const mongoose = require('mongoose');

const passwordResetOtpSessionSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
      select: false,
    },
    otpExpiry: {
      type: Date,
      required: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
      select: false,
    },
    verifiedTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    verifiedTokenExpiry: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

passwordResetOtpSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 });

module.exports = mongoose.model('PasswordResetOtpSession', passwordResetOtpSessionSchema);
