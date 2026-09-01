const express = require('express');
const authController = require('../controllers/authController');
const { authRateLimit, passwordResetRateLimit } = require('../middlewares/authRateLimit');

const router = express.Router();

// Public routes with abuse prevention rate limiting
router.post('/register', authRateLimit, authController.register);
router.post('/login', authRateLimit, authController.login);
router.post('/forgot-password', passwordResetRateLimit, authController.forgotPassword);
router.post('/reset-password', passwordResetRateLimit, authController.resetPassword);
router.post('/logout', authController.logout);

module.exports = router;
