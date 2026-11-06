const jwt = require('jsonwebtoken');
const User = require('../models/User');

const sign = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.findOne({ email })) return res.status(409).json({ message: 'Email is already registered' });
  // role is never read from the request: public sign-ups are always "user"
  const user = await User.create({ name, email, password });
  res.status(201).json({ token: sign(user._id), user: await User.findById(user._id) });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password)))
    return res.status(401).json({ message: 'Invalid email or password' });
  res.json({ token: sign(user._id), user: await User.findById(user._id) });
};

exports.me = (req, res) => res.json({ user: req.user });

// JWTs are stateless; the client discards the token. Endpoint kept for a clean API contract.
exports.logout = (req, res) => res.json({ message: 'Logged out' });
