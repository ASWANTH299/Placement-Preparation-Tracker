const Resume = require('../models/Resume');
const { AppError } = require('../utils/errorHandler');
const fs = require('fs').promises;
const path = require('path');

// Get student resumes
exports.getResumes = async (req, res, next) => {
  try {
    const { id } = req.params;

    const resumes = await Resume.find({ studentId: id });

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
    const { id } = req.params;
    const { customName } = req.body;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to upload resume', 403, 'UNAUTHORIZED'));
    }

    if (!req.file) {
      return next(new AppError('No file uploaded', 400, 'VALIDATION_ERROR'));
    }

    // Check resume count
    const resumeCount = await Resume.countDocuments({ studentId: id });
    if (resumeCount >= 5) {
      return next(new AppError('Maximum 5 resumes allowed per student', 400, 'VALIDATION_ERROR'));
    }

    // Validate file
    const validTypes = ['pdf', 'doc', 'docx'];
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    if (!validTypes.includes(fileExtension)) {
      return next(new AppError('Only PDF, DOC, and DOCX files are allowed', 400, 'VALIDATION_ERROR'));
    }

    if (req.file.size > 5 * 1024 * 1024) {
      return next(new AppError('File size must not exceed 5MB', 400, 'VALIDATION_ERROR'));
    }

    const resume = new Resume({
      studentId: id,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      fileType: fileExtension,
      customName: customName || req.file.originalname,
      isActive: false
    });

    await resume.save();

    res.status(201).json({
      success: true,
      data: resume,
      message: 'Resume uploaded successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete resume
exports.deleteResume = async (req, res, next) => {
  try {
    const { id, resumeId } = req.params;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to delete resume', 403, 'UNAUTHORIZED'));
    }

    const resume = await Resume.findOneAndDelete({ _id: resumeId, studentId: id });

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
    const { id, resumeId } = req.params;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to set resume', 403, 'UNAUTHORIZED'));
    }

    // Find the resume
    const resume = await Resume.findOne({ _id: resumeId, studentId: id });

    if (!resume) {
      return next(new AppError('Resume not found', 404, 'NOT_FOUND'));
    }

    // Set previous active to inactive
    await Resume.updateMany({ studentId: id, isActive: true }, { isActive: false });

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
    const { id, resumeId } = req.params;
    const { customName } = req.body;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to rename resume', 403, 'UNAUTHORIZED'));
    }

    if (!customName || customName.length > 100) {
      return next(new AppError('Custom name must be between 1-100 characters', 400, 'VALIDATION_ERROR'));
    }

    const resume = await Resume.findOneAndUpdate(
      { _id: resumeId, studentId: id },
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
