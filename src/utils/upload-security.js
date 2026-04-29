const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const MIME_EXTENSIONS = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg'
};

class UploadValidationError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}

function cleanupUploadedFile(file) {
    const filePath = file && (file.filepath || file.path);
    if (!filePath) return;

    try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (error) {
        console.error('Could not remove rejected upload:', error.message);
    }
}

function moveFile(sourcePath, destinationPath) {
    if (path.resolve(sourcePath) === path.resolve(destinationPath)) return;

    try {
        fs.renameSync(sourcePath, destinationPath);
    } catch (error) {
        fs.copyFileSync(sourcePath, destinationPath);
        fs.unlinkSync(sourcePath);
    }
}

function finalizeUploadedImage(file, options) {
    const {
        uploadDir,
        publicDir,
        allowedMimeTypes,
        maxSize,
        filenamePrefix = 'image'
    } = options;

    if (!file) return '';

    const mimetype = String(file.mimetype || file.type || '').toLowerCase();
    const allowed = new Set((allowedMimeTypes || []).map(type => String(type).toLowerCase()));

    if (!allowed.has(mimetype) || !MIME_EXTENSIONS[mimetype]) {
        cleanupUploadedFile(file);
        throw new UploadValidationError('Only image files are allowed');
    }

    if (maxSize && Number(file.size || 0) > maxSize) {
        cleanupUploadedFile(file);
        throw new UploadValidationError('Uploaded image is too large');
    }

    const sourcePath = file.filepath || file.path;
    if (!sourcePath || !fs.existsSync(sourcePath)) {
        throw new UploadValidationError('Uploaded image could not be read');
    }

    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const extension = MIME_EXTENSIONS[mimetype];
    const filename = `${filenamePrefix}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`;
    const destinationPath = path.join(uploadDir, filename);

    moveFile(sourcePath, destinationPath);

    return `${publicDir.replace(/\/$/, '')}/${filename}`;
}

module.exports = {
    UploadValidationError,
    cleanupUploadedFile,
    finalizeUploadedImage
};
