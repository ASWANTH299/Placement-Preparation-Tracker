const CompanyQuestion = require('../models/CompanyQuestion');
const QuestionProgress = require('../models/QuestionProgress');
const { AppError } = require('../utils/errorHandler');
const { executeCode, SUPPORTED_LANGUAGES, getAvailableToolchains } = require('../utils/codeExecutor');

const ACTIVE_WEBSITE_LANGUAGES = ['Java', 'Python', 'JavaScript', 'TypeScript', 'C', 'C++', 'C#'];

const getQuestionAllowedLanguages = (questionDoc) => {
  const configured = Array.isArray(questionDoc?.supportedLanguages)
    ? questionDoc.supportedLanguages.filter((item) => ACTIVE_WEBSITE_LANGUAGES.includes(item))
    : [];

  return configured.length > 0 ? configured : ACTIVE_WEBSITE_LANGUAGES;
};

const normalizeHost = (host = '') => String(host || '').trim().toLowerCase().replace(/^www\./, '');

const extractLeetCodeSlug = (value = '') => {
  try {
    const parsed = new URL(value);
    const match = parsed.pathname.match(/^\/problems\/([a-z0-9-]+)\/?$/i);
    return match ? match[1].toLowerCase() : '';
  } catch {
    return '';
  }
};

const validateSubmissionUrlShape = ({ submissionUrl, platform, practiceUrl }) => {
  try {
    const parsed = new URL(String(submissionUrl || '').trim());
    const host = normalizeHost(parsed.hostname);
    const path = parsed.pathname;

    if (parsed.protocol !== 'https:') {
      return { valid: false, reason: 'Submission URL must start with https://' };
    }

    if (platform === 'LeetCode') {
      if (host !== 'leetcode.com') {
        return { valid: false, reason: 'Please provide a valid LeetCode submission URL.' };
      }

      const expectedSlug = extractLeetCodeSlug(practiceUrl);
      const detailPattern = /^\/submissions\/detail\/([1-9]\d{9,})\/?$/i;
      const problemSubmissionPattern = /^\/problems\/([a-z0-9-]+)\/submissions\/([1-9]\d{9,})\/?$/i;

      if (detailPattern.test(path)) {
        return { valid: true };
      }

      const match = path.match(problemSubmissionPattern);
      if (!match) {
        return { valid: false, reason: 'Use a full LeetCode accepted submission URL with a realistic submission id (10+ digits).' };
      }

      const submittedSlug = match[1].toLowerCase();
      if (expectedSlug && submittedSlug !== expectedSlug) {
        return { valid: false, reason: 'Submission URL must match today\'s LeetCode problem.' };
      }

      return { valid: true };
    }

    if (platform === 'CodeChef') {
      if (host !== 'codechef.com') {
        return { valid: false, reason: 'Please provide a valid CodeChef solution URL.' };
      }

      const codeChefPattern = /^\/viewsolution\/([1-9]\d{7,})\/?$/i;
      if (!codeChefPattern.test(path)) {
        return { valid: false, reason: 'Use a CodeChef viewsolution URL with 8+ digit solution id.' };
      }

      return { valid: true };
    }

    return { valid: false, reason: 'Unsupported platform for daily task validation.' };
  } catch {
    return { valid: false, reason: 'Please enter a valid URL.' };
  }
};

