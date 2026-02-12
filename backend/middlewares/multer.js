import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = function (req, file, callback) {
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    callback(null, true);
  } else {
    callback(new Error('Only images and PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export default upload;