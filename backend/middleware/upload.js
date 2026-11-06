const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const dir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: dir,
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) =>
    /^image\/(jpeg|png|webp)$/.test(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only JPG, PNG or WEBP images are allowed')),
});

// remove a stored file given its public path (/uploads/xyz.png)
upload.remove = (publicPath) => {
  if (!publicPath || !publicPath.startsWith('/uploads/')) return;
  fs.unlink(path.join(dir, path.basename(publicPath)), () => {});
};

module.exports = upload;
