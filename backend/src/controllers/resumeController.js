const Resume = require('../models/Resume');
const { AppError } = require('../utils/errorHandler');
const fs = require('fs').promises;
const path = require('path');

const resolveTargetStudentId = (req, requestedId) => {
  if (req.user?.role === 'admin') return requestedId;
  return req.user?._id?.toString();
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
      await fs.unlink(resume.filePath);
    } catch (err) {
      console.log('File deletion error:', err);
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
