const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const StudentProject = require('../models/StudentProject');
const { AppError } = require('../utils/errorHandler');

const MAX_PROJECTS = 5;
const MAX_PROJECT_SIZE_BYTES = 5 * 1024 * 1024;

const resolveTargetStudentId = (req, requestedId) => {
  if (req.user?.role === 'admin') return requestedId;
  return req.user?._id?.toString();
};

const cleanupUploadedFiles = async (files = []) => {
  await Promise.all(
    files.map(async (file) => {
      try {
        if (file?.path) {
          await fs.unlink(file.path);
        }
      } catch (error) {
        console.warn('Project file cleanup warning:', error.message);
      }
    })
  );
};

const normalizeTechnologyStack = (rawValue) => {
  if (Array.isArray(rawValue)) {
    return rawValue.map((item) => String(item || '').trim()).filter(Boolean);
  }

  const value = String(rawValue || '').trim();
  if (!value) return [];

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

exports.uploadProject = async (req, res, next) => {
  try {
    const targetStudentId = resolveTargetStudentId(req, req.params.id);
    if (!targetStudentId) return next(new AppError('Invalid student context', 400, 'VALIDATION_ERROR'));

    const uploadedFiles = req.files || [];
    if (!uploadedFiles.length) {
      return next(new AppError('Please upload at least one project file', 400, 'VALIDATION_ERROR'));
    }

    const projectCount = await StudentProject.countDocuments({ studentId: targetStudentId });
    if (projectCount >= MAX_PROJECTS) {
      await cleanupUploadedFiles(uploadedFiles);
      return next(new AppError('Maximum 5 projects allowed. Delete an existing project before uploading a new one.', 400, 'VALIDATION_ERROR'));
    }

    const totalSize = uploadedFiles.reduce((sum, file) => sum + (file.size || 0), 0);
    if (totalSize > MAX_PROJECT_SIZE_BYTES) {
      await cleanupUploadedFiles(uploadedFiles);
      return next(new AppError('Each project folder must not exceed 5MB', 400, 'VALIDATION_ERROR'));
    }

    const projectName = String(req.body?.project_name || req.body?.projectName || '').trim();
    if (!projectName) {
      await cleanupUploadedFiles(uploadedFiles);
      return next(new AppError('Project name is required', 400, 'VALIDATION_ERROR'));
    }

    const description = String(req.body?.description || '').trim();
    const technologyStack = normalizeTechnologyStack(req.body?.technology_stack || req.body?.technologyStack);

    const projectFiles = uploadedFiles.map((file) => ({
      originalName: file.originalname,
      storedName: file.filename,
      filePath: file.path,
      relativePath: String(file.originalname || '').replace(/\\/g, '/'),
      size: file.size || 0,
      mimeType: file.mimetype || 'application/octet-stream'
    }));

    const project = new StudentProject({
      studentId: targetStudentId,
      projectName,
      description,
      technologyStack,
      totalSize,
      files: projectFiles,
      uploadDate: new Date()
    });

    try {
      await project.save();
    } catch (saveError) {
      await cleanupUploadedFiles(uploadedFiles);
      throw saveError;
    }

    res.status(201).json({
      success: true,
      data: project,
      message: 'Project uploaded successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getProjects = async (req, res, next) => {
  try {
    const targetStudentId = resolveTargetStudentId(req, req.params.id);
    if (!targetStudentId) return next(new AppError('Invalid student context', 400, 'VALIDATION_ERROR'));

    const projects = await StudentProject.find({ studentId: targetStudentId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: projects
    });
  } catch (error) {
    next(error);
  }
};

exports.getProjectById = async (req, res, next) => {
  try {
    const targetStudentId = resolveTargetStudentId(req, req.params.id);
    if (!targetStudentId) return next(new AppError('Invalid student context', 400, 'VALIDATION_ERROR'));

    const project = await StudentProject.findOne({ _id: req.params.projectId, studentId: targetStudentId });
    if (!project) {
      return next(new AppError('Project not found', 404, 'NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const targetStudentId = resolveTargetStudentId(req, req.params.id);
    if (!targetStudentId) return next(new AppError('Invalid student context', 400, 'VALIDATION_ERROR'));

    const project = await StudentProject.findOneAndDelete({ _id: req.params.projectId, studentId: targetStudentId });
    if (!project) {
      return next(new AppError('Project not found', 404, 'NOT_FOUND'));
    }

    await Promise.all(
      (project.files || []).map(async (file) => {
        try {
          await fs.unlink(path.resolve(file.filePath));
        } catch (error) {
          console.warn('Project file delete warning:', error.message);
        }
      })
    );

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.downloadProject = async (req, res, next) => {
  try {
    const targetStudentId = resolveTargetStudentId(req, req.params.id);
    if (!targetStudentId) return next(new AppError('Invalid student context', 400, 'VALIDATION_ERROR'));

    const project = await StudentProject.findOne({ _id: req.params.projectId, studentId: targetStudentId });
    if (!project) {
      return next(new AppError('Project not found', 404, 'NOT_FOUND'));
    }

    const safeProjectName = (project.projectName || 'project').replace(/[^a-zA-Z0-9-_]+/g, '_');
    const archiveName = `${safeProjectName}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${archiveName}"`);

    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (archiveError) => {
      next(new AppError(`Project download failed: ${archiveError.message}`, 500, 'INTERNAL_ERROR'));
    });

    archive.pipe(res);

    for (const file of project.files || []) {
      const absolutePath = path.resolve(file.filePath);
      try {
        await fs.access(absolutePath);
        const entryName = String(file.relativePath || file.originalName || 'file').replace(/^\/+/, '');
        archive.file(absolutePath, { name: entryName });
      } catch {
        continue;
      }
    }

    archive.finalize();
  } catch (error) {
    next(error);
  }
};
