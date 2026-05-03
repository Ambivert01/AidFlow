import multer from "multer";
import { ApiError } from "../core/apiResponse.js";

// Allowed MIME types for proof files
const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  // Videos
  "video/mp4",
  "video/mov",
  "video/quicktime",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// File type mapping
const FILE_TYPE_MAP = {
  "image/jpeg": "IMAGE",
  "image/jpg": "IMAGE",
  "image/png": "IMAGE",
  "image/webp": "IMAGE",
  "video/mp4": "VIDEO",
  "video/mov": "VIDEO",
  "video/quicktime": "VIDEO",
  "application/pdf": "PDF",
  "application/msword": "DOCUMENT",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCUMENT",
};

// Max file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Max files per upload
const MAX_FILES = 5;

/**
 * Multer storage configuration - use memory storage for processing
 */
const storage = multer.memoryStorage();

/**
 * File filter function to validate file types
 */
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        "Invalid file type. Allowed types: IMAGE, VIDEO, PDF, DOCUMENT",
      ),
      false,
    );
  }
};

/**
 * Multer configuration
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
});

/**
 * Middleware for proof file upload (multiple files)
 */
export const proofUploadMiddleware = upload.array("files", MAX_FILES);

/**
 * Error handler for multer errors
 */
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "File size exceeds maximum allowed size of 50MB",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: `Maximum ${MAX_FILES} files allowed per upload`,
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected field in file upload",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  next(err);
};

/**
 * Get file type from MIME type
 */
export const getFileType = (mimeType) => {
  return FILE_TYPE_MAP[mimeType] || "DOCUMENT";
};

/**
 * Validate file type
 */
export const isValidFileType = (mimeType) => {
  return ALLOWED_MIME_TYPES.includes(mimeType);
};

/**
 * Validate file size
 */
export const isValidFileSize = (size) => {
  return size <= MAX_FILE_SIZE;
};

export { ALLOWED_MIME_TYPES, FILE_TYPE_MAP, MAX_FILE_SIZE, MAX_FILES };
