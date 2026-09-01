const fs = require('fs').promises;
const path = require('path');
const User = require('../models/User');
const LearningPath = require('../models/LearningPath');
const CompanyQuestion = require('../models/CompanyQuestion');
const StudentProgress = require('../models/StudentProgress');
const QuestionProgress = require('../models/QuestionProgress');
const MockInterview = require('../models/MockInterview');
const Resume = require('../models/Resume');
const Note = require('../models/Note');
const DailyTask = require('../models/DailyTask');
const ConceptVideo = require('../models/ConceptVideo');
const HRInterviewQuestion = require('../models/HRInterviewQuestion');
const CodingProfile = require('../models/CodingProfile');
const StudentProject = require('../models/StudentProject');
const StudyActivity = require('../models/StudyActivity');
const ForumMessage = require('../models/ForumMessage');
const { AppError } = require('../utils/errorHandler');
const { logAdminAudit } = require('../utils/adminAuditLogger');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const DEFAULT_CONCEPT_VIDEOS = [
  { title: 'Arrays - Complete Concept Review', topic: 'Arrays', level: 'Beginner', youtubeUrl: 'https://www.youtube.com/watch?v=37E9ckMDdTk' },
  { title: 'Linked Lists Explained', topic: 'Linked Lists', level: 'Beginner', youtubeUrl: 'https://www.youtube.com/watch?v=lj_ExDKL9BM' },
  { title: 'Stacks Data Structure', topic: 'Stacks', level: 'Beginner', youtubeUrl: 'https://www.youtube.com/watch?v=F1F2imiOJfk' },
  { title: 'Queues in Data Structures', topic: 'Queues', level: 'Beginner', youtubeUrl: 'https://www.youtube.com/watch?v=okr-XE8yTO8' },
  { title: 'Sliding Window Technique', topic: 'Sliding Window', level: 'Intermediate', youtubeUrl: 'https://www.youtube.com/watch?v=MK-NZ4hN7rs' },
  { title: 'Two Pointer Technique Patterns', topic: 'Two Pointer Technique', level: 'Intermediate', youtubeUrl: 'https://www.youtube.com/watch?v=QzZ7nmouLTI' },
  { title: 'Binary Search Patterns', topic: 'Binary Search', level: 'Beginner', youtubeUrl: 'https://www.youtube.com/watch?v=4sQL7R5ySUU' },
  { title: 'Recursion Fundamentals', topic: 'Recursion', level: 'Intermediate', youtubeUrl: 'https://www.youtube.com/watch?v=IJDJ0kBx2LM' },
  { title: 'Backtracking Complete Guide', topic: 'Backtracking', level: 'Intermediate', youtubeUrl: 'https://www.youtube.com/watch?v=DKCbsiDBN6c' },
  { title: 'Trees and Traversals', topic: 'Trees', level: 'Intermediate', youtubeUrl: 'https://www.youtube.com/watch?v=_ANrF3FJm7I' },
  { title: 'Binary Search Trees (BST) Concepts', topic: 'Binary Search Trees', level: 'Intermediate', youtubeUrl: 'https://www.youtube.com/watch?v=aQYz2qpmzEw' },
  { title: 'Heaps and Priority Queue', topic: 'Heaps', level: 'Intermediate', youtubeUrl: 'https://www.youtube.com/watch?v=HqPJF2L5h9U' },
  { title: 'Graph Algorithms Essentials', topic: 'Graphs', level: 'Intermediate', youtubeUrl: 'https://www.youtube.com/watch?v=tWVWeAqZ0WU' },
  { title: 'Dynamic Programming Patterns', topic: 'Dynamic Programming', level: 'Advanced', youtubeUrl: 'https://www.youtube.com/watch?v=oBt53YbR9Kk' },
  { title: 'Greedy Algorithms Explained', topic: 'Greedy Algorithms', level: 'Advanced', youtubeUrl: 'https://www.youtube.com/watch?v=ARvQcqJ_-NY' },
  { title: 'Trie Data Structure for Strings', topic: 'Trie', level: 'Advanced', youtubeUrl: 'https://www.youtube.com/watch?v=zIjfhVPRZCg' },
  { title: 'Segment Tree Full Tutorial', topic: 'Segment Trees', level: 'Advanced', youtubeUrl: 'https://www.youtube.com/watch?v=ZBHKZF5w4YU' },
  { title: 'Bit Manipulation Essentials', topic: 'Bit Manipulation', level: 'Advanced', youtubeUrl: 'https://www.youtube.com/watch?v=5rtVTYAk9KQ' },
  { title: 'System Design Basics for Placements', topic: 'System Design Basics', level: 'Advanced', youtubeUrl: 'https://www.youtube.com/watch?v=xpDnVSmNFX0' },
  { title: 'Concurrency and Multithreading Basics', topic: 'Concurrency Basics', level: 'Advanced', youtubeUrl: 'https://www.youtube.com/watch?v=r_MbozD32eo' }
];

