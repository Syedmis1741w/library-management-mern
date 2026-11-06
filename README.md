# Stacks – Library Management System (MERN)

A full-stack library management web app built with **MongoDB, Express.js, React and Node.js**.
Members browse and borrow books; admins manage the catalogue, members and all loans.

> Term Work 3 – Advanced Full Stack Web Application (Option 5: Library Management System)

## Features

| Requirement | Where it lives |
|---|---|
| Home / Dashboard | `Home.jsx` – landing page for visitors, stats + recent loans for logged-in users (admin sees library-wide numbers) |
| Register, login, logout | `Register.jsx`, `Login.jsx`, `/api/auth/*` (JWT, bcrypt-hashed passwords) |
| Profile management | `Profile.jsx` – edit name/phone/address, upload photo, change password |
| Role-based auth | `user` and `admin` roles; `protect` + `authorize` middleware on the API, `ProtectedRoute` on the UI |
| Search, filter, sort, pagination | Books (title/author/ISBN search, category, availability, sort), Loans (status, sort), Members (search, role, sort) |
| Advanced CRUD | Books: add / edit / delete with stock rules. Members: change role / delete. Loans: borrow / return with fines |
| MongoDB integration | Mongoose models: `User`, `Book`, `Borrow` |
| REST API | Node + Express, controllers/routes separated |
| Image upload | Book covers and profile photos (Multer; JPG/PNG/WEBP, max 2 MB) |
| Validation + error handling | express-validator on the server, matching client-side checks, central error handler, toast messages |
| Responsive UI | Bootstrap 5 + a small custom theme |

Business rules: a member can hold up to 5 books, cannot borrow the same title twice, loans last 14 days, and late returns are fined ₹5 per day (all configurable in `.env`). Stock changes use an atomic update so two people cannot take the last copy. A book on loan cannot be deleted, and copies cannot be set below the number currently on loan.

## Tech stack
- **Frontend:** React 18, Vite, React Router 6, Axios, Bootstrap 5, React-Toastify
- **Backend:** Node.js, Express 4, Mongoose 8, JWT, bcryptjs, Multer, express-validator, Helmet, CORS, express-rate-limit
- **Database:** MongoDB (local or Atlas)
- **Tests:** Jest, Supertest, mongodb-memory-server

## Project structure
```
library-mern/
├── backend/
│   ├── config/db.js
│   ├── controllers/   auth, user, book, borrow
│   ├── middleware/    auth, upload, validate, error
│   ├── models/        User, Book, Borrow
│   ├── routes/        auth, users, books, borrows
│   ├── tests/api.test.js
│   ├── app.js  server.js  seed.js
│   └── .env.example
└── frontend/
    ├── src/ components/  context/  pages/  api.js  App.jsx  main.jsx
    └── .env.example
```

## Installation

**Prerequisites:** Node.js 18+, and MongoDB running locally or a free MongoDB Atlas connection string.

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env          # then edit MONGO_URI and JWT_SECRET
npm run seed                  # creates demo users and 12 books
npm run dev                   # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:5000
npm run dev                   # http://localhost:5173
```

**Demo logins (after `npm run seed`)**

| Role | Email | Password |
|---|---|---|
| Admin | admin@library.com | Admin@123 |
| Member | user@library.com | User@123 |

Change these before any real deployment. Public registration always creates a `member`; admins are made by the seed script or by another admin on the Members page.

### Environment variables

`backend/.env`

| Name | Purpose |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string used to sign tokens |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `CLIENT_URL` | Allowed frontend origin(s) for CORS, comma separated |
| `FINE_PER_DAY`, `LOAN_DAYS` | Library rules |

`frontend/.env`: `VITE_API_URL` – the backend's base URL (no `/api`).

## API reference

All routes except register/login need `Authorization: Bearer <token>`. Errors return `{ "message": "..." }` with a suitable status code (400 validation, 401 not logged in, 403 forbidden, 404, 409 duplicate).

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create a member account |
| POST | `/api/auth/login` | Public | Returns `{ token, user }` |
| POST | `/api/auth/logout` | Auth | Logout (client discards token) |
| GET | `/api/auth/me` | Auth | Current user |
| PUT | `/api/users/profile` | Auth | Update profile (multipart, optional `avatar`) |
| PUT | `/api/users/password` | Auth | Change password |
| GET | `/api/users?q=&role=&sort=&page=&limit=` | Admin | List members |
| PATCH | `/api/users/:id/role` | Admin | Set role `user` / `admin` |
| DELETE | `/api/users/:id` | Admin | Delete member |
| GET | `/api/books?q=&category=&available=&sort=&page=&limit=` | Auth | Search / filter / sort / paginate |
| GET | `/api/books/categories` | Auth | Distinct categories |
| GET | `/api/books/:id` | Auth | One book |
| POST | `/api/books` | Admin | Add book (multipart, optional `cover`) |
| PUT | `/api/books/:id` | Admin | Edit book |
| DELETE | `/api/books/:id` | Admin | Delete book |
| POST | `/api/borrows` | Auth | Borrow `{ bookId }` |
| GET | `/api/borrows?status=&sort=&page=` | Auth | Own loans (admin: all loans) |
| PATCH | `/api/borrows/:id/return` | Auth | Return a book (owner or admin) |
| GET | `/api/borrows/stats` | Auth | Dashboard numbers |

List endpoints respond with `{ data, page, pages, total }`.

## Testing

```bash
cd backend
npm test
```
Runs 19 API tests (auth, validation, role checks, book CRUD with search/pagination, borrow/return, profile) against an in-memory MongoDB. The first run downloads a MongoDB binary, so it needs internet access.

## Deployment

**Backend on Render or Railway**
1. Push the repo to GitHub, create a Web Service with root directory `backend`.
2. Build command `npm install`, start command `npm start`.
3. Set the environment variables above (use a MongoDB Atlas URI; set `CLIENT_URL` to your frontend URL).

**Frontend on Vercel or Netlify**
1. Root directory `frontend`, build command `npm run build`, output `dist`.
2. Set `VITE_API_URL` to the deployed backend URL.
3. SPA fallbacks are included (`vercel.json`, `public/_redirects`).

> Render's free disk is ephemeral, so uploaded images disappear on redeploy. For permanent storage, swap Multer's disk storage for Cloudinary or S3 (only `middleware/upload.js` and the two places that build `/uploads/...` URLs change). Run `npm run seed` once against the production database to create the first admin, then change its password.

## Screenshots

Add your own screenshots to a `screenshots/` folder and link them here after running the app:

| Page | Screenshot |
|---|---|
| Dashboard | `![Dashboard](screenshots/dashboard.png)` |
| Books (search, filters, pagination) | `![Books](screenshots/books.png)` |
| Add / edit book (admin) | `![Book form](screenshots/book-form.png)` |
| Loans | `![Loans](screenshots/loans.png)` |
| Members (admin) | `![Members](screenshots/members.png)` |
| Profile | `![Profile](screenshots/profile.png)` |

## Author
Your name · Roll no. · Course
