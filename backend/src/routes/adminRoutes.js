const express = require('express');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

// User Management
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUserDetail);
router.put('/users/:userId', adminController.updateUser);
router.delete('/users/:userId', adminController.deleteUser);

// Learning Paths Management
router.post('/learning-paths', adminController.createLearningPath);
router.put('/learning-paths/:topicId', adminController.updateLearningPath);
router.delete('/learning-paths/:topicId', adminController.deleteLearningPath);

// Company Questions Management
router.post('/company-questions', adminController.createQuestion);
router.put('/company-questions/:questionId', adminController.updateQuestion);
router.delete('/company-questions/:questionId', adminController.deleteQuestion);

module.exports = router;
