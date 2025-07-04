const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `students-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv') cb(null, true);
  else cb(new Error('Only CSV files are allowed'), false);
};

const upload = multer({ storage, fileFilter });

module.exports = upload;