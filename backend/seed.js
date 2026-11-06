require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const Book = require('./models/Book');
const Borrow = require('./models/Borrow');

const books = [
  ['Clean Code', 'Robert C. Martin', '9780132350884', 'Technology', 2008, 4],
  ['The Pragmatic Programmer', 'Andrew Hunt', '9780135957059', 'Technology', 2019, 3],
  ['Introduction to Algorithms', 'Thomas H. Cormen', '9780262046305', 'Technology', 2022, 5],
  ['Sapiens', 'Yuval Noah Harari', '9780062316097', 'History', 2015, 3],
  ['The Discovery of India', 'Jawaharlal Nehru', '9780143031031', 'History', 2004, 2],
  ['Wings of Fire', 'A. P. J. Abdul Kalam', '9788173711466', 'Biography', 1999, 6],
  ['The White Tiger', 'Aravind Adiga', '9781416562603', 'Fiction', 2008, 2],
  ['Midnight\'s Children', 'Salman Rushdie', '9780812976533', 'Fiction', 2006, 2],
  ['A Brief History of Time', 'Stephen Hawking', '9780553380163', 'Science', 1998, 3],
  ['Cosmos', 'Carl Sagan', '9780345539434', 'Science', 2013, 3],
  ['Atomic Habits', 'James Clear', '9780735211292', 'Self-Help', 2018, 4],
  ['Thinking, Fast and Slow', 'Daniel Kahneman', '9780374533557', 'Self-Help', 2011, 2],
].map(([title, author, isbn, category, publishedYear, copies]) => ({
  title, author, isbn, category, publishedYear, copies, available: copies,
  description: `${title} by ${author}.`,
}));

(async () => {
  await connectDB();
  await Promise.all([User.deleteMany(), Book.deleteMany(), Borrow.deleteMany()]);
  await User.create({ name: 'Library Admin', email: 'admin@library.com', password: 'Admin@123', role: 'admin' });
  await User.create({ name: 'Demo Member', email: 'user@library.com', password: 'User@123' });
  await Book.insertMany(books);
  console.log('Seeded. Admin: admin@library.com / Admin@123   Member: user@library.com / User@123');
  process.exit(0);
})();