const verifySubmissionUrlExists = async ({ submissionUrl, platform }) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(submissionUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 DailyTaskValidator/1.0'
      }
    });

    const finalUrl = response.url || submissionUrl;
    const finalParsed = new URL(finalUrl);
    const finalHost = normalizeHost(finalParsed.hostname);
    const finalPath = (finalParsed.pathname || '').toLowerCase();

    // LeetCode often returns Cloudflare 403 to automated server checks.
    // In that case, rely on strict URL-shape validation instead of hard failing.
    if (!response.ok && platform !== 'LeetCode') {
      return { valid: false, reason: 'Submission link is not reachable. Please check and paste the exact accepted link.' };
    }

    // Reject login redirects and obvious not-found pages.
    if (platform === 'LeetCode' && (finalHost !== 'leetcode.com' || finalPath.includes('/accounts/login'))) {
      return { valid: false, reason: 'LeetCode link redirected to login or invalid page. Paste the exact accepted submission URL.' };
    }

    const html = (await response.text()).toLowerCase();

    if (platform === 'LeetCode' && html.includes('just a moment')) {
      return { valid: true };
    }

    if (html.includes('page not found') || html.includes('404') || html.includes('not found')) {
      return { valid: false, reason: 'Submission page was not found. Use the exact accepted submission link.' };
    }

    if (platform === 'CodeChef' && !html.includes('view solution')) {
      return { valid: false, reason: 'CodeChef solution page content could not be verified.' };
    }

    if (platform === 'LeetCode' && !html.includes('submission')) {
      return { valid: false, reason: 'LeetCode submission page content could not be verified.' };
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: 'Could not verify the submission link right now. Please try again with the exact URL.' };
  } finally {
    clearTimeout(timeout);
  }
};

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
    const { questionId, language, code, input = '' } = req.body;

    if (!language || !code) {
      return next(new AppError('language and code are required', 400, 'VALIDATION_ERROR'));
    }

    if (!ACTIVE_WEBSITE_LANGUAGES.includes(language)) {
      return next(new AppError(`Unsupported language. Use one of: ${ACTIVE_WEBSITE_LANGUAGES.join(', ')}`, 400, 'VALIDATION_ERROR'));
    }

    if (questionId) {
      if (!/^[0-9a-fA-F]{24}$/.test(String(questionId))) {
        return next(new AppError('Invalid questionId format', 400, 'VALIDATION_ERROR'));
      }

      const question = await CompanyQuestion.findById(questionId).select('supportedLanguages');
      if (!question) {
        return next(new AppError('Question not found', 404, 'NOT_FOUND'));
      }

      const allowedLanguages = getQuestionAllowedLanguages(question);
      if (!allowedLanguages.includes(language)) {
        return next(new AppError(`Language ${language} is not supported for this question. Use one of: ${allowedLanguages.join(', ')}`, 400, 'VALIDATION_ERROR'));
      }
    }

    const result = await executeCode({
      language,
      code,
      input,
      timeoutMs: 20000
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

    if (!ACTIVE_WEBSITE_LANGUAGES.includes(language)) {
      return next(new AppError(`Unsupported language. Use one of: ${ACTIVE_WEBSITE_LANGUAGES.join(', ')}`, 400, 'VALIDATION_ERROR'));
    }

    if (questionId) {
      if (!/^[0-9a-fA-F]{24}$/.test(String(questionId))) {
        return next(new AppError('Invalid questionId format', 400, 'VALIDATION_ERROR'));
      }

      const question = await CompanyQuestion.findById(questionId).select('supportedLanguages');
      if (!question) {
        return next(new AppError('Question not found', 404, 'NOT_FOUND'));
      }

      const allowedLanguages = getQuestionAllowedLanguages(question);
      if (!allowedLanguages.includes(language)) {
        return next(new AppError(`Language ${language} is not supported for this question. Use one of: ${allowedLanguages.join(', ')}`, 400, 'VALIDATION_ERROR'));
      }
    }

    const result = await executeCode({
      language,
      code,
      input,
      timeoutMs: 20000
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

// Get language toolchain availability
exports.getPracticeToolchains = async (req, res, next) => {
  try {
    const toolchains = getAvailableToolchains();
    res.status(200).json({
      success: true,
      data: toolchains
    });
  } catch (error) {
    next(error);
  }
};

// Validate external accepted submission URL for daily task completion
exports.validateDailySubmissionLink = async (req, res, next) => {
  try {
    const { submissionUrl, platform, practiceUrl } = req.body;

    if (!submissionUrl || !platform) {
      return next(new AppError('submissionUrl and platform are required', 400, 'VALIDATION_ERROR'));
    }

    const shape = validateSubmissionUrlShape({ submissionUrl, platform, practiceUrl });
    if (!shape.valid) {
      return res.status(200).json({
        success: true,
        data: {
          isValid: false,
          reason: shape.reason
        }
      });
    }

    const verified = await verifySubmissionUrlExists({ submissionUrl, platform });
    return res.status(200).json({
      success: true,
      data: {
        isValid: verified.valid,
        reason: verified.reason || ''
      }
    });
  } catch (error) {
    next(error);
  }
};
