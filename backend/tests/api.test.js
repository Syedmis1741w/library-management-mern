const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';
const app = require('../app');
const User = require('../models/User');

let mongo, adminToken, userToken, bookId, borrowId;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await User.create({ name: 'Admin', email: 'admin@test.com', password: 'secret123', role: 'admin' });
  adminToken = (await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'secret123' })).body.token;
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

const auth = (t) => ({ Authorization: `Bearer ${t}` });

describe('Auth', () => {
  it('registers a user and ignores a role in the body', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Riya', email: 'riya@test.com', password: 'secret123', role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('user');
    expect(res.body.user.password).toBeUndefined();
    userToken = res.body.token;
  });
  it('rejects invalid registration', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'R', email: 'bad', password: '1' });
    expect(res.status).toBe(400);
  });
  it('rejects a duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Riya', email: 'riya@test.com', password: 'secret123' });
    expect(res.status).toBe(409);
  });
  it('rejects a wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'riya@test.com', password: 'nope123' });
    expect(res.status).toBe(401);
  });
  it('blocks requests without a token', async () => {
    expect((await request(app).get('/api/books')).status).toBe(401);
  });
});

describe('Role-based access', () => {
  it('forbids members from creating books', async () => {
    const res = await request(app).post('/api/books').set(auth(userToken)).send({});
    expect(res.status).toBe(403);
  });
  it('forbids members from listing users', async () => {
    expect((await request(app).get('/api/users').set(auth(userToken))).status).toBe(403);
  });
});

describe('Books CRUD', () => {
  it('validates book input', async () => {
    const res = await request(app).post('/api/books').set(auth(adminToken)).send({ title: 'X' });
    expect(res.status).toBe(400);
  });
  it('creates a book', async () => {
    const res = await request(app).post('/api/books').set(auth(adminToken))
      .field('title', 'Clean Code').field('author', 'Robert Martin').field('isbn', '9780132350884')
      .field('category', 'Technology').field('copies', 1);
    expect(res.status).toBe(201);
    expect(res.body.book.available).toBe(1);
    bookId = res.body.book._id;
  });
  it('rejects a duplicate ISBN', async () => {
    const res = await request(app).post('/api/books').set(auth(adminToken))
      .field('title', 'Copy').field('author', 'A').field('isbn', '9780132350884').field('category', 'Technology').field('copies', 1);
    expect(res.status).toBe(409);
  });
  it('searches, filters, sorts and paginates', async () => {
    const res = await request(app).get('/api/books?q=clean&category=Technology&available=true&sort=title&page=1&limit=5').set(auth(userToken));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.pages).toBe(1);
  });
  it('updates a book', async () => {
    const res = await request(app).put(`/api/books/${bookId}`).set(auth(adminToken)).field('copies', 2);
    expect(res.status).toBe(200);
    expect(res.body.book.available).toBe(2);
  });
});

describe('Borrowing', () => {
  it('lets a member borrow a book', async () => {
    const res = await request(app).post('/api/borrows').set(auth(userToken)).send({ bookId });
    expect(res.status).toBe(201);
    borrowId = res.body.borrow._id;
  });
  it('prevents borrowing the same book twice', async () => {
    expect((await request(app).post('/api/borrows').set(auth(userToken)).send({ bookId })).status).toBe(400);
  });
  it('blocks deleting a book on loan', async () => {
    expect((await request(app).delete(`/api/books/${bookId}`).set(auth(adminToken))).status).toBe(400);
  });
  it('returns the book and restores stock', async () => {
    const res = await request(app).patch(`/api/borrows/${borrowId}/return`).set(auth(userToken));
    expect(res.status).toBe(200);
    expect(res.body.borrow.status).toBe('returned');
    const book = await request(app).get(`/api/books/${bookId}`).set(auth(userToken));
    expect(book.body.book.available).toBe(2);
  });
  it('shows stats', async () => {
    const res = await request(app).get('/api/borrows/stats').set(auth(adminToken));
    expect(res.body.books).toBe(1);
  });
});

describe('Profile', () => {
  it('updates the profile', async () => {
    const res = await request(app).put('/api/users/profile').set(auth(userToken)).field('name', 'Riya S').field('phone', '9876543210');
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Riya S');
  });
  it('rejects a bad phone number', async () => {
    expect((await request(app).put('/api/users/profile').set(auth(userToken)).field('phone', 'abc')).status).toBe(400);
  });
});
