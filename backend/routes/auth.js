const router = require('express').Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const c = require('../controllers/authController');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  skip: () => process.env.NODE_ENV === 'test',
  message: { message: 'Too many attempts. Try again in a few minutes.' },
});

router.post(
  '/register',
  limiter,
  [
    body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
    body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  c.register
);
router.post(
  '/login',
  limiter,
  [body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(), body('password').notEmpty().withMessage('Password is required')],
  validate,
  c.login
);
router.post('/logout', protect, c.logout);
router.get('/me', protect, c.me);

module.exports = router;
