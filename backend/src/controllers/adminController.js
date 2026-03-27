const User = require('../models/User');
const LearningPath = require('../models/LearningPath');
const CompanyQuestion = require('../models/CompanyQuestion');
const StudentProgress = require('../models/StudentProgress');
const QuestionProgress = require('../models/QuestionProgress');
const MockInterview = require('../models/MockInterview');
const Resume = require('../models/Resume');
const Note = require('../models/Note');
const { AppError } = require('../utils/errorHandler');
const { logAdminAudit } = require('../utils/adminAuditLogger');

const buildTempPassword = () => {
  const randomPart = Math.random().toString(36).slice(-6);
  return `Temp@${randomPart}A1`;
};

const getAnalyticsPayload = async () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalUsers = await User.countDocuments({ role: 'student' });
  const activeUsersThisMonth = await User.countDocuments({
    role: 'student',
    lastLogin: { $gte: monthStart }
  });
  const newUsersThisMonth = await User.countDocuments({
    role: 'student',
    createdAt: { $gte: monthStart }
  });

  const allProgress = await StudentProgress.find().select('completionPercentage');
  const avgProgressPercentage = allProgress.length > 0
    ? Math.round(allProgress.reduce((sum, p) => sum + (p.completionPercentage || 0), 0) / allProgress.length)
    : 0;

  const totalQuestionsSolved = await QuestionProgress.countDocuments({ isSolved: true });
  const avgQuestionsPerStudent = totalUsers > 0 ? totalQuestionsSolved / totalUsers : 0;

  const interviews = await MockInterview.find().select('score');
  const avgMockScore = interviews.length > 0
    ? Math.round((interviews.reduce((sum, i) => sum + (i.score || 0), 0) / interviews.length) * 10) / 10
    : 0;

  return {
    totalUsers,
    activeUsersThisMonth,
    newUsersThisMonth,
    averageProgressPercentage: avgProgressPercentage,
    totalQuestionsSolved,
    averageQuestionsPerStudent: Math.round(avgQuestionsPerStudent * 10) / 10,
    totalMockInterviews: interviews.length,
    averageMockScore: avgMockScore
  };
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res, next) => {
  try {
    const analytics = await getAnalyticsPayload();

    res.status(200).json({
      success: true,
      data: {
        ...analytics,
        systemUptime: 99.95,
        dbResponseTimeMs: 12.5,
        apiRequestsPerMinute: 1240
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all users
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 25, search, sortBy = 'created', order = 'desc' } = req.query;

    const query = { role: 'student' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = {};
    if (sortBy === 'progress') sortObj.progressPercentage = order === 'asc' ? 1 : -1;
    else if (sortBy === 'name') sortObj.name = order === 'asc' ? 1 : -1;
    else sortObj.createdAt = order === 'asc' ? 1 : -1;

    const users = await User.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortObj)
      .select('-password');

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get user detail
exports.getUserDetail = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return next(new AppError('User not found', 404, 'NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Update user
exports.updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Don't allow role changes
    if (updateData.role) {
      delete updateData.role;
    }
    if (updateData.password) {
      delete updateData.password;
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-password');

    if (!user) {
      return next(new AppError('User not found', 404, 'NOT_FOUND'));
    }

    await logAdminAudit(req, {
      action: 'UPDATE_USER',
      targetType: 'User',
      targetId: userId,
      status: 'SUCCESS',
      metadata: { changedFields: Object.keys(updateData || {}) }
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Delete user
exports.deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { confirmDelete } = req.body;

    if (!confirmDelete) {
      return next(new AppError('Confirmation required to delete user', 400, 'VALIDATION_ERROR'));
    }

    // Delete user and related data
    await User.findByIdAndDelete(userId);
    await StudentProgress.deleteMany({ studentId: userId });
    await QuestionProgress.deleteMany({ studentId: userId });
    await MockInterview.deleteMany({ studentId: userId });
    await Resume.deleteMany({ studentId: userId });
    await Note.deleteMany({ studentId: userId });

    await logAdminAudit(req, {
      action: 'DELETE_USER',
      targetType: 'User',
      targetId: userId,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      message: 'User deleted permanently'
    });
  } catch (error) {
    next(error);
  }
};

// Create learning path
exports.createLearningPath = async (req, res, next) => {
  try {
    const path = new LearningPath(req.body);
    await path.save();

    await logAdminAudit(req, {
      action: 'CREATE_LEARNING_PATH',
      targetType: 'LearningPath',
      targetId: path._id,
      status: 'SUCCESS'
    });

    res.status(201).json({
      success: true,
      data: path,
      message: 'Learning path created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Update learning path
exports.updateLearningPath = async (req, res, next) => {
  try {
    const { topicId } = req.params;

    const path = await LearningPath.findByIdAndUpdate(topicId, req.body, { new: true, runValidators: true });

    if (!path) {
      return next(new AppError('Learning path not found', 404, 'NOT_FOUND'));
    }

    await logAdminAudit(req, {
      action: 'UPDATE_LEARNING_PATH',
      targetType: 'LearningPath',
      targetId: topicId,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      data: path
    });
  } catch (error) {
    next(error);
  }
};

// Delete learning path
exports.deleteLearningPath = async (req, res, next) => {
  try {
    const { topicId } = req.params;

    const path = await LearningPath.findByIdAndDelete(topicId);

    if (!path) {
      return next(new AppError('Learning path not found', 404, 'NOT_FOUND'));
    }

    await logAdminAudit(req, {
      action: 'DELETE_LEARNING_PATH',
      targetType: 'LearningPath',
      targetId: topicId,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      message: 'Learning path deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Create company question
exports.createQuestion = async (req, res, next) => {
  try {
    const question = new CompanyQuestion(req.body);
    await question.save();

    await logAdminAudit(req, {
      action: 'CREATE_COMPANY_QUESTION',
      targetType: 'CompanyQuestion',
      targetId: question._id,
      status: 'SUCCESS'
    });

    res.status(201).json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
};

// Update question
exports.updateQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;

    const question = await CompanyQuestion.findByIdAndUpdate(questionId, req.body, { new: true, runValidators: true });

    if (!question) {
      return next(new AppError('Question not found', 404, 'NOT_FOUND'));
    }

    await logAdminAudit(req, {
      action: 'UPDATE_COMPANY_QUESTION',
      targetType: 'CompanyQuestion',
      targetId: questionId,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
};

// Delete question
exports.deleteQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;

    const question = await CompanyQuestion.findByIdAndDelete(questionId);

    if (!question) {
      return next(new AppError('Question not found', 404, 'NOT_FOUND'));
    }

    // Delete related progress
    await QuestionProgress.deleteMany({ questionId });

    await logAdminAudit(req, {
      action: 'DELETE_COMPANY_QUESTION',
      targetType: 'CompanyQuestion',
      targetId: questionId,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Create student user
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, university = '', department = '' } = req.body;

    if (!name || !email) {
      return next(new AppError('Name and email are required', 400, 'VALIDATION_ERROR'));
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return next(new AppError('Email already exists', 409, 'EMAIL_EXISTS'));
    }

    const temporaryPassword = password || buildTempPassword();
    const user = new User({
      name: String(name).trim(),
      email: normalizedEmail,
      password: temporaryPassword,
      role: 'student',
      university,
      department,
      mustResetPassword: true
    });

    await user.save();

    await logAdminAudit(req, {
      action: 'CREATE_USER',
      targetType: 'User',
      targetId: user._id,
      status: 'SUCCESS',
      metadata: { email: normalizedEmail }
    });

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustResetPassword: user.mustResetPassword,
        temporaryPassword
      },
      message: 'User created successfully with temporary credentials'
    });
  } catch (error) {
    next(error);
  }
};

// Analytics alias endpoint
exports.getAnalytics = async (req, res, next) => {
  try {
    const analytics = await getAnalyticsPayload();
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};
