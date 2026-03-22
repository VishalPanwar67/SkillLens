import multer from "multer";
import { ApiError } from "../class/index.class.js";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Only PDF files are allowed"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/** Prefer common form keys; avoids MulterError "Unexpected field" when the client does not use `resume`. */
const RESUME_FIELD_NAMES = ["resume", "file", "pdf", "document", "attachment"];

export const acceptResumeUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) return next(err);
    const files = req.files || [];
    const byName = (name) => files.find((f) => f.fieldname === name);
    const file =
      RESUME_FIELD_NAMES.map(byName).find(Boolean) ||
      files.find((f) => f.mimetype === "application/pdf") ||
      files[0];
    req.file = file;
    next();
  });
};
