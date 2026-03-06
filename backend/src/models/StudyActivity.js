const mongoose = require('mongoose');

const studyActivitySchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    activityDate: {
      type: Date,
      required: true
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 0
    },
    activityType: {
      type: String,
      enum: ['question_solved', 'task_completed', 'study_session'],
      required: true
    },
    relatedEntityId: mongoose.Schema.Types.ObjectId,
    description: String
  },
  {
    timestamps: true
  }
);

// Compound index for unique constraint per day per student
studyActivitySchema.index({ studentId: 1, activityDate: 1 }, { unique: true });
studyActivitySchema.index({ studentId: 1 });
studyActivitySchema.index({ activityDate: -1 });

module.exports = mongoose.model('StudyActivity', studyActivitySchema);
