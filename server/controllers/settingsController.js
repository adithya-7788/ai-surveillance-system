const Settings = require('../models/Settings');

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const toSettingsResponse = (settings) => ({
  suspiciousInteractionTimeThreshold: settings.suspiciousInteractionTimeThreshold ?? 20,
  crowdThreshold: settings.crowdThreshold ?? 10,
  loiteringThreshold: settings.loiteringThreshold ?? 60,
  restrictedStartTime: settings.restrictedStartTime,
  restrictedEndTime: settings.restrictedEndTime,
});

const getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.findOne({ userId: req.user._id });

    if (!settings) {
      return res.status(200).json({
        suspiciousInteractionTimeThreshold: 20,
        crowdThreshold: 10,
        loiteringThreshold: 60,
        restrictedStartTime: '00:00',
        restrictedEndTime: '00:00',
      });
    }

    return res.status(200).json(toSettingsResponse(settings));
  } catch (error) {
    return next(error);
  }
};

const upsertSettings = async (req, res, next) => {
  try {
    const {
      suspiciousInteractionTimeThreshold = 20,
      crowdThreshold = 10,
      loiteringThreshold = 60,
      restrictedStartTime = '00:00',
      restrictedEndTime = '00:00',
    } = req.body || {};

    if (!Number.isInteger(suspiciousInteractionTimeThreshold) || suspiciousInteractionTimeThreshold < 1) {
      return res
        .status(400)
        .json({ message: 'suspiciousInteractionTimeThreshold must be a positive integer in seconds.' });
    }

    if (!Number.isInteger(crowdThreshold) || crowdThreshold < 1) {
      return res.status(400).json({ message: 'crowdThreshold must be a positive integer.' });
    }

    if (!Number.isInteger(loiteringThreshold) || loiteringThreshold < 1) {
      return res.status(400).json({ message: 'loiteringThreshold must be a positive integer in seconds.' });
    }

    if (!TIME_REGEX.test(restrictedStartTime) || !TIME_REGEX.test(restrictedEndTime)) {
      return res.status(400).json({ message: 'Restricted entry time must use HH:MM format.' });
    }

    const updatedSettings = await Settings.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        suspiciousInteractionTimeThreshold,
        crowdThreshold,
        loiteringThreshold,
        restrictedStartTime,
        restrictedEndTime,
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      message: 'Settings saved successfully',
      settings: toSettingsResponse(updatedSettings),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getSettings, upsertSettings };