const ensureDefaultConceptVideos = async () => {
  const total = await ConceptVideo.countDocuments();
  if (total > 0) return;

  await ConceptVideo.insertMany(
    DEFAULT_CONCEPT_VIDEOS.map((video) => ({
      ...video,
      description: '',
      tags: [],
      isActive: true
    }))
  );
};

const DEFAULT_HR_INTERVIEW_QUESTIONS = [
  {
    question: 'Why should we hire you?',
    answer: 'You should hire me because I bring a strong mix of technical foundation, consistent learning habits, and a team-oriented attitude. I take ownership of tasks, communicate clearly, and focus on delivering reliable outcomes. I am confident that I can contribute quickly while continuing to grow with your team.',
    explanation: 'Connect your skills to the role, mention work ethic, and show confidence without sounding overconfident.'
  },
  {
    question: 'Why do you want to work at this company?',
    answer: 'I want to work at this company because it has a strong reputation for innovation and meaningful impact in the industry. I admire the company\'s culture of learning, collaboration, and quality. This role aligns with my goals, and I believe I can contribute while also growing professionally in a high-performing environment.',
    explanation: 'Show that you researched the company and link its values and work style to your personal goals.'
  },
  {
    question: 'Tell me about yourself.',
    answer: 'I am a motivated student focused on building a career in software development. I have been strengthening my skills through coding practice, projects, and structured preparation. I enjoy solving problems, learning new technologies, and collaborating with others. I am currently looking for an opportunity where I can apply my skills and continue learning from experienced professionals.',
    explanation: 'Use a present-past-future structure: who you are now, what built your profile, and what you are aiming for next.'
  },
  {
    question: 'What are your strengths?',
    answer: 'One of my biggest strengths is consistency. I set clear goals and follow through with discipline. I am also a quick learner and adapt well to new tools and workflows. In team settings, I communicate proactively and make sure tasks are completed with quality and on time.',
    explanation: 'Pick 2-3 strengths and support each with practical behavior instead of only adjectives.'
  },
  {
    question: 'What are your weaknesses?',
    answer: 'Earlier, I used to spend too much time perfecting small details, which sometimes slowed me down. I have improved by setting clear time limits and prioritizing impact over perfection. This helped me maintain quality while delivering work faster and more consistently.',
    explanation: 'Share a real weakness, then explain concrete steps you are taking to improve it.'
  },
  {
    question: 'Where do you see yourself in five years?',
    answer: 'In five years, I see myself as a dependable software professional who can own features end-to-end and mentor junior team members. I want to deepen my expertise in system design and product thinking while contributing to projects that create measurable user value.',
    explanation: 'Keep goals ambitious but realistic, and align them with growth inside the company.'
  },
  {
    question: 'Why should we hire you over other candidates?',
    answer: 'I offer a combination of strong fundamentals, practical project experience, and a growth mindset. I prepare thoroughly, accept feedback positively, and adapt quickly to team expectations. Along with technical ability, I bring accountability and a collaborative approach that helps teams execute effectively.',
    explanation: 'Differentiate yourself through habits and outcomes, not by comparing negatively with others.'
  },
  {
    question: 'Tell me about a challenge you faced.',
    answer: 'During a project, I faced integration issues between frontend and backend modules close to a deadline. I broke the problem into smaller parts, coordinated with teammates, and tested each flow systematically. We identified root causes, fixed them quickly, and delivered on time with stable functionality.',
    explanation: 'Use the STAR format: Situation, Task, Action, Result.'
  },
  {
    question: 'Describe a time you worked in a team.',
    answer: 'In a group project, I took responsibility for coordinating API integration and progress tracking. I regularly communicated blockers, aligned interfaces with teammates, and helped review key changes. Our collaboration reduced rework and allowed us to complete the project smoothly before submission.',
    explanation: 'Highlight your role, communication habits, and how teamwork improved the final result.'
  },
  {
    question: 'How do you handle pressure?',
    answer: 'I handle pressure by staying organized and focusing on priorities. I break complex work into smaller tasks, estimate effort, and track progress continuously. When needed, I communicate early about risks so we can adjust quickly and keep the work on schedule.',
    explanation: 'Show calm decision-making, structured execution, and proactive communication.'
  },
  {
    question: 'What motivates you?',
    answer: 'I am motivated by continuous improvement and meaningful outcomes. I enjoy learning new concepts, solving challenging problems, and seeing my work create value for users or teams. Progress, responsibility, and the chance to contribute to impactful projects keep me highly driven.',
    explanation: 'Focus on intrinsic motivation like learning, ownership, and impact.'
  },
  {
    question: 'Why did you choose your field of study?',
    answer: 'I chose this field because I enjoy logical problem-solving and building practical solutions using technology. The combination of analytical thinking and real-world application attracted me. Over time, projects and practice strengthened my interest and confirmed that this is the right career path for me.',
    explanation: 'Keep it personal and authentic, and connect your choice to ongoing effort and outcomes.'
  },
  {
    question: 'What are your career goals?',
    answer: 'My short-term goal is to become a strong contributor in a professional software team by delivering reliable features and learning best practices. My long-term goal is to grow into a role where I can design scalable systems, lead initiatives, and mentor others while continuing to learn.',
    explanation: 'Include both short-term and long-term goals, with a clear progression path.'
  },
  {
    question: 'Are you willing to relocate?',
    answer: 'Yes, I am open to relocating if the role requires it. I see relocation as an opportunity to grow professionally and adapt to new environments. I am flexible and prepared to make the transition based on the organization\'s needs.',
    explanation: 'Answer clearly and positively while showing professionalism and flexibility.'
  },
  {
    question: 'Do you have any questions for us?',
    answer: 'Yes, I would like to know how success is measured for this role in the first six months. I am also interested in understanding the team\'s working style, mentorship opportunities, and the kind of projects I would initially contribute to.',
    explanation: 'Ask thoughtful questions about expectations, team culture, and learning opportunities.'
  }
];

