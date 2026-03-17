const ForumMessage = require('../models/ForumMessage');
const { AppError } = require('../utils/errorHandler');

exports.getForumMessages = async (req, res, next) => {
  try {
    const messages = await ForumMessage.find({})
      .sort({ created_at: 1 })
      .limit(500)
      .populate('userId', 'name email');

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

exports.createForumMessage = async (req, res, next) => {
  try {
    const message = String(req.body?.message || '').trim();
    const parentMessageId = req.body?.parentMessageId || null;

    if (!message) {
      return next(new AppError('Message is required', 400, 'VALIDATION_ERROR'));
    }

    if (message.length > 1000) {
      return next(new AppError('Message must not exceed 1000 characters', 400, 'VALIDATION_ERROR'));
    }

    if (parentMessageId) {
      const parentExists = await ForumMessage.exists({ _id: parentMessageId });
      if (!parentExists) {
        return next(new AppError('Parent message not found', 404, 'NOT_FOUND'));
      }
    }

    const created = await ForumMessage.create({
      userId: req.user._id,
      message,
      parentMessageId,
      created_at: new Date()
    });

    const populated = await ForumMessage.findById(created._id).populate('userId', 'name email');

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Message sent successfully'
    });
  } catch (error) {
    next(error);
  }
};
