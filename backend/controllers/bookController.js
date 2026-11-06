const Book = require('../models/Book');
const Borrow = require('../models/Borrow');
const upload = require('../middleware/upload');

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.list = async (req, res) => {
  const { q, category, available, sort = '-createdAt', page = 1, limit = 8 } = req.query;
  const filter = {};
  if (q) {
    const r = new RegExp(esc(q), 'i');
    filter.$or = [{ title: r }, { author: r }, { isbn: r }];
  }
  if (category) filter.category = category;
  if (available === 'true') filter.available = { $gt: 0 };

  const allowed = ['title', 'author', 'createdAt', 'publishedYear', 'available'];
  const field = sort.replace('-', '');
  const sortObj = allowed.includes(field) ? { [field]: sort.startsWith('-') ? -1 : 1 } : { createdAt: -1 };

  const p = Math.max(1, +page || 1);
  const l = Math.min(50, Math.max(1, +limit || 8));
  const [data, total] = await Promise.all([
    Book.find(filter).sort(sortObj).skip((p - 1) * l).limit(l),
    Book.countDocuments(filter),
  ]);
  res.json({ data, page: p, pages: Math.ceil(total / l), total });
};

exports.categories = async (req, res) => res.json((await Book.distinct('category')).sort());

exports.get = async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ message: 'Book not found' });
  res.json({ book });
};

exports.create = async (req, res) => {
  const body = { ...req.body, available: req.body.copies };
  if (req.file) body.cover = `/uploads/${req.file.filename}`;
  try {
    const book = await Book.create(body);
    res.status(201).json({ book });
  } catch (err) {
    if (req.file) upload.remove(body.cover);
    throw err;
  }
};

exports.update = async (req, res) => {
  const discard = () => req.file && upload.remove(`/uploads/${req.file.filename}`);
  const book = await Book.findById(req.params.id);
  if (!book) {
    discard();
    return res.status(404).json({ message: 'Book not found' });
  }
  const onLoan = book.copies - book.available;
  const copies = req.body.copies !== undefined ? Number(req.body.copies) : book.copies;
  if (copies < onLoan) {
    discard();
    return res.status(400).json({ message: `Copies cannot be fewer than the ${onLoan} currently on loan` });
  }
  ['title', 'author', 'isbn', 'category', 'description', 'publishedYear'].forEach((k) => {
    if (req.body[k] !== undefined) book[k] = req.body[k];
  });
  book.copies = copies;
  book.available = copies - onLoan;
  const oldCover = book.cover;
  if (req.file) book.cover = `/uploads/${req.file.filename}`;
  try {
    await book.save();
  } catch (err) {
    discard();
    throw err;
  }
  if (req.file) upload.remove(oldCover);
  res.json({ book });
};

exports.remove = async (req, res) => {
  if (await Borrow.exists({ book: req.params.id, status: 'borrowed' }))
    return res.status(400).json({ message: 'Cannot delete a book that is currently on loan' });
  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) return res.status(404).json({ message: 'Book not found' });
  upload.remove(book.cover);
  res.json({ message: 'Book deleted' });
};
