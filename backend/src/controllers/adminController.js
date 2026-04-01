const User = require('../models/User');
const LearningPath = require('../models/LearningPath');
const CompanyQuestion = require('../models/CompanyQuestion');
const StudentProgress = require('../models/StudentProgress');
const QuestionProgress = require('../models/QuestionProgress');
const MockInterview = require('../models/MockInterview');
const Resume = require('../models/Resume');
const Note = require('../models/Note');
const DailyTask = require('../models/DailyTask');
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

// Get all mock interviews (admin-wide)
exports.getAllMockInterviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 25, search, company, sortBy = 'interviewDate', order = 'desc' } = req.query;

    const query = {};
    if (company && company !== 'All') {
      query.company = company;
    }

    if (search) {
      query.$or = [
        { company: { $regex: search, $options: 'i' } },
        { overallFeedback: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const sortField = ['score', 'interviewDate', 'createdAt'].includes(sortBy) ? sortBy : 'interviewDate';
    const sortObj = { [sortField]: order === 'asc' ? 1 : -1 };

    const interviews = await MockInterview.find(query)
      .populate('studentId', 'name email')
      .skip(skip)
      .limit(parseInt(limit, 10))
      .sort(sortObj);

    const total = await MockInterview.countDocuments(query);

    res.status(200).json({
      success: true,
      data: interviews,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create mock interview (admin-wide)
exports.createMockInterview = async (req, res, next) => {
  try {
    const { studentId, company, interviewDate, score, overallFeedback, technicalSkills, communication, problemSolving, improvements, interviewerName, duration } = req.body;

    if (!studentId || !company || !interviewDate || score === undefined) {
      return next(new AppError('studentId, company, interviewDate, and score are required', 400, 'VALIDATION_ERROR'));
    }

    const student = await User.findOne({ _id: studentId, role: 'student' }).select('_id email');
    if (!student) {
      return next(new AppError('Student not found', 404, 'NOT_FOUND'));
    }

    if (score < 0 || score > 100) {
      return next(new AppError('Score must be between 0-100', 400, 'VALIDATION_ERROR'));
    }

    const interview = new MockInterview({
      studentId,
      company,
      interviewDate,
      score,
      overallFeedback,
      technicalSkills,
      communication,
      problemSolving,
      improvements,
      interviewerName,
      duration
    });

    await interview.save();

    await logAdminAudit(req, {
      action: 'CREATE_MOCK_INTERVIEW',
      targetType: 'MockInterview',
      targetId: interview._id,
      status: 'SUCCESS',
      metadata: { studentId }
    });

    res.status(201).json({
      success: true,
      data: interview,
      message: 'Mock interview created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Update mock interview (admin-wide)
exports.updateMockInterview = async (req, res, next) => {
  try {
    const { interviewId } = req.params;
    const updateData = req.body;

    if (updateData.score !== undefined && (updateData.score < 0 || updateData.score > 100)) {
      return next(new AppError('Score must be between 0-100', 400, 'VALIDATION_ERROR'));
    }

    const interview = await MockInterview.findByIdAndUpdate(interviewId, updateData, {
      new: true,
      runValidators: true
    });

    if (!interview) {
      return next(new AppError('Interview not found', 404, 'NOT_FOUND'));
    }

    await logAdminAudit(req, {
      action: 'UPDATE_MOCK_INTERVIEW',
      targetType: 'MockInterview',
      targetId: interviewId,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      data: interview,
      message: 'Mock interview updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete mock interview (admin-wide)
exports.deleteMockInterview = async (req, res, next) => {
  try {
    const { interviewId } = req.params;

    const interview = await MockInterview.findByIdAndDelete(interviewId);

    if (!interview) {
      return next(new AppError('Interview not found', 404, 'NOT_FOUND'));
    }

    await logAdminAudit(req, {
      action: 'DELETE_MOCK_INTERVIEW',
      targetType: 'MockInterview',
      targetId: interviewId,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      message: 'Mock interview deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Daily task management
exports.getDailyTasks = async (req, res, next) => {
  try {
    const { page = 1, limit = 25, search, platform, difficulty, isActive } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { tags: { $elemMatch: { $regex: search, $options: 'i' } } }
      ];
    }
    if (platform && platform !== 'All') query.platform = platform;
    if (difficulty && difficulty !== 'All') query.difficulty = difficulty;
    if (isActive === 'true') query.isActive = true;
    if (isActive === 'false') query.isActive = false;

    const safePage = parseInt(page, 10);
    const safeLimit = parseInt(limit, 10);
    const skip = (safePage - 1) * safeLimit;

    const [rows, total] = await Promise.all([
      DailyTask.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
      DailyTask.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getDailyTaskById = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await DailyTask.findById(taskId);

    if (!task) {
      return next(new AppError('Daily task not found', 404, 'NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

exports.createDailyTask = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      tags: Array.isArray(req.body.tags)
        ? req.body.tags.map((tag) => String(tag).trim()).filter(Boolean)
        : []
    };

    const task = await DailyTask.create(payload);

    await logAdminAudit(req, {
      action: 'CREATE_DAILY_TASK',
      targetType: 'DailyTask',
      targetId: task._id,
      status: 'SUCCESS'
    });

    res.status(201).json({
      success: true,
      data: task,
      message: 'Daily task created successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.updateDailyTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const payload = {
      ...req.body,
      tags: Array.isArray(req.body.tags)
        ? req.body.tags.map((tag) => String(tag).trim()).filter(Boolean)
        : req.body.tags
    };

    const task = await DailyTask.findByIdAndUpdate(taskId, payload, {
      new: true,
      runValidators: true
    });

    if (!task) {
      return next(new AppError('Daily task not found', 404, 'NOT_FOUND'));
    }

    await logAdminAudit(req, {
      action: 'UPDATE_DAILY_TASK',
      targetType: 'DailyTask',
      targetId: taskId,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      data: task,
      message: 'Daily task updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteDailyTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await DailyTask.findByIdAndDelete(taskId);

    if (!task) {
      return next(new AppError('Daily task not found', 404, 'NOT_FOUND'));
    }

    await logAdminAudit(req, {
      action: 'DELETE_DAILY_TASK',
      targetType: 'DailyTask',
      targetId: taskId,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      message: 'Daily task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Profile management
exports.getAllProfiles = async (req, res, next) => {
  try {
    const { page = 1, limit = 25, search } = req.query;
    const query = { role: 'student' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { university: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    const safePage = parseInt(page, 10);
    const safeLimit = parseInt(limit, 10);
    const skip = (safePage - 1) * safeLimit;

    const [profiles, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: profiles,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getProfileById = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const profile = await User.findOne({ _id: userId, role: 'student' }).select('-password');

    if (!profile) {
      return next(new AppError('Profile not found', 404, 'NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

exports.createProfile = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      bio = '',
      avatar = null,
      university = '',
      graduationYear = null,
      department = '',
      githubProfile = null,
      linkedinProfile = null,
      portfolioLink = null,
      isActive = true
    } = req.body;

    if (!name || !email) {
      return next(new AppError('Name and email are required', 400, 'VALIDATION_ERROR'));
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return next(new AppError('Email already exists', 409, 'EMAIL_EXISTS'));
    }

    const temporaryPassword = password || buildTempPassword();
    const profile = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: temporaryPassword,
      role: 'student',
      bio,
      avatar,
      university,
      graduationYear,
      department,
      githubProfile,
      linkedinProfile,
      portfolioLink,
      isActive,
      mustResetPassword: true
    });

    await logAdminAudit(req, {
      action: 'CREATE_PROFILE',
      targetType: 'User',
      targetId: profile._id,
      status: 'SUCCESS'
    });

    res.status(201).json({
      success: true,
      data: {
        ...profile.toJSON(),
        temporaryPassword
      },
      message: 'Profile created successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const updateData = { ...req.body };

    delete updateData.password;
    delete updateData.role;

    if (updateData.email) {
      const normalizedEmail = String(updateData.email).toLowerCase().trim();
      const exists = await User.findOne({ email: normalizedEmail, _id: { $ne: userId } });
      if (exists) {
        return next(new AppError('Email already exists', 409, 'EMAIL_EXISTS'));
      }
      updateData.email = normalizedEmail;
    }

    const profile = await User.findOneAndUpdate(
      { _id: userId, role: 'student' },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!profile) {
      return next(new AppError('Profile not found', 404, 'NOT_FOUND'));
    }

    await logAdminAudit(req, {
      action: 'UPDATE_PROFILE',
      targetType: 'User',
      targetId: userId,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      data: profile,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const profile = await User.findOneAndDelete({ _id: userId, role: 'student' });
    if (!profile) {
      return next(new AppError('Profile not found', 404, 'NOT_FOUND'));
    }

    await Promise.all([
      StudentProgress.deleteMany({ studentId: userId }),
      QuestionProgress.deleteMany({ studentId: userId }),
      MockInterview.deleteMany({ studentId: userId }),
      Resume.deleteMany({ studentId: userId }),
      Note.deleteMany({ studentId: userId })
    ]);

    await logAdminAudit(req, {
      action: 'DELETE_PROFILE',
      targetType: 'User',
      targetId: userId,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
