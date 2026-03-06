const User = require('../models/User');
const StudentProgress = require('../models/StudentProgress');
const QuestionProgress = require('../models/QuestionProgress');
const MockInterview = require('../models/MockInterview');
const { AppError } = require('../utils/errorHandler');

// Get leaderboard
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { period = 'all_time', view = 'overall', page = 1, limit = 100, search } = req.query;

    const query = { role: 'student' };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const students = await User.find(query).lean();

    // Calculate scores for each student
    let studentsWithScores = await Promise.all(
      students.map(async (student) => {
        // Progress percentage
        const progressRecords = await StudentProgress.find({ studentId: student._id });
        const completedWeeks = progressRecords.filter(p => p.status === 'Completed').length;
        const progressPercentage = (completedWeeks / 52) * 100;

        // Questions solved
        const questionsSolved = await QuestionProgress.countDocuments({
          studentId: student._id,
          isSolved: true
        });

        // Mock interviews average score
        const interviews = await MockInterview.find({ studentId: student._id });
        const avgMockScore = interviews.length > 0
          ? interviews.reduce((sum, i) => sum + i.score, 0) / interviews.length
          : 0;

        // Calculate overall score
        const normalizedQuestions = (questionsSolved / 250) * 100; // Assume max 250 questions
        const overallScore = (progressPercentage * 0.50) + (normalizedQuestions * 0.30) + (avgMockScore * 0.20);

        return {
          studentId: student._id,
          name: student.name,
          progressPercentage: Math.round(progressPercentage),
          questionsSolved,
          avgMockScore: Math.round(avgMockScore * 10) / 10,
          overallScore: Math.round(overallScore * 10) / 10,
          interviewCount: interviews.length
        };
      })
    );

    // Sort based on view
    let sortedStudents;
    if (view === 'progress') {
      sortedStudents = studentsWithScores.sort((a, b) => b.progressPercentage - a.progressPercentage);
    } else if (view === 'questions') {
      sortedStudents = studentsWithScores.sort((a, b) => b.questionsSolved - a.questionsSolved);
    } else if (view === 'mock_interviews') {
      sortedStudents = studentsWithScores.sort((a, b) => b.avgMockScore - a.avgMockScore);
    } else {
      sortedStudents = studentsWithScores.sort((a, b) => b.overallScore - a.overallScore);
    }

    // Add rank
    const rankedStudents = sortedStudents.map((student, index) => ({
      ...student,
      rank: index + 1
    }));

    // Paginate
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedStudents = rankedStudents.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      success: true,
      data: paginatedStudents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: rankedStudents.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user's rank
exports.getMyRank = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    // Check authorization
    if (req.user._id.toString() !== studentId && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to view this rank', 403, 'UNAUTHORIZED'));
    }

    const users = await User.find({ role: 'student' }).lean();

    // Calculate all scores
    let studentsWithScores = await Promise.all(
      users.map(async (student) => {
        const progressRecords = await StudentProgress.find({ studentId: student._id });
        const completedWeeks = progressRecords.filter(p => p.status === 'Completed').length;
        const progressPercentage = (completedWeeks / 52) * 100;

        const questionsSolved = await QuestionProgress.countDocuments({
          studentId: student._id,
          isSolved: true
        });

        const interviews = await MockInterview.find({ studentId: student._id });
        const avgMockScore = interviews.length > 0
          ? interviews.reduce((sum, i) => sum + i.score, 0) / interviews.length
          : 0;

        const normalizedQuestions = (questionsSolved / 250) * 100;
        const overallScore = (progressPercentage * 0.50) + (normalizedQuestions * 0.30) + (avgMockScore * 0.20);

        return {
          studentId: student._id,
          name: student.name,
          progressPercentage: Math.round(progressPercentage),
          questionsSolved,
          avgMockScore: Math.round(avgMockScore * 10) / 10,
          overallScore: Math.round(overallScore * 10) / 10
        };
      })
    );

    // Sort and rank
    const rankedStudents = studentsWithScores
      .sort((a, b) => b.overallScore - a.overallScore)
      .map((student, index) => ({
        ...student,
        rank: index + 1
      }));

    // Find current user
    const currentUser = rankedStudents.find(s => s.studentId.toString() === studentId);

    if (!currentUser) {
      return next(new AppError('User not found', 404, 'NOT_FOUND'));
    }

    // Get nearby students
    const nearbyStudents = rankedStudents.filter(s =>
      s.rank >= currentUser.rank - 1 && s.rank <= currentUser.rank + 1
    );

    res.status(200).json({
      success: true,
      data: {
        currentRank: currentUser.rank,
        totalStudents: rankedStudents.length,
        progressPercentage: currentUser.progressPercentage,
        questionsSolved: currentUser.questionsSolved,
        avgMockScore: currentUser.avgMockScore,
        overallScore: currentUser.overallScore,
        nearbyStudents
      }
    });
  } catch (error) {
    next(error);
  }
};
