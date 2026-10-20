const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name, shopName: user.shopName },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// @desc  Register new manager
// @route POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, shopName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'সব তথ্য দিন।' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'এই ইমেইল দিয়ে আগেই রেজিস্ট্রেশন হয়েছে।' });
    }

    const user = await User.create({ name, email, password, shopName });
    const token = generateToken(user);

    res.status(201).json({
      message: 'রেজিস্ট্রেশন সফল!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        shopName: user.shopName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'সার্ভার এরর', error: error.message });
  }
};

// @desc  Login manager
// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'ইমেইল এবং পাসওয়ার্ড দিন।' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'ইউজার পাওয়া যায়নি।' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'পাসওয়ার্ড ভুল।' });
    }

    const token = generateToken(user);

    res.json({
      message: 'লগইন সফল!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        shopName: user.shopName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'সার্ভার এরর', error: error.message });
  }
};

// @desc  Get current logged-in user
// @route GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

module.exports = { register, login, getMe };
