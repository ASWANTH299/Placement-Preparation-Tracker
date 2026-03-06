const User = require('../models/User');
const { AppError } = require('../utils/errorHandler');
const { validateEmail, validatePassword, validateName, validateUrl } = require('../utils/validators');

// Get student profile
exports.getProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to view this profile', 403, 'UNAUTHORIZED'));
    }

    const user = await User.findById(id);

    if (!user) {
      return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
        university: user.university,
        graduationYear: user.graduationYear,
        department: user.department,
        githubProfile: user.githubProfile,
        linkedinProfile: user.linkedinProfile,
        portfolioLink: user.portfolioLink,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update student profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, bio, avatar, university, graduationYear, department, githubProfile, linkedinProfile, portfolioLink } = req.body;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to update this profile', 403, 'UNAUTHORIZED'));
    }

    const user = await User.findById(id);

    if (!user) {
      return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    // Validate inputs
    if (name && !validateName(name)) {
      return next(new AppError('Name must be between 2-100 characters', 400, 'VALIDATION_ERROR'));
    }

    if (bio && bio.length > 500) {
      return next(new AppError('Bio must not exceed 500 characters', 400, 'VALIDATION_ERROR'));
    }

    if (githubProfile && !validateUrl(githubProfile)) {
      return next(new AppError('Invalid GitHub URL', 400, 'VALIDATION_ERROR'));
    }

    if (linkedinProfile && !validateUrl(linkedinProfile)) {
      return next(new AppError('Invalid LinkedIn URL', 400, 'VALIDATION_ERROR'));
    }

    if (portfolioLink && !validateUrl(portfolioLink)) {
      return next(new AppError('Invalid Portfolio URL', 400, 'VALIDATION_ERROR'));
    }

    // Update fields
    if (name) user.name = name.trim();
    if (bio) user.bio = bio;
    if (avatar) user.avatar = avatar;
    if (university) user.university = university;
    if (graduationYear) user.graduationYear = graduationYear;
    if (department) user.department = department;
    if (githubProfile) user.githubProfile = githubProfile;
    if (linkedinProfile) user.linkedinProfile = linkedinProfile;
    if (portfolioLink) user.portfolioLink = portfolioLink;

    await user.save();

    res.status(200).json({
      success: true,
      data: user.toJSON(),
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Change password
exports.changePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to change this password', 403, 'UNAUTHORIZED'));
    }

    const user = await User.findById(id).select('+password');

    if (!user) {
      return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    // Verify current password
    if (!(await user.comparePassword(currentPassword))) {
      return next(new AppError('Current password is incorrect', 401, 'AUTH_FAILED'));
    }

    // Validate new password
    if (!validatePassword(newPassword)) {
      return next(new AppError('Password must contain uppercase, lowercase, number, and special character', 400, 'PASSWORD_INVALID'));
    }

    if (newPassword !== confirmPassword) {
      return next(new AppError('Passwords do not match', 400, 'VALIDATION_ERROR'));
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get profile links (GitHub, LinkedIn, Portfolio)
exports.getProfileLinks = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to view these profiles', 403, 'UNAUTHORIZED'));
    }

    const user = await User.findById(id);

    if (!user) {
      return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: {
        githubProfile: user.githubProfile,
        linkedinProfile: user.linkedinProfile,
        portfolioLink: user.portfolioLink
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update profile links (GitHub, LinkedIn, Portfolio)
exports.updateProfileLinks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { githubProfile, linkedinProfile, portfolioLink } = req.body;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to update these profiles', 403, 'UNAUTHORIZED'));
    }

    const user = await User.findById(id);

    if (!user) {
      return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    // Validate URLs if provided
    if (githubProfile && !validateUrl(githubProfile)) {
      return next(new AppError('Invalid GitHub URL', 400, 'VALIDATION_ERROR'));
    }

    if (linkedinProfile && !validateUrl(linkedinProfile)) {
      return next(new AppError('Invalid LinkedIn URL', 400, 'VALIDATION_ERROR'));
    }

    if (portfolioLink && !validateUrl(portfolioLink)) {
      return next(new AppError('Invalid Portfolio URL', 400, 'VALIDATION_ERROR'));
    }

    // Update fields
    if (githubProfile !== undefined) user.githubProfile = githubProfile || null;
    if (linkedinProfile !== undefined) user.linkedinProfile = linkedinProfile || null;
    if (portfolioLink !== undefined) user.portfolioLink = portfolioLink || null;

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        githubProfile: user.githubProfile,
        linkedinProfile: user.linkedinProfile,
        portfolioLink: user.portfolioLink
      },
      message: 'Profile links updated successfully'
    });
  } catch (error) {
    next(error);
  }
};
