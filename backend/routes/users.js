const router = require('express').Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const c = require('../controllers/userController');

router.use(protect);

router.put(
  '/profile',
  upload.single('avatar'),
  [
    body('name').optional().trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
    body('phone').optional({ values: 'falsy' }).matches(/^[0-9+\-\s]{7,15}$/).withMessage('Enter a valid phone number'),
    body('address').optional().trim().isLength({ max: 200 }).withMessage('Address is too long (max 200)'),
  ],
  validate,
  c.updateProfile
);
router.put(
  '/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  c.changePassword
);

// admin only
router.get('/', authorize('admin'), c.listUsers);
router.patch('/:id/role', authorize('admin'), [body('role').isIn(['user', 'admin']).withMessage('Role must be user or admin')], validate, c.updateRole);
router.delete('/:id', authorize('admin'), c.deleteUser);

module.exports = router;
