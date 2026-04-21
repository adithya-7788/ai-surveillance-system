const User = require('../models/User');

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      id: user._id,
      email: user.email,
      phoneNumber: user.phoneNumber,
    });
  } catch (error) {
    return next(error);
  }
};

const updatePhoneNumber = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;

    if (typeof phoneNumber !== 'string') {
      return res.status(400).json({ message: 'phoneNumber must be a string' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { phoneNumber: phoneNumber.trim() },
      { new: true, runValidators: true }
    ).select('-password');

    return res.status(200).json({
      message: 'Phone number updated successfully',
      user: {
        id: user._id,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getProfile,
  updatePhoneNumber,
};
