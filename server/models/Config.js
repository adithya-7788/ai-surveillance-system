const mongoose = require('mongoose');

const entryLineSchema = new mongoose.Schema(
  {
    x1: { type: Number, min: 0, max: 1, required: true },
    y1: { type: Number, min: 0, max: 1, required: true },
    x2: { type: Number, min: 0, max: 1, required: true },
    y2: { type: Number, min: 0, max: 1, required: true },
  },
  { _id: false }
);

const restrictedZoneSchema = new mongoose.Schema(
  {
    x: { type: Number, min: 0, max: 1, required: true },
    y: { type: Number, min: 0, max: 1, required: true },
    width: { type: Number, min: 0, max: 1, required: true },
    height: { type: Number, min: 0, max: 1, required: true },
  },
  { _id: false }
);

const maskSchema = new mongoose.Schema(
  {
    width: { type: Number, min: 16, max: 512, required: true },
    height: { type: Number, min: 16, max: 512, required: true },
    data: { type: String, required: true },
  },
  { _id: false }
);

const configSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    entryLine: {
      type: entryLineSchema,
      default: null,
    },
    insideDirection: {
      type: String,
      enum: ['positive', 'negative'],
      default: null,
    },
    restrictedZones: {
      type: [restrictedZoneSchema],
      default: [],
    },
    zoneMask: {
      type: maskSchema,
      default: null,
    },
    insideMask: {
      type: maskSchema,
      default: null,
    },
    roiMask: {
      type: maskSchema,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Config', configSchema);
