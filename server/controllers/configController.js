const Config = require('../models/Config');

const isNumberInRange = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;

const validateEntryLine = (entryLine) => {
  if (entryLine === null) return true;
  if (!entryLine || typeof entryLine !== 'object') return false;

  const { x1, y1, x2, y2 } = entryLine;
  return [x1, y1, x2, y2].every(isNumberInRange);
};

const validateInsideDirection = (insideDirection) => {
  return insideDirection === null || insideDirection === 'positive' || insideDirection === 'negative';
};

const validateRestrictedZones = (restrictedZones) => {
  if (!Array.isArray(restrictedZones)) return false;

  return restrictedZones.every((zone) => {
    if (!zone || typeof zone !== 'object') return false;

    const { x, y, width, height } = zone;

    if (![x, y, width, height].every(isNumberInRange)) {
      return false;
    }

    if (width <= 0 || height <= 0) {
      return false;
    }

    if (x + width > 1 || y + height > 1) {
      return false;
    }

    return true;
  });
};

const getConfig = async (req, res, next) => {
  try {
    const config = await Config.findOne({ userId: req.user._id });

    if (!config) {
      return res.status(200).json({
        entryLine: null,
        insideDirection: null,
        restrictedZones: [],
      });
    }

    return res.status(200).json({
      entryLine: config.entryLine,
      insideDirection: config.insideDirection,
      restrictedZones: config.restrictedZones,
    });
  } catch (error) {
    return next(error);
  }
};

const upsertConfig = async (req, res, next) => {
  try {
    const { entryLine = null, insideDirection = null, restrictedZones = [] } = req.body || {};

    if (!validateEntryLine(entryLine)) {
      return res.status(400).json({ message: 'Invalid entryLine format. Values must be numbers between 0 and 1.' });
    }

    if (!validateInsideDirection(insideDirection)) {
      return res.status(400).json({ message: 'insideDirection must be positive, negative, or null.' });
    }

    if (!validateRestrictedZones(restrictedZones)) {
      return res.status(400).json({
        message:
          'Invalid restrictedZones format. Every zone must have x, y, width, height between 0 and 1, with positive size and bounds inside the canvas.',
      });
    }

    const updatedConfig = await Config.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        entryLine,
        insideDirection,
        restrictedZones,
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      message: 'Configuration saved successfully',
      config: {
        entryLine: updatedConfig.entryLine,
        insideDirection: updatedConfig.insideDirection,
        restrictedZones: updatedConfig.restrictedZones,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getConfig,
  upsertConfig,
};
