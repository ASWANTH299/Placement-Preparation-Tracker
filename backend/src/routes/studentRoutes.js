const express = require('express');
const studentController = require('../controllers/studentController');
const learningPathController = require('../controllers/learningPathController');
const questionController = require('../controllers/questionController');
const interviewController = require('../controllers/interviewController');
const resumeController = require('../controllers/resumeController');
const noteController = require('../controllers/noteController');
const leaderboardController = require('../controllers/leaderboardController');
const codingProfileController = require('../controllers/codingProfileController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file uploads
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.docx'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const avatarUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes((file.mimetype || '').toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WEBP images are allowed'));
    }
  },
  limits: { fileSize: 2 * 1024 * 1024 }
});

// Student Profile Routes
router.get('/students/:id/profile', studentController.getProfile);
router.put('/students/:id/profile', studentController.updateProfile);
router.post('/students/:id/profile/avatar', avatarUpload.single('avatar'), studentController.uploadProfileAvatar);
router.post('/students/:id/change-password', studentController.changePassword);

// Student dashboard routes
router.get('/students/:id/progress', studentController.getDashboardProgress);
router.get('/students/:id/streak', studentController.getStudyStreak);
router.get('/students/:id/activity', studentController.getTodayActivity);
router.post('/students/:id/activity', studentController.logTodayActivity);
router.get('/students/:id/learning-path', studentController.getCurrentLearningPath);

// Student Profile Links Routes (GitHub, LinkedIn, Portfolio)
router.get('/students/:id/profiles', studentController.getProfileLinks);
router.put('/students/:id/profiles', studentController.updateProfileLinks);

// Learning Paths Routes (specific routes before generic ones)
router.get('/learning-paths', learningPathController.getAllLearningPaths);
router.get('/learning-paths/:weekId', learningPathController.getLearningPathByWeek);
router.get('/students/:id/learning-progress', learningPathController.getStudentProgress);
router.post('/students/:id/learning-progress/:weekId/problems/:problemIndex', (req, res, next) => {
  req.body.problemIndex = Number(req.params.problemIndex);
  return learningPathController.updateWeekProgress(req, res, next);
});
router.post('/students/:id/learning-progress/:weekId/notes', learningPathController.addNote);
router.get('/students/:id/learning-progress/:weekId', learningPathController.getWeekProgress);
router.post('/students/:id/learning-progress/:weekId', learningPathController.updateWeekProgress);

// Company Questions Routes (specific routes before generic ones)
router.get('/company-questions', questionController.getQuestions);
router.post('/practice/run-code', questionController.runCode);
router.post('/practice/submit-code', questionController.submitCode);
router.post('/company-questions/:questionId/mark-solved', questionController.markSolved);
router.post('/company-questions/:questionId/mark-attempted', questionController.markAttempted);
router.post('/company-questions/:questionId/bookmark', questionController.toggleBookmark);
router.get('/company-questions/:questionId', questionController.getQuestionDetail);

// Mock Interviews Routes (specific routes before generic ones)
router.get('/students/:id/mock-interviews/statistics', interviewController.getInterviewStats);
router.get('/students/:id/mock-interviews/:interviewId', interviewController.getInterviewDetail);
router.get('/students/:id/mock-interviews', interviewController.getMockInterviews);
router.post('/students/:id/mock-interviews', interviewController.createInterview);
router.put('/students/:id/mock-interviews/:interviewId', interviewController.updateInterview);
router.delete('/students/:id/mock-interviews/:interviewId', interviewController.deleteInterview);

// Resume Routes (specific routes before generic ones)
router.post('/students/:id/resumes/upload', upload.single('file'), resumeController.uploadResume);
router.put('/students/:id/resumes/:resumeId/set-active', resumeController.setActiveResume);
router.put('/students/:id/resumes/:resumeId/rename', resumeController.renameResume);
router.get('/students/:id/resumes', resumeController.getResumes);
router.get('/students/:id/resumes/:resumeId/download', resumeController.downloadResume);
router.delete('/students/:id/resumes/:resumeId', resumeController.deleteResume);

// Notes Routes (specific routes before generic ones)
router.post('/students/:id/notes', noteController.createNote);
router.get('/students/:id/notes', noteController.getNotes);
router.put('/students/:id/notes/:noteId', noteController.updateNote);
router.delete('/students/:id/notes/:noteId', noteController.deleteNote);
router.get('/notes/:noteId', noteController.getNote);

// Leaderboard Routes
router.get('/leaderboard', leaderboardController.getLeaderboard);
router.get('/leaderboard/my-rank/:studentId', leaderboardController.getMyRank);

// Coding Profile Routes (specific routes before generic ones)
router.post('/students/:id/coding-profiles', codingProfileController.linkProfile);
router.get('/students/:id/coding-profiles', codingProfileController.getCodingProfiles);
router.put('/students/:id/coding-profiles/:platformId', codingProfileController.refreshProfile);
router.delete('/students/:id/coding-profiles/:platformId', codingProfileController.unlinkProfile);

module.exports = router;
