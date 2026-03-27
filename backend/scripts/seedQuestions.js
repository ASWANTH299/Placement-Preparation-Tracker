require('dotenv').config();
const mongoose = require('mongoose');

const seedDefaultContent = require('../src/utils/seedDefaultContent');
const CompanyQuestion = require('../src/models/CompanyQuestion');

async function seedQuestions() {
  const mongoURI = process.env.NODE_ENV === 'production'
    ? process.env.MONGODB_PROD_URI
    : process.env.MONGODB_URI;

  if (!mongoURI) {
    throw new Error('Missing MongoDB connection string. Set MONGODB_URI (or MONGODB_PROD_URI in production).');
  }

  await mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await seedDefaultContent();

  const total = await CompanyQuestion.countDocuments({});
  const seeded = await CompanyQuestion.find({ status: 'Active' })
    .sort({ createdAt: -1 })
    .select('title company difficulty')
    .limit(20)
    .lean();

  console.log(`Question seeding complete. Total questions in DB: ${total}`);
  console.log('Sample stored questions:');
  seeded.forEach((item, index) => {
    console.log(`${index + 1}. ${item.title} | ${item.company} | ${item.difficulty}`);
  });

  await mongoose.disconnect();
}

seedQuestions()
  .then(() => {
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Question seeding failed:', error.message);
    try {
      await mongoose.disconnect();
    } catch {
      // Ignore disconnect errors on failed startup.
    }
    process.exit(1);
  });
