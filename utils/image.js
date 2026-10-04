const path = require('path');
const IMAGE_EXTENSIONS = new Set(['.jpg','.jpeg','.png','.webp','.gif']);

function isImage(filename) {
  return IMAGE_EXTENSIONS.has(path.extname(filename || '').toLowerCase());
}

function imageMetadata({ width, height, size, filename } = {}) {
  return {
    filename: filename || null,
    width: Number(width) || null,
    height: Number(height) || null,
    size: Number(size) || null,
    aspectRatio: width && height ? Number((width / height).toFixed(4)) : null
  };
}

module.exports = { isImage, imageMetadata, IMAGE_EXTENSIONS };
