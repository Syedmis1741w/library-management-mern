const User = require('../models/User');
const Borrow = require('../models/Borrow');
const upload = require('../middleware/upload');

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  const { name, phone, address } = req.body;
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;
  if (req.file) {
    upload.remove(user.avatar);
    user.avatar = `/uploads/${req.file.filename}`;
  }
  await user.save();
  res.json({ user });
};

exports.changePassword = async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(req.body.currentPassword)))
    return res.status(400).json({ message: 'Current password is incorrect' });
  user.password = req.body.newPassword;
  await user.save();
  res.json({ message: 'Password updated' });
};

// ---------- admin ----------
exports.listUsers = async (req, res) => {
  const { q, role, sort = '-createdAt', page = 1, limit = 10 } = req.query;
  const filter = {};
  if (q) filter.$or = [{ name: new RegExp(esc(q), 'i') }, { email: new RegExp(esc(q), 'i') }];
  if (['user', 'admin'].includes(role)) filter.role = role;
  const field = sort.replace('-', '');
  const sortObj = ['name', 'email', 'createdAt'].includes(field)
    ? { [field]: sort.startsWith('-') ? -1 : 1 }
    : { createdAt: -1 };
  const p = Math.max(1, +page || 1);
  const l = Math.min(50, Math.max(1, +limit || 10));
  const [data, total] = await Promise.all([
    User.find(filter).sort(sortObj).skip((p - 1) * l).limit(l),
    User.countDocuments(filter),
  ]);
  res.json({ data, page: p, pages: Math.ceil(total / l), total });
};

exports.updateRole = async (req, res) => {
  if (req.params.id === String(req.user._id))
    return res.status(400).json({ message: 'You cannot change your own role' });
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
};

exports.deleteUser = async (req, res) => {
  if (req.params.id === String(req.user._id))
    return res.status(400).json({ message: 'You cannot delete your own account' });
  if (await Borrow.exists({ user: req.params.id, status: 'borrowed' }))
    return res.status(400).json({ message: 'This member still has books on loan' });
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  upload.remove(user.avatar);
  res.json({ message: 'User deleted' });
};
