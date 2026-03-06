const User = require('../models/User');
const LearningPath = require('../models/LearningPath');
const CompanyQuestion = require('../models/CompanyQuestion');
const StudentProgress = require('../models/StudentProgress');
const QuestionProgress = require('../models/QuestionProgress');
const MockInterview = require('../models/MockInterview');
const Resume = require('../models/Resume');
const Note = require('../models/Note');
const { AppError } = require('../utils/errorHandler');

// Get dashboard statistics
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Check admin
    if (req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to view dashboard', 403, 'UNAUTHORIZED'));
    }

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

    const allProgress = await StudentProgress.find();
    const avgProgressPercentage = allProgress.length > 0
      ? Math.round(allProgress.reduce((sum, p) => sum + p.completionPercentage, 0) / allProgress.length)
      : 0;

    const totalQuestionsSolved = await QuestionProgress.countDocuments({ isSolved: true });
    const avgQuestionsPerStudent = totalUsers > 0 ? (totalQuestionsSolved / totalUsers).toFixed(1) : 0;

    const totalInterviews = await MockInterview.countDocuments();
    const interviews = await MockInterview.find();
    const avgMockScore = interviews.length > 0
      ? Math.round(interviews.reduce((sum, i) => sum + i.score, 0) / interviews.length * 10) / 10
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsersThisMonth,
        newUsersThisMonth,
        averageProgressPercentage: avgProgressPercentage,
        totalQuestionsSolved,
        averageQuestionsPerStudent: parseFloat(avgQuestionsPerStudent),
        totalMockInterviews: totalInterviews,
        averageMockScore: avgMockScore,
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
    if (req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to view users', 403, 'UNAUTHORIZED'));
    }

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
    if (req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to view user details', 403, 'UNAUTHORIZED'));
    }

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
    if (req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to update users', 403, 'UNAUTHORIZED'));
    }

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
    if (req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to delete users', 403, 'UNAUTHORIZED'));
    }

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
    if (req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to create learning paths', 403, 'UNAUTHORIZED'));
    }

    const path = new LearningPath(req.body);
    await path.save();

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
    if (req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to update learning paths', 403, 'UNAUTHORIZED'));
    }

    const { topicId } = req.params;

    const path = await LearningPath.findByIdAndUpdate(topicId, req.body, { new: true, runValidators: true });

    if (!path) {
      return next(new AppError('Learning path not found', 404, 'NOT_FOUND'));
    }

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
    if (req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to delete learning paths', 403, 'UNAUTHORIZED'));
    }

    const { topicId } = req.params;

    const path = await LearningPath.findByIdAndDelete(topicId);

    if (!path) {
      return next(new AppError('Learning path not found', 404, 'NOT_FOUND'));
    }

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
    if (req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to create questions', 403, 'UNAUTHORIZED'));
    }

    const question = new CompanyQuestion(req.body);
    await question.save();

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
    if (req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to update questions', 403, 'UNAUTHORIZED'));
    }

    const { questionId } = req.params;

    const question = await CompanyQuestion.findByIdAndUpdate(questionId, req.body, { new: true, runValidators: true });

    if (!question) {
      return next(new AppError('Question not found', 404, 'NOT_FOUND'));
    }

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
    if (req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to delete questions', 403, 'UNAUTHORIZED'));
    }

    const { questionId } = req.params;

    const question = await CompanyQuestion.findByIdAndDelete(questionId);

    if (!question) {
      return next(new AppError('Question not found', 404, 'NOT_FOUND'));
    }

    // Delete related progress
    await QuestionProgress.deleteMany({ questionId });

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
