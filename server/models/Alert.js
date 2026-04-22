const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    alertKey: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['entry', 'exit', 'loitering', 'crowd', 'restricted_time', 'suspicious_activity', 'suspicious'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'resolved'],
      default: 'active',
      index: true,
    },
    personId: {
      type: Number,
      default: null,
    },
    objectType: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

alertSchema.index({ userId: 1, alertKey: 1 }, { unique: true });
alertSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
