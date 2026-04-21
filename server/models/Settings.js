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
    crowdThreshold: {
      type: Number,
      min: 1,
      default: 10,
      required: true,
    },
    loiteringTimeThreshold: {
      type: Number,
      min: 1,
      default: 60,
      required: true,
    },
    disappearanceFrameThreshold: {
      type: Number,
      min: 1,
      default: 5,
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
    monitoredObjectClasses: {
      type: [String],
      default: [],
    },
    objectInteractionDistanceThreshold: {
      type: Number,
      min: 0.01,
      default: 0.1,
      required: true,
    },
    objectDisappearanceFrameThreshold: {
      type: Number,
      min: 1,
      default: 10,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
