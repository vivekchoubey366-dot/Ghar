"use strict";

const path = require("path");

const DEFAULT_ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "video/mp4"
]);

const BLOCKED_EXTENSIONS = new Set([
  ".exe", ".dll", ".bat", ".cmd", ".com", ".scr",
  ".sh", ".ps1", ".msi", ".php", ".jsp", ".asp", ".aspx"
]);

function flattenFiles(files) {
  if (!files) return [];
  if (Array.isArray(files)) return files;
  return Object.values(files).flat();
}

function validateUploadedFiles(options = {}) {
  const allowedMimeTypes = new Set(
    options.allowedMimeTypes || DEFAULT_ALLOWED_MIME_TYPES
  );
  const maxSize = Number(options.maxSize) || 10 * 1024 * 1024;
  const maxFiles = Number(options.maxFiles) || 20;

  return (req, res, next) => {
    const files = flattenFiles(req.files);
    if (req.file) files.push(req.file);

    if (files.length > maxFiles) {
      return res.status(413).json({
        success: false,
        error: {
          code: "TOO_MANY_FILES",
          message: "Too many files were uploaded.",
          requestId: req.requestId || null
        }
      });
    }

    for (const file of files) {
      const extension = path.extname(file.originalname || "").toLowerCase();

      if (BLOCKED_EXTENSIONS.has(extension)) {
        return res.status(415).json({
          success: false,
          error: {
            code: "BLOCKED_FILE_TYPE",
            message: "This file type is not allowed.",
            requestId: req.requestId || null
          }
        });
      }

      if (file.mimetype && !allowedMimeTypes.has(file.mimetype)) {
        return res.status(415).json({
          success: false,
          error: {
            code: "UNSUPPORTED_FILE_TYPE",
            message: "This file type is not supported.",
            requestId: req.requestId || null
          }
        });
      }

      if (Number.isFinite(file.size) && file.size > maxSize) {
        return res.status(413).json({
          success: false,
          error: {
            code: "FILE_TOO_LARGE",
            message: "The uploaded file is too large.",
            requestId: req.requestId || null
          }
        });
      }
    }

    next();
  };
}

module.exports = {
  validateUploadedFiles,
  DEFAULT_ALLOWED_MIME_TYPES,
  BLOCKED_EXTENSIONS
};
