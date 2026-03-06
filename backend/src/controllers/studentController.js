const User = require('../models/User');
const StudentProgress = require('../models/StudentProgress');
const QuestionProgress = require('../models/QuestionProgress');
const MockInterview = require('../models/MockInterview');
const StudyActivity = require('../models/StudyActivity');
const LearningPath = require('../models/LearningPath');
const { AppError } = require('../utils/errorHandler');
const { validateEmail, validatePassword, validateName, validateUrl } = require('../utils/validators');

const ensureStudentOrAdmin = (req, id, action) => {
  if (req.user._id.toString() !== id && req.user.role !== 'admin') {
    throw new AppError(`You do not have permission to ${action}`, 403, 'UNAUTHORIZED');
  }
};

// Dashboard progress summary
exports.getDashboardProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    ensureStudentOrAdmin(req, id, 'view this progress');

    const [allPaths, progressRows, solvedQuestions, allInterviews] = await Promise.all([
      LearningPath.countDocuments({ status: 'Active' }),
      StudentProgress.find({ studentId: id }),
      QuestionProgress.countDocuments({ studentId: id, isSolved: true }),
      MockInterview.countDocuments({ studentId: id }),
    ]);

    const completedPaths = progressRows.filter((row) => row.status === 'Completed').length;
    const progressPercent = allPaths > 0 ? Math.round((completedPaths / allPaths) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        overallProgressPercentage: progressPercent,
        learningPathsCompleted: completedPaths,
        totalLearningPaths: allPaths,
        questionsSolved: solvedQuestions,
        totalQuestions: 250,
        mockInterviewsCompleted: allInterviews,
        totalMockInterviews: 20,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Student streak based on activity dates
exports.getStudyStreak = async (req, res, next) => {
  try {
    const { id } = req.params;
    ensureStudentOrAdmin(req, id, 'view streak information');

    const activities = await StudyActivity.find({ studentId: id }).sort({ activityDate: -1 }).select('activityDate');

    if (!activities.length) {
      return res.status(200).json({
        success: true,
        data: {
          currentStreak: 0,
          lastStudiedAt: null,
        },
      });
    }

    const uniqueDays = [...new Set(activities.map((item) => new Date(item.activityDate).toDateString()))]
      .map((day) => new Date(day))
      .sort((a, b) => b - a);

    let streak = 0;
    let cursor = new Date(uniqueDays[0]);

    for (const day of uniqueDays) {
      const diffDays = Math.floor((cursor.setHours(0, 0, 0, 0) - new Date(day).setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
      if (diffDays === streak) {
        streak += 1;
      } else {
        break;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        currentStreak: streak,
        lastStudiedAt: uniqueDays[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// Today's activity summary
exports.getTodayActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    ensureStudentOrAdmin(req, id, 'view daily activity');

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrow = new Date(todayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const rows = await StudyActivity.find({
      studentId: id,
      activityDate: { $gte: todayStart, $lt: tomorrow },
    });

    const questionsSolved = rows.filter((row) => row.activityType === 'question_solved').length;
    const tasksCompleted = rows.filter((row) => row.activityType === 'task_completed').length;
    const timeStudiedMinutes = rows.reduce((sum, row) => sum + (row.durationMinutes || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        questionsSolved,
        tasksCompleted,
        timeStudiedMinutes,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.logTodayActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { activityType = 'study_session', durationMinutes = 0, description = '' } = req.body;
    ensureStudentOrAdmin(req, id, 'log activity');

    const activity = await StudyActivity.create({
      studentId: id,
      activityDate: new Date(),
      activityType,
      durationMinutes,
      description,
    });

    res.status(201).json({
      success: true,
      data: activity,
      message: 'Activity logged successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.getCurrentLearningPath = async (req, res, next) => {
  try {
    const { id } = req.params;
    ensureStudentOrAdmin(req, id, 'view learning path');

    const [nextProgress, nextPath] = await Promise.all([
      StudentProgress.findOne({ studentId: id, status: { $ne: 'Completed' } }).sort({ weekId: 1 }),
      LearningPath.findOne({ status: 'Active' }).sort({ week: 1 }),
    ]);

    const weekId = nextProgress?.weekId || nextPath?.week;
    const path = weekId ? await LearningPath.findOne({ week: weekId }) : null;
    const upcoming = weekId ? await LearningPath.findOne({ week: weekId + 1 }) : null;

    res.status(200).json({
      success: true,
      data: {
        currentWeek: path?.week ?? null,
        topic: path?.topic ?? null,
        progressPercentage: nextProgress?.completionPercentage ?? 0,
        nextTopic: upcoming?.topic ?? null,
      },
    });
  } catch (error) {
    next(error);
  }
};

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
