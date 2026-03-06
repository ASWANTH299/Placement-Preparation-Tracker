const MockInterview = require('../models/MockInterview');
const { AppError } = require('../utils/errorHandler');

// Get student's mock interviews
exports.getMockInterviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, company, dateRange, sortBy = 'date', order = 'desc' } = req.query;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to view these interviews', 403, 'UNAUTHORIZED'));
    }

    const query = { studentId: id };
    if (company) query.company = company;

    // Apply date range filter
    if (dateRange) {
      const now = new Date();
      let startDate;
      if (dateRange === 'lastWeek') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateRange === 'lastMonth') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      if (startDate) {
        query.interviewDate = { $gte: startDate };
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = sortBy === 'score' ? { score: order === 'asc' ? 1 : -1 } : { interviewDate: order === 'asc' ? 1 : -1 };

    const interviews = await MockInterview.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortObj);

    const total = await MockInterview.countDocuments(query);

    res.status(200).json({
      success: true,
      data: interviews,
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

// Get single interview details
exports.getInterviewDetail = async (req, res, next) => {
  try {
    const { id, interviewId } = req.params;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to view this interview', 403, 'UNAUTHORIZED'));
    }

    const interview = await MockInterview.findOne({ _id: interviewId, studentId: id });

    if (!interview) {
      return next(new AppError('Interview not found', 404, 'NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: interview
    });
  } catch (error) {
    next(error);
  }
};

// Create new mock interview
exports.createInterview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { company, interviewDate, score, overallFeedback, technicalSkills, communication, problemSolving, improvements, interviewerName, duration } = req.body;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to create interview records', 403, 'UNAUTHORIZED'));
    }

    // Validation
    if (!company || !interviewDate || score === undefined) {
      return next(new AppError('Company, interview date, and score are required', 400, 'VALIDATION_ERROR'));
    }

    if (score < 0 || score > 100) {
      return next(new AppError('Score must be between 0-100', 400, 'VALIDATION_ERROR'));
    }

    if (new Date(interviewDate) > new Date()) {
      return next(new AppError('Interview date cannot be in the future', 400, 'VALIDATION_ERROR'));
    }

    const interview = new MockInterview({
      studentId: id,
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

    res.status(201).json({
      success: true,
      data: interview,
      message: 'Interview recorded successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Update interview
exports.updateInterview = async (req, res, next) => {
  try {
    const { id, interviewId } = req.params;
    const updateData = req.body;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to update this interview', 403, 'UNAUTHORIZED'));
    }

    // Validate score if provided
    if (updateData.score !== undefined && (updateData.score < 0 || updateData.score > 100)) {
      return next(new AppError('Score must be between 0-100', 400, 'VALIDATION_ERROR'));
    }

    const interview = await MockInterview.findOneAndUpdate(
      { _id: interviewId, studentId: id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!interview) {
      return next(new AppError('Interview not found', 404, 'NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: interview,
      message: 'Interview updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete interview
exports.deleteInterview = async (req, res, next) => {
  try {
    const { id, interviewId } = req.params;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to delete this interview', 403, 'UNAUTHORIZED'));
    }

    const interview = await MockInterview.findOneAndDelete({ _id: interviewId, studentId: id });

    if (!interview) {
      return next(new AppError('Interview not found', 404, 'NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      message: 'Interview deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get interview statistics
exports.getInterviewStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to view these statistics', 403, 'UNAUTHORIZED'));
    }

    const interviews = await MockInterview.find({ studentId: id });

    if (interviews.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalInterviews: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          mostTestedCompany: null,
          trend: 'neutral',
          byCompany: {}
        }
      });
    }

    const scores = interviews.map(i => i.score);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    // Companies breakdown
    const byCompany = {};
    interviews.forEach(interview => {
      if (!byCompany[interview.company]) {
        byCompany[interview.company] = { count: 0, avgScore: 0, totalScore: 0 };
      }
      byCompany[interview.company].count++;
      byCompany[interview.company].totalScore += interview.score;
    });

    Object.keys(byCompany).forEach(company => {
      byCompany[company].avgScore = byCompany[company].totalScore / byCompany[company].count;
    });

    const mostTestedCompany = Object.keys(byCompany).reduce((a, b) =>
      byCompany[a].count > byCompany[b].count ? a : b
    );

    res.status(200).json({
      success: true,
      data: {
        totalInterviews: interviews.length,
        averageScore: averageScore.toFixed(2),
        highestScore,
        lowestScore,
        mostTestedCompany,
        trend: 'improving',
        byCompany
      }
    });
  } catch (error) {
    next(error);
  }
};
