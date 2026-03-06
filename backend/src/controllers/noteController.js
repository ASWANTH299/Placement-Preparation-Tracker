const Note = require('../models/Note');
const { AppError } = require('../utils/errorHandler');

// Get notes
exports.getNotes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 12, visibility, topic, company, search, sortBy = 'newest' } = req.query;

    const conditions = [];

    if (visibility && visibility !== 'All') {
      if (visibility === 'Private') {
        conditions.push({ studentId: id });
      } else {
        conditions.push({ visibility: 'Public' });
      }
    } else if (req.user._id.toString() === id) {
      conditions.push({ $or: [{ studentId: id }, { visibility: 'Public' }] });
    } else {
      conditions.push({ visibility: 'Public' });
    }

    if (topic) conditions.push({ topics: topic });
    if (company) conditions.push({ companies: company });
    if (search) {
      conditions.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const query = conditions.length ? { $and: conditions } : {};

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj =  sortBy === 'oldest' ? { createdAt: 1 } : sortBy === 'mostViewed' ? { viewCount: -1 } : { createdAt: -1 };

    const notes = await Note.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortObj)
      .populate('studentId', 'name');

    const total = await Note.countDocuments(query);

    // Add isOwnNote flag
    const enrichedNotes = notes.map(note => ({
      ...note.toObject(),
      isOwnNote: note.studentId ? note.studentId._id.toString() === req.user._id.toString() : false
    }));

    res.status(200).json({
      success: true,
      data: enrichedNotes,
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

// Get note by ID
exports.getNote = async (req, res, next) => {
  try {
    const { noteId } = req.params;

    const note = await Note.findByIdAndUpdate(
      noteId,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('studentId', 'name email');

    if (!note) {
      return next(new AppError('Note not found', 404, 'NOT_FOUND'));
    }

    // Check visibility
    if (note.visibility === 'Private' && note.studentId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to view this note', 403, 'UNAUTHORIZED'));
    }

    res.status(200).json({
      success: true,
      data: note
    });
  } catch (error) {
    next(error);
  }
};

// Create note
exports.createNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, topics, companies, visibility } = req.body;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to create notes', 403, 'UNAUTHORIZED'));
    }

    // Validation
    if (!title || title.length < 5 || title.length > 200) {
      return next(new AppError('Title must be between 5-200 characters', 400, 'VALIDATION_ERROR'));
    }

    if (!content || content.length > 10000) {
      return next(new AppError('Content is required and must not exceed 10000 characters', 400, 'VALIDATION_ERROR'));
    }

    const note = new Note({
      studentId: id,
      title,
      content,
      topics: topics || [],
      companies: companies || [],
      visibility: visibility || 'Private'
    });

    await note.save();

    res.status(201).json({
      success: true,
      data: {
        id: note._id,
        title: note.title,
        visibility: note.visibility,
        createdAt: note.createdAt
      },
      message: 'Note created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Update note
exports.updateNote = async (req, res, next) => {
  try {
    const { id, noteId } = req.params;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to update notes', 403, 'UNAUTHORIZED'));
    }

    const note = await Note.findOneAndUpdate(
      { _id: noteId, studentId: id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!note) {
      return next(new AppError('Note not found', 404, 'NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: note,
      message: 'Note updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete note
exports.deleteNote = async (req, res, next) => {
  try {
    const { id, noteId } = req.params;

    // Check authorization
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to delete notes', 403, 'UNAUTHORIZED'));
    }

    const note = await Note.findOneAndDelete({ _id: noteId, studentId: id });

    if (!note) {
      return next(new AppError('Note not found', 404, 'NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
