const multer = require('multer');
const path = require('path');

// Cấu hình storage cho multer - lưu vào memory để xử lý trực tiếp
const storage = multer.memoryStorage();

// Filter cho phép ảnh và một số loại file tài liệu phổ biến
const fileFilter = (req, file, cb) => {
  // allowed extensions: images + pdf/docx/xlsx/txt
  const allowedExts = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|txt/;
  const allowedMimes = /image\//; // treat images by mime, and allow some document mimetypes explicitly
  const extname = allowedExts.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimes.test(file.mimetype) || /pdf|msword|officedocument/.test(file.mimetype) || file.mimetype === 'text/plain';

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload các file: ảnh (jpeg, jpg, png, gif, webp) và tài liệu (pdf, docx, xlsx, txt)'));
  }
};

// Cấu hình multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter
});

module.exports = upload;

