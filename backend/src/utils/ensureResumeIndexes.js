const Resume = require('../models/Resume');

const ensureResumeIndexes = async () => {
  try {
    const indexes = await Resume.collection.indexes();
    const badIndex = indexes.find((index) => (
      index.name === 'studentId_1_isActive_1'
      && index.unique
      && !index.partialFilterExpression
    ));

    if (badIndex) {
      await Resume.collection.dropIndex('studentId_1_isActive_1');
    }

    await Resume.collection.createIndex(
      { studentId: 1, isActive: 1 },
      {
        name: 'studentId_1_isActive_1',
        unique: true,
        partialFilterExpression: { isActive: true }
      }
    );
  } catch (error) {
    // Do not crash server on index repair failure.
    console.warn('Resume index repair warning:', error.message);
  }
};

module.exports = ensureResumeIndexes;
