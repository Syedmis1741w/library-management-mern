const { validationResult } = require('express-validator');
const upload = require('./upload');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  if (req.file) upload.remove(`/uploads/${req.file.filename}`); // drop files from rejected requests
  res.status(400).json({
    message: errors.array()[0].msg,
    errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
  });
};
