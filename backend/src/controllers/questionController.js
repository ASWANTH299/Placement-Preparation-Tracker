const CompanyQuestion = require('../models/CompanyQuestion');
const QuestionProgress = require('../models/QuestionProgress');
const { AppError } = require('../utils/errorHandler');
const { executeCode, SUPPORTED_LANGUAGES } = require('../utils/codeExecutor');

const markAttemptProgress = async (studentId, questionId) => {
  if (!studentId || !questionId) return;

  let progress = await QuestionProgress.findOne({
    studentId,
    questionId
  });

  if (!progress) {
    progress = new QuestionProgress({
      studentId,
      questionId
    });
  }

  progress.status = 'Attempted';
  progress.attemptCount += 1;
  progress.lastAttemptDate = new Date();
  if (!progress.firstAttemptDate) progress.firstAttemptDate = new Date();

  await progress.save();
};

// Get filtered questions
exports.getQuestions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, company, topic, difficulty, search, status = 'Active', sortBy = 'date', order = 'desc' } = req.query;

    const query = { status };
    if (company) query.company = company;
    if (difficulty) query.difficulty = difficulty;
    if (topic) query.topics = topic;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { topics: { $elemMatch: { $regex: search, $options: 'i' } } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = {};

    if (sortBy === 'difficulty') sortObj.difficulty = order === 'asc' ? 1 : -1;
    else if (sortBy === 'company') sortObj.company = order === 'asc' ? 1 : -1;
    else if (sortBy === 'popular') sortObj.solvedCount = order === 'asc' ? 1 : -1;
    else sortObj.createdAt = order === 'asc' ? 1 : -1;

    const questions = await CompanyQuestion.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortObj);

    const total = await CompanyQuestion.countDocuments(query);

    // Add user progress if authenticated
    let enrichedQuestions = questions;
    if (req.user) {
      enrichedQuestions = await Promise.all(
        questions.map(async (q) => {
          const progress = await QuestionProgress.findOne({
            studentId: req.user._id,
            questionId: q._id
          });
          return {
            ...q.toObject(),
            topic: q.topics?.[0] || 'General',
            userStatus: progress ? {
              isSolved: progress.isSolved,
              isBookmarked: progress.isBookmarked,
              attemptCount: progress.attemptCount,
              solvedDate: progress.solvedDate
            } : null
          };
        })
      );
    }

    res.status(200).json({
      success: true,
      data: enrichedQuestions,
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

// Get question details
exports.getQuestionDetail = async (req, res, next) => {
  try {
    const { questionId } = req.params;

    const question = await CompanyQuestion.findByIdAndUpdate(
      questionId,
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    if (!question) {
      return next(new AppError('Question not found', 404, 'NOT_FOUND'));
    }

    let userProgress = null;
    if (req.user) {
      userProgress = await QuestionProgress.findOne({
        studentId: req.user._id,
        questionId: questionId
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...question.toObject(),
        topic: question.topics?.[0] || 'General',
        userProgress: userProgress || null
      }
    });
  } catch (error) {
    next(error);
  }
};

// Mark question as solved
exports.markSolved = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { timeTakenMinutes, approachNotes } = req.body;

    const question = await CompanyQuestion.findById(questionId);
    if (!question) {
      return next(new AppError('Question not found', 404, 'NOT_FOUND'));
    }

    let progress = await QuestionProgress.findOne({
      studentId: req.user._id,
      questionId: questionId
    });

    if (!progress) {
      progress = new QuestionProgress({
        studentId: req.user._id,
        questionId: questionId
      });
    }

    // Update progress
    if (!progress.isSolved) {
      progress.isSolved = true;
      progress.status = 'Solved';
      progress.solvedDate = new Date();
      question.solvedCount += 1;
    }

    progress.lastAttemptDate = new Date();
    if (!progress.firstAttemptDate) progress.firstAttemptDate = new Date();

    if (timeTakenMinutes) progress.timeTakenMinutes = timeTakenMinutes;
    if (approachNotes) progress.approachNotes = approachNotes;

    await progress.save();
    await question.save();

    res.status(200).json({
      success: true,
      data: {
        status: 'Solved',
        solvedDate: progress.solvedDate
      },
      message: 'Question marked as solved'
    });
  } catch (error) {
    next(error);
  }
};

// Mark question as attempted
exports.markAttempted = async (req, res, next) => {
  try {
    const { questionId } = req.params;

    const question = await CompanyQuestion.findById(questionId);
    if (!question) {
      return next(new AppError('Question not found', 404, 'NOT_FOUND'));
    }

    let progress = await QuestionProgress.findOne({
      studentId: req.user._id,
      questionId: questionId
    });

    if (!progress) {
      progress = new QuestionProgress({
        studentId: req.user._id,
        questionId: questionId
      });
    }

    progress.status = 'Attempted';
    progress.attemptCount += 1;
    progress.lastAttemptDate = new Date();
    if (!progress.firstAttemptDate) progress.firstAttemptDate = new Date();

    await progress.save();

    res.status(200).json({
      success: true,
      message: 'Question marked as attempted'
    });
  } catch (error) {
    next(error);
  }
};

// Bookmark question
exports.toggleBookmark = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { isBookmarked } = req.body;

    const question = await CompanyQuestion.findById(questionId);
    if (!question) {
      return next(new AppError('Question not found', 404, 'NOT_FOUND'));
    }

    let progress = await QuestionProgress.findOne({
      studentId: req.user._id,
      questionId: questionId
    });

    if (!progress) {
      progress = new QuestionProgress({
        studentId: req.user._id,
        questionId: questionId
      });
    }

    progress.isBookmarked = isBookmarked;
    await progress.save();

    res.status(200).json({
      success: true,
      data: { isBookmarked }
    });
  } catch (error) {
    next(error);
  }
};

// Compile and run code
exports.runCode = async (req, res, next) => {
  try {
    const { language, code, input = '' } = req.body;

    if (!language || !code) {
      return next(new AppError('language and code are required', 400, 'VALIDATION_ERROR'));
    }

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return next(new AppError(`Unsupported language. Use one of: ${SUPPORTED_LANGUAGES.join(', ')}`, 400, 'VALIDATION_ERROR'));
    }

    const result = await executeCode({
      language,
      code,
      input,
      timeoutMs: 7000
    });

    res.status(200).json({
      success: true,
      data: {
        language,
        ...result
      }
    });
  } catch (error) {
    next(error);
  }
};

// Submit code (runs compiler/runtime checks + marks attempted when questionId is valid)
exports.submitCode = async (req, res, next) => {
  try {
    const { questionId, language, code, input = '' } = req.body;

    if (!language || !code) {
      return next(new AppError('language and code are required', 400, 'VALIDATION_ERROR'));
    }

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return next(new AppError(`Unsupported language. Use one of: ${SUPPORTED_LANGUAGES.join(', ')}`, 400, 'VALIDATION_ERROR'));
    }

    const result = await executeCode({
      language,
      code,
      input,
      timeoutMs: 7000
    });

    let attemptMarked = false;
    const isValidQuestionId = typeof questionId === 'string' && /^[0-9a-fA-F]{24}$/.test(questionId);
    if (isValidQuestionId && req.user?._id) {
      const question = await CompanyQuestion.findById(questionId);
      if (question) {
        await markAttemptProgress(req.user._id, questionId);
        attemptMarked = true;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        language,
        attemptMarked,
        ...result
      }
    });
  } catch (error) {
    next(error);
  }
};
