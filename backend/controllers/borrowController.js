const Book = require('../models/Book');
const User = require('../models/User');
const Borrow = require('../models/Borrow');

const MAX_ACTIVE = 5;
const populate = [
  { path: 'user', select: 'name email' },
  { path: 'book', select: 'title author cover isbn' },
];

exports.borrow = async (req, res) => {
  const { bookId } = req.body;
  if (await Borrow.exists({ user: req.user._id, book: bookId, status: 'borrowed' }))
    return res.status(400).json({ message: 'You already have this book on loan' });
  if ((await Borrow.countDocuments({ user: req.user._id, status: 'borrowed' })) >= MAX_ACTIVE)
    return res.status(400).json({ message: `You can borrow at most ${MAX_ACTIVE} books at a time` });

  // atomic decrement: two members can never take the last copy
  const book = await Book.findOneAndUpdate(
    { _id: bookId, available: { $gt: 0 } },
    { $inc: { available: -1 } },
    { new: true }
  );
  if (!book) {
    const exists = await Book.exists({ _id: bookId });
    return res.status(exists ? 400 : 404).json({ message: exists ? 'No copies available right now' : 'Book not found' });
  }
  const dueDate = new Date(Date.now() + Number(process.env.LOAN_DAYS || 14) * 86400000);
  const borrow = await Borrow.create({ user: req.user._id, book: book._id, dueDate });
  res.status(201).json({ borrow: await borrow.populate(populate) });
};

exports.list = async (req, res) => {
  const { status, sort = '-borrowedAt', page = 1, limit = 10 } = req.query;
  const filter = req.user.role === 'admin' ? {} : { user: req.user._id };
  if (status === 'borrowed' || status === 'returned') filter.status = status;
  if (status === 'overdue') Object.assign(filter, { status: 'borrowed', dueDate: { $lt: new Date() } });

  const field = sort.replace('-', '');
  const sortObj = ['borrowedAt', 'dueDate'].includes(field)
    ? { [field]: sort.startsWith('-') ? -1 : 1 }
    : { borrowedAt: -1 };
  const p = Math.max(1, +page || 1);
  const l = Math.min(50, Math.max(1, +limit || 10));
  const [data, total] = await Promise.all([
    Borrow.find(filter).sort(sortObj).skip((p - 1) * l).limit(l).populate(populate),
    Borrow.countDocuments(filter),
  ]);
  res.json({ data, page: p, pages: Math.ceil(total / l), total });
};

exports.returnBook = async (req, res) => {
  const borrow = await Borrow.findById(req.params.id);
  if (!borrow) return res.status(404).json({ message: 'Loan not found' });
  if (req.user.role !== 'admin' && String(borrow.user) !== String(req.user._id))
    return res.status(403).json({ message: 'This loan belongs to another member' });
  if (borrow.status === 'returned') return res.status(400).json({ message: 'Book already returned' });

  borrow.status = 'returned';
  borrow.returnedAt = new Date();
  borrow.fine = Borrow.fineFor(borrow.dueDate, borrow.returnedAt);
  await borrow.save();
  await Book.findByIdAndUpdate(borrow.book, { $inc: { available: 1 } });
  res.json({ borrow: await borrow.populate(populate) });
};

exports.stats = async (req, res) => {
  const scope = req.user.role === 'admin' ? {} : { user: req.user._id };
  const [active, overdue, total, recent] = await Promise.all([
    Borrow.countDocuments({ ...scope, status: 'borrowed' }),
    Borrow.countDocuments({ ...scope, status: 'borrowed', dueDate: { $lt: new Date() } }),
    Borrow.countDocuments(scope),
    Borrow.find(scope).sort('-borrowedAt').limit(5).populate(populate),
  ]);
  const out = { active, overdue, total, recent };
  if (req.user.role === 'admin') {
    out.books = await Book.countDocuments();
    out.members = await User.countDocuments({ role: 'user' });
  }
  res.json(out);
};
