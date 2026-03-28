const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      minlength: 2,
      maxlength: 100,
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: null,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student'
    },
    bio: {
      type: String,
      maxlength: 500,
      default: ''
    },
    avatar: {
      type: String,
      default: null
    },
    university: {
      type: String,
      maxlength: 100,
      default: ''
    },
    graduationYear: {
      type: Number,
      default: null
    },
    department: {
      type: String,
      maxlength: 100,
      default: ''
    },
    githubProfile: {
      type: String,
      default: null
    },
    linkedinProfile: {
      type: String,
      default: null
    },
    portfolioLink: {
      type: String,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    mustResetPassword: {
      type: Boolean,
      default: false
    },
    lastLogin: {
      type: Date,
      default: null
    },
    passwordResetOtpHash: {
      type: String,
      default: null,
      select: false,
    },
    passwordResetOtpExpiry: {
      type: Date,
      default: null,
      select: false,
    },
    passwordResetOtpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    passwordResetToken: String,
    passwordResetExpiry: Date
  },
  {
    timestamps: true
  }
);

// Index for email uniqueness and role queries
userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 }, { unique: true, sparse: true });
userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcryptjs.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

// Method to get public data
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.passwordResetOtpHash;
  delete user.passwordResetOtpExpiry;
  delete user.passwordResetOtpAttempts;
  delete user.passwordResetToken;
  delete user.passwordResetExpiry;
  return user;
};

module.exports = mongoose.model('User', userSchema);
