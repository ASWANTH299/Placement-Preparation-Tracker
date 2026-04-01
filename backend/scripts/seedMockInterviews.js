require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../src/models/User');
const MockInterview = require('../src/models/MockInterview');

const INTERVIEW_SEED = [
  { company: 'Google', date: '2026-03-01', score: 82, feedback: 'Strong DSA, improve communication clarity.' },
  { company: 'Amazon', date: '2026-02-20', score: 76, feedback: 'Good approach, optimize complexity explanation.' },
  { company: 'Microsoft', date: '2026-01-29', score: 80, feedback: 'Clean code, improve edge-case handling.' },
  { company: 'Meta', date: '2026-01-18', score: 84, feedback: 'Excellent problem decomposition and communication.' },
  { company: 'Adobe', date: '2026-01-11', score: 73, feedback: 'Good fundamentals, revise graph patterns.' },
  { company: 'Flipkart', date: '2025-12-28', score: 78, feedback: 'Solid attempt, faster implementation needed.' },
  { company: 'Uber', date: '2025-12-15', score: 81, feedback: 'Great optimization, explain tradeoffs better.' },
  { company: 'Atlassian', date: '2025-12-05', score: 74, feedback: 'Good logic, improve test case coverage.' },
  { company: 'PayPal', date: '2025-11-26', score: 79, feedback: 'Balanced performance, stronger communication recommended.' },
  { company: 'Goldman Sachs', date: '2025-11-14', score: 77, feedback: 'Correct approach, reduce time spent on brute force.' },
  { company: 'Apple', date: '2025-11-02', score: 83, feedback: 'Strong coding, explain memory decisions better.' },
  { company: 'Netflix', date: '2025-10-25', score: 75, feedback: 'Good implementation, improve communication during edge cases.' },
  { company: 'NVIDIA', date: '2025-10-10', score: 72, feedback: 'Revise system fundamentals and optimization patterns.' },
  { company: 'Salesforce', date: '2025-10-01', score: 80, feedback: 'Good quality answers, improve speed in coding round.' },
  { company: 'Oracle', date: '2025-09-19', score: 71, feedback: 'Need stronger SQL and DBMS articulation.' },
];

async function seedMockInterviews() {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    throw new Error('Missing MongoDB connection string. Set MONGODB_URI in backend/.env.');
  }

  await mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const students = await User.find({ role: 'student' }).select('_id name email').lean();
  if (!students.length) {
    console.log('No student users found. Create a student first, then run seed again.');
    await mongoose.disconnect();
    return;
  }

  const operations = [];
  students.forEach((student, studentIndex) => {
    INTERVIEW_SEED.forEach((entry, entryIndex) => {
      // Distribute interview history uniquely across students.
      const shiftedScore = Math.max(50, Math.min(100, entry.score + ((studentIndex % 3) - 1) * 2));
      operations.push({
        updateOne: {
          filter: {
            studentId: student._id,
            company: entry.company,
            interviewDate: new Date(entry.date),
          },
          update: {
            $setOnInsert: {
              studentId: student._id,
              company: entry.company,
              interviewDate: new Date(entry.date),
              score: shiftedScore,
              overallFeedback: entry.feedback,
              technicalSkills: 'Solid problem solving with scope to improve consistency.',
              communication: 'Clear explanation overall; refine edge-case articulation.',
              problemSolving: 'Good decomposition and pattern recognition.',
              improvements: `Focus area #${(entryIndex % 5) + 1}: optimize complexity and test coverage.`,
              interviewerName: 'Panel Interview',
              duration: 50,
            },
          },
          upsert: true,
        },
      });
    });
  });

  if (operations.length > 0) {
    await MockInterview.bulkWrite(operations, { ordered: false });
  }

  const total = await MockInterview.countDocuments({});
  console.log(`Mock interview seeding complete. Total mock interviews in DB: ${total}`);

  const perStudent = await MockInterview.aggregate([
    { $group: { _id: '$studentId', count: { $sum: 1 }, avgScore: { $avg: '$score' } } },
    { $sort: { count: -1 } }
  ]);

  const studentMap = new Map(students.map((s) => [String(s._id), s]));
  perStudent.forEach((item, index) => {
    const student = studentMap.get(String(item._id));
    const name = student?.name || 'Unknown';
    const email = student?.email || '-';
    console.log(`${index + 1}. ${name} (${email}) -> interviews=${item.count}, avgScore=${item.avgScore.toFixed(1)}`);
  });

  await mongoose.disconnect();
}

seedMockInterviews()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error('Mock interview seeding failed:', error.message);
    try {
      await mongoose.disconnect();
    } catch {
      // Ignore disconnect errors on failed startup.
    }
    process.exit(1);
  });
