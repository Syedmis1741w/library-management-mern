const router = require('express').Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const c = require('../controllers/bookController');

const year = new Date().getFullYear();
const rules = (isUpdate) => {
  const opt = (chain) => (isUpdate ? chain.optional() : chain);
  return [
    opt(body('title').trim().notEmpty().withMessage('Title is required')).isLength({ max: 150 }).withMessage('Title is too long'),
    opt(body('author').trim().notEmpty().withMessage('Author is required')),
    opt(body('isbn').trim().notEmpty().withMessage('ISBN is required')).matches(/^[0-9Xx-]{10,17}$/).withMessage('ISBN must be 10-13 digits (hyphens allowed)'),
    opt(body('category').trim().notEmpty().withMessage('Category is required')),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description max 1000 characters'),
    body('publishedYear').optional({ values: 'falsy' }).isInt({ min: 1000, max: year }).withMessage(`Year must be between 1000 and ${year}`),
    opt(body('copies').isInt({ min: 1, max: 1000 }).withMessage('Copies must be between 1 and 1000')).toInt(),
  ];
};

router.use(protect);
router.get('/', c.list);
router.get('/categories', c.categories);
router.get('/:id', c.get);
router.post('/', authorize('admin'), upload.single('cover'), rules(false), validate, c.create);
router.put('/:id', authorize('admin'), upload.single('cover'), rules(true), validate, c.update);
router.delete('/:id', authorize('admin'), c.remove);

module.exports = router;
