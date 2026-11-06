const router = require('express').Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const c = require('../controllers/borrowController');

router.use(protect);
router.get('/stats', c.stats);
router.get('/', c.list);
router.post('/', [body('bookId').isMongoId().withMessage('A valid bookId is required')], validate, c.borrow);
router.patch('/:id/return', c.returnBook);

module.exports = router;
