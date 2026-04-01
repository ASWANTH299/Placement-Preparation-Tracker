const express = require('express');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/analytics', adminController.getAnalytics);

// User Management
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
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

// Daily Tasks Management
router.get('/daily-tasks', adminController.getDailyTasks);
router.get('/daily-tasks/:taskId', adminController.getDailyTaskById);
router.post('/daily-tasks', adminController.createDailyTask);
router.put('/daily-tasks/:taskId', adminController.updateDailyTask);
router.delete('/daily-tasks/:taskId', adminController.deleteDailyTask);

// Learn Concepts with YouTube Management
router.get('/concept-videos', adminController.getConceptVideos);
router.get('/concept-videos/:videoId', adminController.getConceptVideoById);
router.post('/concept-videos', adminController.createConceptVideo);
router.put('/concept-videos/:videoId', adminController.updateConceptVideo);
router.delete('/concept-videos/:videoId', adminController.deleteConceptVideo);

// HR Interview Preparation Management
router.get('/hr-interview-questions', adminController.getHRInterviewQuestions);
router.get('/hr-interview-questions/:questionId', adminController.getHRInterviewQuestionById);
router.post('/hr-interview-questions', adminController.createHRInterviewQuestion);
router.put('/hr-interview-questions/:questionId', adminController.updateHRInterviewQuestion);
router.delete('/hr-interview-questions/:questionId', adminController.deleteHRInterviewQuestion);

// Student Profiles Management
router.get('/profiles', adminController.getAllProfiles);
router.get('/profiles/:userId', adminController.getProfileById);
router.post('/profiles', adminController.createProfile);
router.put('/profiles/:userId', adminController.updateProfile);
router.delete('/profiles/:userId', adminController.deleteProfile);

// Mock Interviews Management
router.get('/mock-interviews', adminController.getAllMockInterviews);
router.post('/mock-interviews', adminController.createMockInterview);
router.put('/mock-interviews/:interviewId', adminController.updateMockInterview);
router.delete('/mock-interviews/:interviewId', adminController.deleteMockInterview);

module.exports = router;