const ensureDefaultHRInterviewQuestions = async () => {
  const total = await HRInterviewQuestion.countDocuments();
  if (total > 0) return;

  await HRInterviewQuestion.insertMany(
    DEFAULT_HR_INTERVIEW_QUESTIONS.map((item) => ({
      ...item,
      tags: [],
      isActive: true
    }))
  );
};

const buildTempPassword = () => {
  const randomPart = Math.random().toString(36).slice(-6);
  return `Temp@${randomPart}A1`;
};

const getAnalyticsPayload = async () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalUsers = await User.countDocuments({ role: 'student' });
  const activeUsersThisMonth = await User.countDocuments({
    role: 'student',
    lastLogin: { $gte: monthStart }
  });
  const newUsersThisMonth = await User.countDocuments({
    role: 'student',
    createdAt: { $gte: monthStart }
  });

  const allProgress = await StudentProgress.find().select('completionPercentage');
  const avgProgressPercentage = allProgress.length > 0
    ? Math.round(allProgress.reduce((sum, p) => sum + (p.completionPercentage || 0), 0) / allProgress.length)
    : 0;

  const totalQuestionsSolved = await QuestionProgress.countDocuments({ isSolved: true });
  const avgQuestionsPerStudent = totalUsers > 0 ? totalQuestionsSolved / totalUsers : 0;

  const interviews = await MockInterview.find().select('score');
  const avgMockScore = interviews.length > 0
    ? Math.round((interviews.reduce((sum, i) => sum + (i.score || 0), 0) / interviews.length) * 10) / 10
    : 0;

  return {
    totalUsers,
    activeUsersThisMonth,
    newUsersThisMonth,
    averageProgressPercentage: avgProgressPercentage,
    totalQuestionsSolved,
    averageQuestionsPerStudent: Math.round(avgQuestionsPerStudent * 10) / 10,
    totalMockInterviews: interviews.length,
    averageMockScore: avgMockScore
  };
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res, next) => {
  try {
    const analytics = await getAnalyticsPayload();

    res.status(200).json({
      success: true,
      data: {
        ...analytics,
        systemUptime: 99.95,
        dbResponseTimeMs: 12.5,
        apiRequestsPerMinute: 1240
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all users
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 25, search, sortBy = 'created', order = 'desc' } = req.query;

    const query = { role: 'student' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = {};
    if (sortBy === 'progress') sortObj.progressPercentage = order === 'asc' ? 1 : -1;
    else if (sortBy === 'name') sortObj.name = order === 'asc' ? 1 : -1;
    else sortObj.createdAt = order === 'asc' ? 1 : -1;

    const users = await User.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortObj)
      .select('-password');

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
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

// Get user detail
exports.getUserDetail = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return next(new AppError('User not found', 404, 'NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Update user
exports.updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Don't allow role changes
    if (updateData.role) {
      delete updateData.role;
    }
    if (updateData.password) {
      delete updateData.password;
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-password');

    if (!user) {
      return next(new AppError('User not found', 404, 'NOT_FOUND'));
    }

    await logAdminAudit(req, {
      action: 'UPDATE_USER',
      targetType: 'User',
      targetId: userId,
      status: 'SUCCESS',
      metadata: { changedFields: Object.keys(updateData || {}) }
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Delete user
exports.deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { confirmDelete } = req.body;

    if (!confirmDelete) {
      return next(new AppError('Confirmation required to delete user', 400, 'VALIDATION_ERROR'));
    }

    // 1. Delete user
    await User.findByIdAndDelete(userId);

    // 2. Delete progress, mock interviews, notes, activities, and profiles
    await StudentProgress.deleteMany({ studentId: userId });
    await QuestionProgress.deleteMany({ studentId: userId });
    await MockInterview.deleteMany({ studentId: userId });
    await Note.deleteMany({ studentId: userId });
    await StudyActivity.deleteMany({ studentId: userId });
    await CodingProfile.deleteMany({ studentId: userId });

    // 3. Delete Resumes and clean up physical files from disk
    const resumes = await Resume.find({ studentId: userId });
    await Promise.all(
      resumes.map(async (resume) => {
        if (resume.filePath) {
          try {
            await fs.unlink(path.resolve(resume.filePath));
          } catch (fileErr) {
            console.warn('Resume file cleanup warning during user delete:', fileErr.message);
          }
        }
      })
    );
    await Resume.deleteMany({ studentId: userId });

    // 4. Delete Student Projects and clean up project files from disk
    const projects = await StudentProject.find({ studentId: userId });
    await Promise.all(
      projects.map(async (project) => {
        await Promise.all(
          (project.files || []).map(async (file) => {
            if (file.filePath) {
              try {
                await fs.unlink(path.resolve(file.filePath));
              } catch (fileErr) {
                console.warn('Project file cleanup warning during user delete:', fileErr.message);
              }
            }
          })
        );
      })
    );
    await StudentProject.deleteMany({ studentId: userId });

    // 5. Delete forum messages authored by user
    await ForumMessage.deleteMany({ userId });

    await logAdminAudit(req, {
      action: 'DELETE_USER',
      targetType: 'User',
      targetId: userId,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      message: 'User deleted permanently'
    });
  } catch (error) {
    next(error);
  }
};

// Create learning path
exports.createLearningPath = async (req, res, next) => {
  try {
    const path = new LearningPath(req.body);
    await path.save();

    await logAdminAudit(req, {
      action: 'CREATE_LEARNING_PATH',
      targetType: 'LearningPath',
      targetId: path._id,
      status: 'SUCCESS'
    });

    res.status(201).json({
      success: true,
      data: path,
      message: 'Learning path created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Update learning path
exports.updateLearningPath = async (req, res, next) => {
  try {
    const { topicId } = req.params;

    const path = await LearningPath.findByIdAndUpdate(topicId, req.body, { new: true, runValidators: true });

    if (!path) {
      return next(new AppError('Learning path not found', 404, 'NOT_FOUND'));
    }

    await logAdminAudit(req, {
      action: 'UPDATE_LEARNING_PATH',
      targetType: 'LearningPath',
      targetId: topicId,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      data: path
    });
  } catch (error) {
    next(error);
  }
};

// Delete learning path
exports.deleteLearningPath = async (req, res, next) => {
  try {
    const { topicId } = req.params;

    const path = await LearningPath.findByIdAndDelete(topicId);

    if (!path) {
      return next(new AppError('Learning path not found', 404, 'NOT_FOUND'));
    }

    // Cascade delete related progress records
    await StudentProgress.deleteMany({ topicId });

    await logAdminAudit(req, {
      action: 'DELETE_LEARNING_PATH',
      targetType: 'LearningPath',
      targetId: topicId,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      message: 'Learning path deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Create company question
exports.createQuestion = async (req, res, next) => {
  try {
    const question = new CompanyQuestion(req.body);
    await question.save();

    await logAdminAudit(req, {
      action: 'CREATE_COMPANY_QUESTION',
      targetType: 'CompanyQuestion',
      targetId: question._id,
      status: 'SUCCESS'
    });

    res.status(201).json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
};

// Update question
exports.updateQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;

    const question = await CompanyQuestion.findByIdAndUpdate(questionId, req.body, { new: true, runValidators: true });

    if (!question) {
      return next(new AppError('Question not found', 404, 'NOT_FOUND'));
    }

    await logAdminAudit(req, {
      action: 'UPDATE_COMPANY_QUESTION',
      targetType: 'CompanyQuestion',
      targetId: questionId,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
};

// Delete question
exports.deleteQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;

    const question = await CompanyQuestion.findByIdAndDelete(questionId);

    if (!question) {
      return next(new AppError('Question not found', 404, 'NOT_FOUND'));
    }

    // Delete related progress
    await QuestionProgress.deleteMany({ questionId });

    await logAdminAudit(req, {
      action: 'DELETE_COMPANY_QUESTION',
      targetType: 'CompanyQuestion',
      targetId: questionId,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Create student user
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, university = '', department = '' } = req.body;

    if (!name || !email) {
      return next(new AppError('Name and email are required', 400, 'VALIDATION_ERROR'));
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return next(new AppError('Email already exists', 409, 'EMAIL_EXISTS'));
    }

    const temporaryPassword = password || buildTempPassword();
    const user = new User({
      name: String(name).trim(),
      email: normalizedEmail,
      password: temporaryPassword,
      role: 'student',
      university,
      department,
      mustResetPassword: true
    });

    await user.save();

    await logAdminAudit(req, {
      action: 'CREATE_USER',
      targetType: 'User',
      targetId: user._id,
      status: 'SUCCESS',
      metadata: { email: normalizedEmail }
    });

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustResetPassword: user.mustResetPassword,
        temporaryPassword
      },
      message: 'User created successfully with temporary credentials'
    });
  } catch (error) {
    next(error);
  }
};

// Analytics alias endpoint
exports.getAnalytics = async (req, res, next) => {
  try {
    const analytics = await getAnalyticsPayload();
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

// Get all mock interviews (admin-wide)
exports.getAllMockInterviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 25, search, company, sortBy = 'interviewDate', order = 'desc' } = req.query;

    const query = {};
    if (company && company !== 'All') {
      query.company = company;
    }

    if (search) {
      query.$or = [
        { company: { $regex: search, $options: 'i' } },
        { overallFeedback: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const sortField = ['score', 'interviewDate', 'createdAt'].includes(sortBy) ? sortBy : 'interviewDate';
    const sortObj = { [sortField]: order === 'asc' ? 1 : -1 };

    const interviews = await MockInterview.find(query)
      .populate('studentId', 'name email')
      .skip(skip)
      .limit(parseInt(limit, 10))
      .sort(sortObj);

    const total = await MockInterview.countDocuments(query);

    res.status(200).json({
      success: true,
      data: interviews,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create mock interview (admin-wide)
exports.createMockInterview = async (req, res, next) => {
  try {
    const { studentId, company, interviewDate, score, overallFeedback, technicalSkills, communication, problemSolving, improvements, interviewerName, duration } = req.body;

    if (!studentId || !company || !interviewDate || score === undefined) {
      return next(new AppError('studentId, company, interviewDate, and score are required', 400, 'VALIDATION_ERROR'));
    }

    const student = await User.findOne({ _id: studentId, role: 'student' }).select('_id email');
    if (!student) {
      return next(new AppError('Student not found', 404, 'NOT_FOUND'));
    }

    if (score < 0 || score > 100) {
      return next(new AppError('Score must be between 0-100', 400, 'VALIDATION_ERROR'));
    }

    const interview = new MockInterview({
      studentId,
      company,
      interviewDate,
      score,
      overallFeedback,
      technicalSkills,
      communication,
      problemSolving,
      improvements,
      interviewerName,
      duration
    });

    await interview.save();

    await logAdminAudit(req, {
      action: 'CREATE_MOCK_INTERVIEW',
      targetType: 'MockInterview',
      targetId: interview._id,
      status: 'SUCCESS',
      metadata: { studentId }
    });

    res.status(201).json({
      success: true,
      data: interview,
      message: 'Mock interview created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Update mock interview (admin-wide)
exports.updateMockInterview = async (req, res, next) => {
  try {
    const { interviewId } = req.params;
    const updateData = req.body;

    if (updateData.score !== undefined && (updateData.score < 0 || updateData.score > 100)) {
      return next(new AppError('Score must be between 0-100', 400, 'VALIDATION_ERROR'));
    }

    const interview = await MockInterview.findByIdAndUpdate(interviewId, updateData, {
      new: true,
      runValidators: true
    });

    if (!interview) {
      return next(new AppError('Interview not found', 404, 'NOT_FOUND'));
    }

    await logAdminAudit(req, {
      action: 'UPDATE_MOCK_INTERVIEW',
      targetType: 'MockInterview',
      targetId: interviewId,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      data: interview,
      message: 'Mock interview updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete mock interview (admin-wide)
exports.deleteMockInterview = async (req, res, next) => {
  try {
    const { interviewId } = req.params;

    const interview = await MockInterview.findByIdAndDelete(interviewId);

    if (!interview) {
      return next(new AppError('Interview not found', 404, 'NOT_FOUND'));
    }

    await logAdminAudit(req, {
      action: 'DELETE_MOCK_INTERVIEW',
      targetType: 'MockInterview',
      targetId: interviewId,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      message: 'Mock interview deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Daily task management
exports.getDailyTasks = async (req, res, next) => {
  try {
    const { page = 1, limit = 25, search, platform, difficulty, isActive } = req.query;

    const query = {};
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { company: { $regex: safeSearch, $options: 'i' } },
        { tags: { $regex: safeSearch, $options: 'i' } }
      ];
    }
    if (platform && platform !== 'All') query.platform = platform;
    if (difficulty && difficulty !== 'All') query.difficulty = difficulty;
    if (isActive === 'true') query.isActive = true;
    if (isActive === 'false') query.isActive = false;

    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.max(parseInt(limit, 10) || 25, 1);
    const skip = (safePage - 1) * safeLimit;

    const [rows, total] = await Promise.all([
      DailyTask.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
      DailyTask.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.max(Math.ceil(total / safeLimit), 1)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getDailyTaskById = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await DailyTask.findById(taskId);

    if (!task) {
      return next(new AppError('Daily task not found', 404, 'NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

exports.createDailyTask = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      tags: Array.isArray(req.body.tags)
        ? req.body.tags.map((tag) => String(tag).trim()).filter(Boolean)
        : []
    };

    const task = await DailyTask.create(payload);

    await logAdminAudit(req, {
      action: 'CREATE_DAILY_TASK',
      targetType: 'DailyTask',
      targetId: task._id,
      status: 'SUCCESS'
    });

    res.status(201).json({
      success: true,
      data: task,
      message: 'Daily task created successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.updateDailyTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const payload = {
      ...req.body,
      tags: Array.isArray(req.body.tags)
        ? req.body.tags.map((tag) => String(tag).trim()).filter(Boolean)
        : req.body.tags
    };

    const task = await DailyTask.findByIdAndUpdate(taskId, payload, {
      new: true,
      runValidators: true
    });

    if (!task) {
      return next(new AppError('Daily task not found', 404, 'NOT_FOUND'));
    }

    await logAdminAudit(req, {
      action: 'UPDATE_DAILY_TASK',
      targetType: 'DailyTask',
      targetId: taskId,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      data: task,
      message: 'Daily task updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteDailyTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await DailyTask.findByIdAndDelete(taskId);

    if (!task) {
      return next(new AppError('Daily task not found', 404, 'NOT_FOUND'));
    }

    await logAdminAudit(req, {
      action: 'DELETE_DAILY_TASK',
      targetType: 'DailyTask',
      targetId: taskId,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      message: 'Daily task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Concept video management (Learn Concepts with YouTube)
exports.getConceptVideos = async (req, res, next) => {
  try {
    await ensureDefaultConceptVideos();

    const { page = 1, limit = 25, search, topic, level, isActive } = req.query;

    const query = {};
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { topic: { $regex: safeSearch, $options: 'i' } },
        { tags: { $regex: safeSearch, $options: 'i' } }
      ];
    }
    if (topic && topic !== 'All') query.topic = topic;
    if (level && level !== 'All') query.level = level;
    if (isActive === 'true') query.isActive = true;
    if (isActive === 'false') query.isActive = false;

    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.max(parseInt(limit, 10) || 25, 1);
    const skip = (safePage - 1) * safeLimit;

    const [rows, total] = await Promise.all([
      ConceptVideo.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
      ConceptVideo.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.max(Math.ceil(total / safeLimit), 1)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getConceptVideoById = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const video = await ConceptVideo.findById(videoId);

    if (!video) {
      return next(new AppError('Concept video not found', 404, 'NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: video
    });
  } catch (error) {
    next(error);
  }
};

exports.createConceptVideo = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      tags: Array.isArray(req.body.tags)
        ? req.body.tags.map((tag) => String(tag).trim()).filter(Boolean)
        : []
    };

    const video = await ConceptVideo.create(payload);

    await logAdminAudit(req, {
      action: 'CREATE_CONCEPT_VIDEO',
      targetType: 'ConceptVideo',
      targetId: video._id,
      status: 'SUCCESS'
    });

    res.status(201).json({
      success: true,
      data: video,
      message: 'Concept video created successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.updateConceptVideo = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const payload = {
      ...req.body,
      tags: Array.isArray(req.body.tags)
        ? req.body.tags.map((tag) => String(tag).trim()).filter(Boolean)
        : req.body.tags
    };

    const video = await ConceptVideo.findByIdAndUpdate(videoId, payload, {
      new: true,
      runValidators: true
    });

    if (!video) {
      return next(new AppError('Concept video not found', 404, 'NOT_FOUND'));
    }

    await logAdminAudit(req, {
      action: 'UPDATE_CONCEPT_VIDEO',
      targetType: 'ConceptVideo',
      targetId: videoId,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      data: video,
      message: 'Concept video updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteConceptVideo = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const video = await ConceptVideo.findByIdAndDelete(videoId);

    if (!video) {
      return next(new AppError('Concept video not found', 404, 'NOT_FOUND'));
    }

    await logAdminAudit(req, {
      action: 'DELETE_CONCEPT_VIDEO',
      targetType: 'ConceptVideo',
      targetId: videoId,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      message: 'Concept video deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// HR interview preparation management
exports.getHRInterviewQuestions = async (req, res, next) => {
  try {
    await ensureDefaultHRInterviewQuestions();

    const { page = 1, limit = 25, search, isActive } = req.query;

    const query = {};
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { question: { $regex: safeSearch, $options: 'i' } },
        { answer: { $regex: safeSearch, $options: 'i' } },
        { explanation: { $regex: safeSearch, $options: 'i' } },
        { tags: { $regex: safeSearch, $options: 'i' } }
      ];
    }
    if (isActive === 'true') query.isActive = true;
    if (isActive === 'false') query.isActive = false;

    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.max(parseInt(limit, 10) || 25, 1);
    const skip = (safePage - 1) * safeLimit;

    const [rows, total] = await Promise.all([
      HRInterviewQuestion.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
      HRInterviewQuestion.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.max(Math.ceil(total / safeLimit), 1)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getHRInterviewQuestionById = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const item = await HRInterviewQuestion.findById(questionId);

    if (!item) {
      return next(new AppError('HR interview question not found', 404, 'NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

exports.createHRInterviewQuestion = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      tags: Array.isArray(req.body.tags)
        ? req.body.tags.map((tag) => String(tag).trim()).filter(Boolean)
        : []
    };

    const item = await HRInterviewQuestion.create(payload);

    await logAdminAudit(req, {
      action: 'CREATE_HR_INTERVIEW_QUESTION',
      targetType: 'HRInterviewQuestion',
      targetId: item._id,
      status: 'SUCCESS'
    });

    res.status(201).json({
      success: true,
      data: item,
      message: 'HR interview question created successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.updateHRInterviewQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const payload = {
      ...req.body,
      tags: Array.isArray(req.body.tags)
        ? req.body.tags.map((tag) => String(tag).trim()).filter(Boolean)
        : req.body.tags
    };

    const item = await HRInterviewQuestion.findByIdAndUpdate(questionId, payload, {
      new: true,
      runValidators: true
    });

    if (!item) {
      return next(new AppError('HR interview question not found', 404, 'NOT_FOUND'));
    }

    await logAdminAudit(req, {
      action: 'UPDATE_HR_INTERVIEW_QUESTION',
      targetType: 'HRInterviewQuestion',
      targetId: questionId,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      data: item,
      message: 'HR interview question updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteHRInterviewQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const item = await HRInterviewQuestion.findByIdAndDelete(questionId);

    if (!item) {
      return next(new AppError('HR interview question not found', 404, 'NOT_FOUND'));
    }

    await logAdminAudit(req, {
      action: 'DELETE_HR_INTERVIEW_QUESTION',
      targetType: 'HRInterviewQuestion',
      targetId: questionId,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      message: 'HR interview question deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Profile management
exports.getAllProfiles = async (req, res, next) => {
  try {
    const { page = 1, limit = 25, search } = req.query;
    const query = { role: 'student' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { university: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    const safePage = parseInt(page, 10);
    const safeLimit = parseInt(limit, 10);
    const skip = (safePage - 1) * safeLimit;

    const [profiles, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: profiles,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getProfileById = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const profile = await User.findOne({ _id: userId, role: 'student' }).select('-password');

    if (!profile) {
      return next(new AppError('Profile not found', 404, 'NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

exports.createProfile = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      bio = '',
      avatar = null,
      university = '',
      graduationYear = null,
      department = '',
      githubProfile = null,
      linkedinProfile = null,
      portfolioLink = null,
      isActive = true
    } = req.body;

    if (!name || !email) {
      return next(new AppError('Name and email are required', 400, 'VALIDATION_ERROR'));
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return next(new AppError('Email already exists', 409, 'EMAIL_EXISTS'));
    }

    const temporaryPassword = password || buildTempPassword();
    const profile = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: temporaryPassword,
      role: 'student',
      bio,
      avatar,
      university,
      graduationYear,
      department,
      githubProfile,
      linkedinProfile,
      portfolioLink,
      isActive,
      mustResetPassword: true
    });

    await logAdminAudit(req, {
      action: 'CREATE_PROFILE',
      targetType: 'User',
      targetId: profile._id,
      status: 'SUCCESS'
    });

    res.status(201).json({
      success: true,
      data: {
        ...profile.toJSON(),
        temporaryPassword
      },
      message: 'Profile created successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const updateData = { ...req.body };

    delete updateData.password;
    delete updateData.role;

    if (updateData.email) {
      const normalizedEmail = String(updateData.email).toLowerCase().trim();
      const exists = await User.findOne({ email: normalizedEmail, _id: { $ne: userId } });
      if (exists) {
        return next(new AppError('Email already exists', 409, 'EMAIL_EXISTS'));
      }
      updateData.email = normalizedEmail;
    }

    const profile = await User.findOneAndUpdate(
      { _id: userId, role: 'student' },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!profile) {
      return next(new AppError('Profile not found', 404, 'NOT_FOUND'));
    }

    await logAdminAudit(req, {
      action: 'UPDATE_PROFILE',
      targetType: 'User',
      targetId: userId,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      data: profile,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const profile = await User.findOneAndDelete({ _id: userId, role: 'student' });
    if (!profile) {
      return next(new AppError('Profile not found', 404, 'NOT_FOUND'));
    }

    await Promise.all([
      StudentProgress.deleteMany({ studentId: userId }),
      QuestionProgress.deleteMany({ studentId: userId }),
      MockInterview.deleteMany({ studentId: userId }),
      Resume.deleteMany({ studentId: userId }),
      Note.deleteMany({ studentId: userId })
    ]);

    await logAdminAudit(req, {
      action: 'DELETE_PROFILE',
      targetType: 'User',
      targetId: userId,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
