const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    suspiciousInteractionTimeThreshold: {
      type: Number,
      min: 1,
      default: 20,
      required: true,
    },
    crowdThreshold: {
      type: Number,
      min: 1,
      default: 10,
      required: true,
    },
    loiteringThreshold: {
      type: Number,
      min: 1,
      default: 60,
      required: true,
    },
    restrictedStartTime: {
      type: String,
      default: '00:00',
      required: true,
    },
    restrictedEndTime: {
      type: String,
      default: '00:00',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
