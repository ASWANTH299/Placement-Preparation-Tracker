const Resume = require('../models/Resume');
const { AppError } = require('../utils/errorHandler');
const fs = require('fs').promises;
const path = require('path');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');

const resolveTargetStudentId = (req, requestedId) => {
  if (req.user?.role === 'admin') return requestedId;
  return req.user?._id?.toString();
};

const normalizeText = (text = '') => String(text).replace(/\r/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

const extractResumeText = async (resume) => {
  const absolutePath = path.resolve(resume.filePath);

  try {
    await fs.access(absolutePath);
  } catch {
    throw new AppError('Resume file is missing from storage', 404, 'NOT_FOUND');
  }

  if (resume.fileType === 'pdf') {
    const buffer = await fs.readFile(absolutePath);
    const parser = new PDFParse({ data: buffer });
    try {
      const parsed = await parser.getText();
      return normalizeText(parsed?.text || '');
    } finally {
      await parser.destroy();
    }
  }

  if (resume.fileType === 'docx') {
    const parsed = await mammoth.extractRawText({ path: absolutePath });
    return normalizeText(parsed?.value || '');
  }

  throw new AppError('Unsupported resume format. Please upload PDF or DOCX.', 400, 'VALIDATION_ERROR');
};

const analyzeResumeText = (text = '') => {
  const rawText = normalizeText(text);
  const compactText = rawText.replace(/\s+/g, ' ').trim();
  const lower = compactText.toLowerCase();
  const lines = rawText.split('\n').map((line) => line.trim()).filter(Boolean);
  const words = compactText ? compactText.split(/\s+/).filter(Boolean) : [];

  const strengths = [];
  const improvements = [];
  let score = 0;

  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(compactText);
  const hasPhone = /(\+?\d[\d\s\-()]{8,}\d)/.test(compactText);
  const hasProfessionalLink = /(linkedin\.com|github\.com|portfolio|leetcode|hackerrank|codechef)/i.test(compactText);

  if (hasEmail) score += 8;
  else improvements.push('Add a professional email address in the top contact section.');

  if (hasPhone) score += 6;
  else improvements.push('Include a reachable phone number with country code if you apply widely.');

  if (hasProfessionalLink) score += 6;
  else improvements.push('Add at least one professional link (LinkedIn, GitHub, portfolio, or coding profile).');

  if (hasEmail && hasPhone && hasProfessionalLink) {
    strengths.push('Contact section is ATS-friendly with complete key details.');
  }

  const sections = [
    { label: 'summary/objective', pattern: /\b(summary|objective|profile)\b/i, points: 5 },
    { label: 'skills', pattern: /\bskills?\b/i, points: 7 },
    { label: 'experience/internship', pattern: /\b(experience|internship|work experience)\b/i, points: 8 },
    { label: 'projects', pattern: /\bprojects?\b/i, points: 7 },
    { label: 'education', pattern: /\beducation\b/i, points: 8 }
  ];

  for (const section of sections) {
    if (section.pattern.test(lower)) {
      score += section.points;
    } else {
      improvements.push(`Add a clear ${section.label} section heading so ATS can classify your resume correctly.`);
    }
  }

  const bulletLines = lines.filter((line) => /^[-*\u2022]/.test(line)).length;
  const bulletLikeText = (compactText.match(/\s[-*]\s/g) || []).length;
  const effectiveBulletCount = Math.max(bulletLines, bulletLikeText);
  if (effectiveBulletCount >= 8) {
    score += 8;
    strengths.push('Content is structured with bullet points, improving readability for recruiters.');
  } else {
    improvements.push('Use concise bullet points for achievements instead of long paragraphs.');
  }

  const actionVerbRegex = /\b(built|developed|implemented|designed|optimized|led|created|improved|automated|deployed|managed|delivered|engineered|reduced|increased)\b/i;
  if (actionVerbRegex.test(lower)) {
    score += 6;
    strengths.push('Achievement statements use action verbs.');
  } else {
    improvements.push('Start bullet points with strong action verbs such as "Built", "Implemented", or "Optimized".');
  }

  const metricsRegex = /(\b\d+%\b|\b\d+\+\b|\b\d+\s*(users|projects|clients|requests|days|weeks|months|ms|s|x)\b)/i;
  if (metricsRegex.test(compactText)) {
    score += 6;
    strengths.push('Resume includes measurable impact, which improves ATS and recruiter confidence.');
  } else {
    improvements.push('Add measurable impact (numbers, percentages, counts, timings) to key achievements.');
  }

  if (words.length >= 350 && words.length <= 900) {
    score += 8;
  } else if (words.length >= 200 && words.length <= 1200) {
    score += 4;
    improvements.push('Keep resume length focused (ideally around one page for freshers with concise wording).');
  } else {
    improvements.push('Resume length seems off. Keep content focused and avoid very short or overly long resumes.');
  }

  const keywordMatches = (lower.match(/\b(javascript|python|java|react|node|sql|mongodb|aws|docker|git|rest api|typescript|dsa)\b/g) || []).length;
  if (keywordMatches >= 6) {
    score += 7;
    strengths.push('Technical keywords are present, helping ATS match job requirements.');
  } else if (keywordMatches >= 3) {
    score += 4;
    improvements.push('Include more job-relevant technical keywords from target role descriptions.');
  } else {
    improvements.push('Add a dedicated skills section with relevant technologies to improve ATS matching.');
  }

  const hasDates = /(20\d{2}|19\d{2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(lower);
  if (hasDates) {
    score += 5;
  } else {
    improvements.push('Add timelines (month/year) for education, internships, and projects.');
  }

  const boundedScore = Math.max(0, Math.min(100, score));
  const isGoodResume = boundedScore >= 80 && improvements.length <= 4;

  const headline = isGoodResume
    ? 'Resume is properly built and close to interview-ready.'
    : 'Resume needs improvements for better ATS performance.';

  const description = isGoodResume
    ? 'Your resume has strong structure, ATS-friendly content, and clear impact indicators. Keep tailoring it for each job role.'
    : 'Improve section clarity, measurable achievements, and keyword alignment. These changes can raise ATS score and recruiter response rate.';

  return {
    atsScore: boundedScore,
    verdict: isGoodResume ? 'good' : 'needs_improvement',
    headline,
    description,
    strengths: strengths.slice(0, 6),
    improvements: improvements.slice(0, 8),
    stats: {
      wordCount: words.length,
      bulletPoints: effectiveBulletCount,
      keywordHits: keywordMatches
    }
  };
};

// Get student resumes
exports.getResumes = async (req, res, next) => {
  try {
    const targetStudentId = resolveTargetStudentId(req, req.params.id);
    if (!targetStudentId) return next(new AppError('Invalid student context', 400, 'VALIDATION_ERROR'));

    const resumes = await Resume.find({ studentId: targetStudentId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: resumes
    });
  } catch (error) {
    next(error);
  }
};

// Upload resume
exports.uploadResume = async (req, res, next) => {
  try {
    const targetStudentId = resolveTargetStudentId(req, req.params.id);
    if (!targetStudentId) return next(new AppError('Invalid student context', 400, 'VALIDATION_ERROR'));

    const { customName } = req.body;

    if (!req.file) {
      return next(new AppError('No file uploaded', 400, 'VALIDATION_ERROR'));
    }

    // Check resume count
    const resumeCount = await Resume.countDocuments({ studentId: targetStudentId });
    if (resumeCount >= 5) {
      return next(new AppError('Maximum 5 resumes allowed. Delete an old resume before uploading a new one.', 400, 'VALIDATION_ERROR'));
    }

    // Validate file
    const validTypes = ['pdf', 'docx'];
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    if (!validTypes.includes(fileExtension)) {
      return next(new AppError('Only PDF and DOCX files are allowed', 400, 'VALIDATION_ERROR'));
    }

    if (req.file.size > 5 * 1024 * 1024) {
      return next(new AppError('File size must not exceed 5MB', 400, 'VALIDATION_ERROR'));
    }

    const resolvedPath = req.file.path || path.resolve('uploads', req.file.filename || req.file.originalname);

    const resume = new Resume({
      studentId: targetStudentId,
      fileName: req.file.originalname,
      filePath: resolvedPath,
      fileSize: req.file.size,
      fileType: fileExtension,
      customName: customName || req.file.originalname,
      isActive: resumeCount === 0
    });

    try {
      await resume.save();
    } catch (saveError) {
      // If DB save fails, remove uploaded file to avoid orphan files.
      try {
        if (resolvedPath) await fs.unlink(resolvedPath);
      } catch (cleanupError) {
        console.warn('Resume cleanup warning:', cleanupError.message);
      }
      throw saveError;
    }

    res.status(201).json({
      success: true,
      data: resume,
      message: 'Resume uploaded successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Download resume
exports.downloadResume = async (req, res, next) => {
  try {
    const { resumeId } = req.params;
    const targetStudentId = resolveTargetStudentId(req, req.params.id);
    if (!targetStudentId) return next(new AppError('Invalid student context', 400, 'VALIDATION_ERROR'));

    const resume = await Resume.findOne({ _id: resumeId, studentId: targetStudentId });

    if (!resume) {
      return next(new AppError('Resume not found', 404, 'NOT_FOUND'));
    }

    const absolutePath = path.resolve(resume.filePath);
    try {
      await fs.access(absolutePath);
    } catch {
      return next(new AppError('Resume file is missing from storage', 404, 'NOT_FOUND'));
    }
    return res.download(absolutePath, resume.fileName);
  } catch (error) {
    next(error);
  }
};

// Delete resume
exports.deleteResume = async (req, res, next) => {
  try {
    const { resumeId } = req.params;
    const targetStudentId = resolveTargetStudentId(req, req.params.id);
    if (!targetStudentId) return next(new AppError('Invalid student context', 400, 'VALIDATION_ERROR'));

    const resume = await Resume.findOneAndDelete({ _id: resumeId, studentId: targetStudentId });

    if (!resume) {
      return next(new AppError('Resume not found', 404, 'NOT_FOUND'));
    }

    // Delete file from storage
    try {
      await fs.unlink(path.resolve(resume.filePath));
    } catch (err) {
      console.warn('Resume file deletion warning:', err.message);
    }

    res.status(200).json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Set resume as active
exports.setActiveResume = async (req, res, next) => {
  try {
    const { resumeId } = req.params;
    const targetStudentId = resolveTargetStudentId(req, req.params.id);
    if (!targetStudentId) return next(new AppError('Invalid student context', 400, 'VALIDATION_ERROR'));

    // Find the resume
    const resume = await Resume.findOne({ _id: resumeId, studentId: targetStudentId });

    if (!resume) {
      return next(new AppError('Resume not found', 404, 'NOT_FOUND'));
    }

    // Set previous active to inactive
    await Resume.updateMany({ studentId: targetStudentId, isActive: true }, { isActive: false });

    // Set current as active
    resume.isActive = true;
    await resume.save();

    res.status(200).json({
      success: true,
      data: { isActive: true },
      message: 'Resume set as active'
    });
  } catch (error) {
    next(error);
  }
};

// Rename resume
exports.renameResume = async (req, res, next) => {
  try {
    const { resumeId } = req.params;
    const targetStudentId = resolveTargetStudentId(req, req.params.id);
    if (!targetStudentId) return next(new AppError('Invalid student context', 400, 'VALIDATION_ERROR'));

    const { customName } = req.body;

    if (!customName || customName.length > 100) {
      return next(new AppError('Custom name must be between 1-100 characters', 400, 'VALIDATION_ERROR'));
    }

    const resume = await Resume.findOneAndUpdate(
      { _id: resumeId, studentId: targetStudentId },
      { customName },
      { new: true }
    );

    if (!resume) {
      return next(new AppError('Resume not found', 404, 'NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: { customName: resume.customName }
    });
  } catch (error) {
    next(error);
  }
};

// Review resume and generate ATS-style feedback
exports.reviewResume = async (req, res, next) => {
  try {
    const { resumeId } = req.params;
    const targetStudentId = resolveTargetStudentId(req, req.params.id);
    if (!targetStudentId) return next(new AppError('Invalid student context', 400, 'VALIDATION_ERROR'));

    const resume = await Resume.findOne({ _id: resumeId, studentId: targetStudentId });
    if (!resume) {
      return next(new AppError('Resume not found', 404, 'NOT_FOUND'));
    }

    const text = await extractResumeText(resume);
    if (!text || text.replace(/\s+/g, '').length < 80) {
      return next(new AppError('Resume text could not be extracted clearly. Use a text-based PDF/DOCX (not image-only).', 400, 'VALIDATION_ERROR'));
    }

    const review = analyzeResumeText(text);

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};
