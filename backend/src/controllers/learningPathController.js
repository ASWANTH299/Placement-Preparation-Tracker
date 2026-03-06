const LearningPath = require('../models/LearningPath');
const StudentProgress = require('../models/StudentProgress');
const { AppError } = require('../utils/errorHandler');

const ensureStudentOrAdmin = (req, studentId) => {
  if (req.user._id.toString() !== studentId && req.user.role !== 'admin') {
    throw new AppError('You do not have permission to access this progress', 403, 'UNAUTHORIZED');
  }
};

const progressSnapshot = (topic, progress) => {
  const totalProblems = topic.problems?.length || 0;
  const completedProblemIndexes = progress?.completedProblemIndexes || [];
  const completedProblems = completedProblemIndexes.length;
  const completionPercentage = totalProblems > 0
    ? Math.round((completedProblems / totalProblems) * 100)
    : 0;

  return {
    totalProblems,
    completedProblems,
    completedProblemIndexes,
    completionPercentage,
    isCompleted: totalProblems > 0 && completedProblems === totalProblems
  };
};

// Get all learning topics (topic-based roadmap)
exports.getAllLearningPaths = async (req, res, next) => {
  try {
    const { status = 'Active', difficulty } = req.query;
    const query = {};

    if (status) query.status = status;
    if (difficulty) query.difficulty = difficulty;

    const topics = await LearningPath.find(query)
      .sort({ order: 1, week: 1, createdAt: 1 });

    let progressByTopic = new Map();
    if (req.user?._id) {
      const progressRows = await StudentProgress.find({
        studentId: req.user._id,
        topicId: { $in: topics.map((topic) => topic._id) }
      });
      progressByTopic = new Map(progressRows.map((row) => [row.topicId.toString(), row]));
    }

    const data = topics.map((topic) => {
      const progress = progressByTopic.get(topic._id.toString());
      const snapshot = progressSnapshot(topic, progress);
      return {
        ...topic.toObject(),
        ...snapshot,
        statusLabel: snapshot.isCompleted ? 'Completed' : snapshot.completedProblems > 0 ? 'In Progress' : 'Not Started'
      };
    });

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

// Get a topic by id (supports old week-id lookups for backward compatibility)
exports.getLearningPathByWeek = async (req, res, next) => {
  try {
    const { weekId } = req.params;

    const byObjectId = weekId.match(/^[0-9a-fA-F]{24}$/)
      ? await LearningPath.findById(weekId)
      : null;

    const topic = byObjectId || await LearningPath.findOne({
      $or: [
        { topicId: String(weekId).toLowerCase() },
        { week: Number(weekId) || -1 }
      ]
    });

    if (!topic) {
      return next(new AppError('Learning topic not found', 404, 'NOT_FOUND'));
    }

    let snapshot = {
      totalProblems: topic.problems?.length || 0,
      completedProblems: 0,
      completedProblemIndexes: [],
      completionPercentage: 0,
      isCompleted: false
    };

    if (req.user?._id) {
      const progress = await StudentProgress.findOne({
        studentId: req.user._id,
        topicId: topic._id
      });
      snapshot = progressSnapshot(topic, progress);
    }

    res.status(200).json({
      success: true,
      data: {
        ...topic.toObject(),
        ...snapshot,
        statusLabel: snapshot.isCompleted ? 'Completed' : snapshot.completedProblems > 0 ? 'In Progress' : 'Not Started'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get student roadmap progress summary
exports.getStudentProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    ensureStudentOrAdmin(req, id);

    const [topics, progressRows] = await Promise.all([
      LearningPath.find({ status: 'Active' }).sort({ order: 1, week: 1 }),
      StudentProgress.find({ studentId: id })
    ]);

    const progressByTopic = new Map(
      progressRows
        .filter((row) => row.topicId)
        .map((row) => [row.topicId.toString(), row])
    );

    const topicProgress = topics.map((topic) => {
      const progress = progressByTopic.get(topic._id.toString());
      return {
        topicId: topic._id,
        topic: topic.topic,
        ...progressSnapshot(topic, progress)
      };
    });

    const topicsCompleted = topicProgress.filter((row) => row.isCompleted).length;
    const totalTopics = topicProgress.length;
    const overallCompletionPercentage = totalTopics > 0
      ? Math.round((topicsCompleted / totalTopics) * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        topicsCompleted,
        totalTopics,
        overallCompletionPercentage,
        topics: topicProgress
      }
    });
  } catch (error) {
    next(error);
  }
};

// Keep legacy endpoint support by exposing topic progress under old shape
exports.getWeekProgress = async (req, res, next) => {
  try {
    const { id, weekId } = req.params;
    ensureStudentOrAdmin(req, id);

    const topic = await LearningPath.findById(weekId)
      || await LearningPath.findOne({
        $or: [
          { topicId: String(weekId).toLowerCase() },
          { week: Number(weekId) || -1 }
        ]
      });

    if (!topic) {
      return next(new AppError('Learning topic not found', 404, 'NOT_FOUND'));
    }

    const progress = await StudentProgress.findOne({ studentId: id, topicId: topic._id });
    const snapshot = progressSnapshot(topic, progress);

    res.status(200).json({
      success: true,
      data: {
        topicId: topic._id,
        topic: topic.topic,
        ...snapshot
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update completion state for a specific problem in a topic
exports.updateWeekProgress = async (req, res, next) => {
  try {
    const { id, weekId } = req.params;
    const { problemIndex, completed = true } = req.body;
    ensureStudentOrAdmin(req, id);

    const parsedIndex = Number(problemIndex);
    if (Number.isNaN(parsedIndex) || parsedIndex < 0) {
      return next(new AppError('A valid problemIndex is required', 400, 'VALIDATION_ERROR'));
    }

    const topic = await LearningPath.findById(weekId)
      || await LearningPath.findOne({
        $or: [
          { topicId: String(weekId).toLowerCase() },
          { week: Number(weekId) || -1 }
        ]
      });

    if (!topic) {
      return next(new AppError('Learning topic not found', 404, 'NOT_FOUND'));
    }

    if (parsedIndex >= (topic.problems?.length || 0)) {
      return next(new AppError('Problem index is out of range for this topic', 400, 'VALIDATION_ERROR'));
    }

    let progress = await StudentProgress.findOne({ studentId: id, topicId: topic._id });
    if (!progress) {
      progress = new StudentProgress({
        studentId: id,
        topicId: topic._id,
        weekId: topic.week,
        status: 'Not Started',
        completionPercentage: 0,
        completedProblemIndexes: []
      });
    }

    const updatedSet = new Set(progress.completedProblemIndexes || []);
    if (completed) updatedSet.add(parsedIndex);
    else updatedSet.delete(parsedIndex);
    progress.completedProblemIndexes = Array.from(updatedSet).sort((a, b) => a - b);

    const snapshot = progressSnapshot(topic, progress);
    progress.completionPercentage = snapshot.completionPercentage;
    progress.status = snapshot.isCompleted
      ? 'Completed'
      : snapshot.completedProblems > 0
        ? 'In Progress'
        : 'Not Started';

    if (progress.status !== 'Not Started' && !progress.startedAt) {
      progress.startedAt = new Date();
    }
    if (progress.status === 'Completed' && !progress.completedAt) {
      progress.completedAt = new Date();
    }
    if (progress.status !== 'Completed') {
      progress.completedAt = null;
    }

    await progress.save();

    res.status(200).json({
      success: true,
      data: {
        topicId: topic._id,
        topic: topic.topic,
        ...snapshot,
        status: progress.status
      },
      message: snapshot.isCompleted
        ? 'Topic completed successfully'
        : 'Topic progress updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Legacy note endpoint retained for compatibility
exports.addNote = async (req, res, next) => {
  try {
    const { id, weekId } = req.params;
    const { content } = req.body;
    ensureStudentOrAdmin(req, id);

    if (!content || content.length > 1000) {
      return next(new AppError('Note must be between 1-1000 characters', 400, 'VALIDATION_ERROR'));
    }

    const topic = await LearningPath.findById(weekId)
      || await LearningPath.findOne({
        $or: [
          { topicId: String(weekId).toLowerCase() },
          { week: Number(weekId) || -1 }
        ]
      });

    if (!topic) {
      return next(new AppError('Learning topic not found', 404, 'NOT_FOUND'));
    }

    let progress = await StudentProgress.findOne({ studentId: id, topicId: topic._id });
    if (!progress) {
      progress = new StudentProgress({
        studentId: id,
        topicId: topic._id,
        weekId: topic.week,
        status: 'Not Started',
        completionPercentage: 0
      });
    }

    const note = { content, createdAt: new Date() };
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
