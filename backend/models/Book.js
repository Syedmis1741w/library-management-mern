const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    author: { type: String, required: true, trim: true, maxlength: 100 },
    isbn: { type: String, required: true, unique: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    publishedYear: { type: Number, min: 1000, max: new Date().getFullYear() },
    copies: { type: Number, required: true, min: 1, default: 1 },
    available: { type: Number, required: true, min: 0 },
    cover: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Book', bookSchema);
