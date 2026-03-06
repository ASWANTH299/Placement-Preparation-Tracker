const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      unique: true
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required']
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Company', companySchema);
