const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'))
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random()*1E9);
    cb(null, unique + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: function (req, file, cb) {
    // accept common file types
    cb(null, true);
  }
});

module.exports = upload;
