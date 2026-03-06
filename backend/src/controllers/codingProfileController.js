const CodingProfile = require('../models/CodingProfile');
const { AppError } = require('../utils/errorHandler');

// Get all coding profiles
exports.getCodingProfiles = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to view these profiles', 403, 'UNAUTHORIZED'));
    }

    const profiles = await CodingProfile.find({ studentId: id });

    res.status(200).json({
      success: true,
      data: profiles
    });
  } catch (error) {
    next(error);
  }
};

// Link coding profile
exports.linkProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { platform, username } = req.body;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to link profiles', 403, 'UNAUTHORIZED'));
    }

    // Validation
    const validPlatforms = ['LeetCode', 'CodeChef', 'HackerRank', 'Codeforces'];
    if (!validPlatforms.includes(platform)) {
      return next(new AppError('Invalid platform', 400, 'VALIDATION_ERROR'));
    }

    if (!username || username.length > 50) {
      return next(new AppError('Username must be between 1-50 characters', 400, 'VALIDATION_ERROR'));
    }

    // Check if profile already exists
    const existing = await CodingProfile.findOne({ studentId: id, platform });
    if (existing) {
      return next(new AppError('Profile already exists for this platform', 409, 'DUPLICATE_ENTRY'));
    }

    // Generate profile URL
    const profileUrls = {
      'LeetCode': `https://leetcode.com/${username}`,
      'CodeChef': `https://www.codechef.com/users/${username}`,
      'HackerRank': `https://www.hackerrank.com/${username}`,
      'Codeforces': `https://codeforces.com/profile/${username}`
    };

    const profile = new CodingProfile({
      studentId: id,
      platform,
      username,
      profileUrl: profileUrls[platform]
    });

    await profile.save();

    res.status(201).json({
      success: true,
      data: {
        platform: profile.platform,
        username: profile.username,
        profileUrl: profile.profileUrl,
        linkedAt: profile.createdAt
      },
      message: 'Profile linked successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Refresh profile stats
exports.refreshProfile = async (req, res, next) => {
  try {
    const { id, platformId } = req.params;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to sync profiles', 403, 'UNAUTHORIZED'));
    }

    const profile = await CodingProfile.findOne({ _id: platformId, studentId: id });

    if (!profile) {
      return next(new AppError('Profile not found', 404, 'NOT_FOUND'));
    }

    // In production, fetch from external API
    // For now, just update lastSyncedAt
    profile.lastSyncedAt = new Date();
    profile.syncStatus = 'Success';
    await profile.save();

    res.status(200).json({
      success: true,
      data: {
        platform: profile.platform,
        username: profile.username,
        problemsSolved: profile.problemsSolved,
        currentRating: profile.currentRating,
        lastSyncedAt: profile.lastSyncedAt
      },
      message: 'Profile stats updated'
    });
  } catch (error) {
    next(error);
  }
};

// Unlink profile
exports.unlinkProfile = async (req, res, next) => {
  try {
    const { id, platformId } = req.params;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to unlink profiles', 403, 'UNAUTHORIZED'));
    }

    const profile = await CodingProfile.findOneAndDelete({ _id: platformId, studentId: id });

    if (!profile) {
      return next(new AppError('Profile not found', 404, 'NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      message: 'Profile unlinked successfully'
    });
  } catch (error) {
    next(error);
  }
};
