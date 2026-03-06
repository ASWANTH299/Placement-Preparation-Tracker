const LearningPath = require('../models/LearningPath');
const StudentProgress = require('../models/StudentProgress');
const { AppError } = require('../utils/errorHandler');

// Get all learning paths
exports.getAllLearningPaths = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, status, difficulty } = req.query;

    const query = {};
    if (status) query.status = status;
    if (difficulty) query.difficulty = difficulty;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const paths = await LearningPath.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ week: 1 });

    const total = await LearningPath.countDocuments(query);

    res.status(200).json({
      success: true,
      data: paths,
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

// Get learning path by week ID
exports.getLearningPathByWeek = async (req, res, next) => {
  try {
    const { weekId } = req.params;

    const path = await LearningPath.findOne({ week: weekId });

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

// Get student's learning progress
exports.getStudentProgress = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to view this progress', 403, 'UNAUTHORIZED'));
    }

    const progress = await StudentProgress.find({ studentId: id })
      .populate({
        path: 'studentId',
        select: 'name email'
      });

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    next(error);
  }
};

// Get progress for specific week
exports.getWeekProgress = async (req, res, next) => {
  try {
    const { id, weekId } = req.params;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to view this progress', 403, 'UNAUTHORIZED'));
    }

    const progress = await StudentProgress.findOne({
      studentId: id,
      weekId: parseInt(weekId)
    });

    if (!progress) {
      return next(new AppError('Progress not found', 404, 'NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    next(error);
  }
};

// Update progress for a week
exports.updateWeekProgress = async (req, res, next) => {
  try {
    const { id, weekId } = req.params;
    const { status, completionPercentage, notes } = req.body;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to update this progress', 403, 'UNAUTHORIZED'));
    }

    // Validate inputs
    if (status && !['Not Started', 'In Progress', 'Completed'].includes(status)) {
      return next(new AppError('Invalid status', 400, 'VALIDATION_ERROR'));
    }

    if (completionPercentage !== undefined) {
      if (completionPercentage < 0 || completionPercentage > 100) {
        return next(new AppError('Completion percentage must be between 0-100', 400, 'VALIDATION_ERROR'));
      }
    }

    let progress = await StudentProgress.findOne({
      studentId: id,
      weekId: parseInt(weekId)
    });

    if (!progress) {
      // Create new progress record
      progress = new StudentProgress({
        studentId: id,
        weekId: parseInt(weekId),
        status: status || 'Not Started',
        completionPercentage: completionPercentage || 0
      });
    }

    // Update fields
    if (status) {
      if (status !== 'Not Started' && !progress.startedAt) {
        progress.startedAt = new Date();
      }
      if (status === 'Completed' && !progress.completedAt) {
        progress.completedAt = new Date();
      }
      progress.status = status;
    }

    if (completionPercentage !== undefined) {
      progress.completionPercentage = completionPercentage;
    }

    if (notes) {
      progress.notes.push({
        content: notes,
        createdAt: new Date()
      });
    }

    await progress.save();

    res.status(200).json({
      success: true,
      data: progress,
      message: 'Progress updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Add note to week
exports.addNote = async (req, res, next) => {
  try {
    const { id, weekId } = req.params;
    const { content } = req.body;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to add notes', 403, 'UNAUTHORIZED'));
    }

    if (!content || content.length > 1000) {
      return next(new AppError('Note must be between 1-1000 characters', 400, 'VALIDATION_ERROR'));
    }

    let progress = await StudentProgress.findOne({
      studentId: id,
      weekId: parseInt(weekId)
    });

    if (!progress) {
      progress = new StudentProgress({
        studentId: id,
        weekId: parseInt(weekId)
      });
    }

    const note = {
      content,
      createdAt: new Date()
    };

    progress.notes.push(note);
    await progress.save();

    res.status(201).json({
      success: true,
      data: note
    });
  } catch (error) {
    next(error);
  }
};
