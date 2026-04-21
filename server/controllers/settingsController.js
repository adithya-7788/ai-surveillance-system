const Settings = require('../models/Settings');

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const normalizeMonitoredObjectClasses = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const toSettingsResponse = (settings) => ({
  crowdThreshold: settings.crowdThreshold,
  loiteringTimeThreshold: settings.loiteringTimeThreshold ?? settings.loiteringTime ?? 60,
  loiteringTime: settings.loiteringTimeThreshold ?? settings.loiteringTime ?? 60,
  disappearanceFrameThreshold: settings.disappearanceFrameThreshold ?? 5,
  restrictedStartTime: settings.restrictedStartTime,
  restrictedEndTime: settings.restrictedEndTime,
  monitoredObjectClasses: settings.monitoredObjectClasses,
});

const getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.findOne({ userId: req.user._id });

    if (!settings) {
      return res.status(200).json({
        crowdThreshold: 10,
        loiteringTimeThreshold: 60,
        loiteringTime: 60,
        disappearanceFrameThreshold: 5,
        restrictedStartTime: '00:00',
        restrictedEndTime: '00:00',
        monitoredObjectClasses: [],
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
      crowdThreshold,
      loiteringTimeThreshold,
      loiteringTime,
      disappearanceFrameThreshold,
      restrictedStartTime = '00:00',
      restrictedEndTime = '00:00',
      monitoredObjectClasses = [],
    } = req.body || {};

    const normalizedLoiteringTime = Number.isInteger(loiteringTimeThreshold)
      ? loiteringTimeThreshold
      : loiteringTime;

    if (!Number.isInteger(crowdThreshold) || crowdThreshold < 1) {
      return res.status(400).json({ message: 'crowdThreshold must be a positive integer.' });
    }

    if (!Number.isInteger(normalizedLoiteringTime) || normalizedLoiteringTime < 1) {
      return res.status(400).json({ message: 'loiteringTimeThreshold must be a positive integer in seconds.' });
    }

    if (!Number.isInteger(disappearanceFrameThreshold) || disappearanceFrameThreshold < 1) {
      return res.status(400).json({ message: 'disappearanceFrameThreshold must be a positive integer.' });
    }

    if (!TIME_REGEX.test(restrictedStartTime) || !TIME_REGEX.test(restrictedEndTime)) {
      return res.status(400).json({ message: 'Restricted entry time must use HH:MM format.' });
    }

    const normalizedObjectClasses = normalizeMonitoredObjectClasses(monitoredObjectClasses);

    const updatedSettings = await Settings.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        crowdThreshold,
        loiteringTimeThreshold: normalizedLoiteringTime,
        disappearanceFrameThreshold,
        restrictedStartTime,
        restrictedEndTime,
        monitoredObjectClasses: normalizedObjectClasses,
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
