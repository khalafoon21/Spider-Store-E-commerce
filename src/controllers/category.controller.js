const CategoryModel = require('../models/category.model');
const { getPostData } = require('../utils/helpers');
const { formidable } = require('formidable');
const fs = require('fs');
const path = require('path');

const MAX_ICON_SIZE = 1 * 1024 * 1024; // 1MB
const ALLOWED_ICON_TYPES = new Set([
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/svg+xml'
]);

const CATEGORY_ICONS_DIR = path.join(process.cwd(), 'uploads', 'categories');
const ERROR_MESSAGES = {
    missingName: 'اسم القسم مطلوب',
    invalidType: 'نوع الأيقونة غير مدعوم. استخدم PNG أو JPG أو WebP أو SVG',
    tooLarge: 'حجم الأيقونة كبير. الحد الأقصى 1MB',
    unreadable: 'تعذر قراءة ملف الأيقونة',
    uploadFailed: 'تعذر رفع الأيقونة'
};

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
}

function ensureCategoryIconsDir() {
    if (!fs.existsSync(CATEGORY_ICONS_DIR)) {
        fs.mkdirSync(CATEGORY_ICONS_DIR, { recursive: true });
    }
}

function isMultipartRequest(req) {
    const contentType = req.headers['content-type'] || '';
    return contentType.toLowerCase().includes('multipart/form-data');
}

function normalizeFieldValue(value) {
    if (Array.isArray(value)) return value[0] || '';
    return value || '';
}

function getUploadedFile(files, fieldName) {
    const file = files[fieldName];

    if (!file) return null;

    return Array.isArray(file) ? file[0] : file;
}

function sanitizeFileExtension(filename, mimetype) {
    const originalExt = path.extname(filename || '').toLowerCase();

    if (originalExt && ['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(originalExt)) {
        return originalExt;
    }

    const map = {
        'image/png': '.png',
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/webp': '.webp',
        'image/svg+xml': '.svg'
    };

    return map[mimetype] || '.png';
}

function cleanupTempFile(file) {
    const filePath = file && (file.filepath || file.path);

    if (!filePath) return;

    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error('Could not remove temporary category icon:', error.message);
    }
}

function createUploadError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function moveUploadedFile(sourcePath, destinationPath) {
    try {
        fs.renameSync(sourcePath, destinationPath);
    } catch (error) {
        fs.copyFileSync(sourcePath, destinationPath);
        fs.unlinkSync(sourcePath);
    }
}

function saveUploadedIcon(file) {
    if (!file) return '';

    const mimetype = String(file.mimetype || file.type || '').toLowerCase();
    const size = Number(file.size || 0);

    if (!ALLOWED_ICON_TYPES.has(mimetype)) {
        cleanupTempFile(file);
        throw createUploadError(ERROR_MESSAGES.invalidType);
    }

    if (size > MAX_ICON_SIZE) {
        cleanupTempFile(file);
        throw createUploadError(ERROR_MESSAGES.tooLarge);
    }

    ensureCategoryIconsDir();

    const ext = sanitizeFileExtension(file.originalFilename || file.name, mimetype);
    const filename = `category-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const destinationPath = path.join(CATEGORY_ICONS_DIR, filename);

    const sourcePath = file.filepath || file.path;

    if (!sourcePath) {
        throw createUploadError(ERROR_MESSAGES.unreadable);
    }

    moveUploadedFile(sourcePath, destinationPath);

    return `/uploads/categories/${filename}`;
}

function parseMultipartCategory(req) {
    ensureCategoryIconsDir();

    const form = formidable({
        multiples: false,
        keepExtensions: true,
        maxFileSize: MAX_ICON_SIZE,
        maxTotalFileSize: MAX_ICON_SIZE,
        uploadDir: CATEGORY_ICONS_DIR,
        filter: part => !part.mimetype || part.name === 'icon_file'
    });

    return new Promise((resolve, reject) => {
        form.parse(req, (error, fields, files) => {
            if (error) {
                const err = new Error(
                    error.code === 1009 || error.code === 1016 || error.httpCode === 413
                        ? ERROR_MESSAGES.tooLarge
                        : error.message || ERROR_MESSAGES.uploadFailed
                );

                err.statusCode = error.httpCode || 400;
                reject(err);
                return;
            }

            try {
                const name = normalizeFieldValue(fields.name).trim();
                const iconText = normalizeFieldValue(fields.icon).trim();
                const uploadedFile = getUploadedFile(files, 'icon_file');

                const uploadedIconPath = uploadedFile ? saveUploadedIcon(uploadedFile) : '';

                resolve({
                    name,
                    icon: uploadedIconPath || iconText || ''
                });
            } catch (err) {
                reject(err);
            }
        });
    });
}

async function parseCategoryPayload(req) {
    if (isMultipartRequest(req)) {
        return parseMultipartCategory(req);
    }

    const body = await getPostData(req);

    return {
        name: String(body.name || '').trim(),
        icon: String(body.icon || '').trim()
    };
}

async function getAllCategories(req, res) {
    try {
        const categories = await CategoryModel.getAll();

        sendJson(res, 200, {
            success: true,
            data: categories
        });
    } catch (error) {
        sendJson(res, 500, {
            success: false,
            message: error.message
        });
    }
}

async function createCategory(req, res) {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return sendJson(res, 403, {
                success: false,
                message: 'غير مصرح لك'
            });
        }

        const body = await parseCategoryPayload(req);

        if (!body.name) {
            return sendJson(res, 400, {
                success: false,
                message: ERROR_MESSAGES.missingName
            });
        }

        await CategoryModel.create({
            name: body.name,
            icon: body.icon || ''
        });

        sendJson(res, 201, {
            success: true,
            message: body.icon
                ? 'تم إضافة القسم مع الأيقونة بنجاح'
                : 'تم إضافة القسم بدون أيقونة بنجاح'
        });
    } catch (error) {
        sendJson(res, error.statusCode || 500, {
            success: false,
            message: error.message
        });
    }
}

async function updateCategory(req, res, id) {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return sendJson(res, 403, {
                success: false,
                message: 'غير مصرح لك'
            });
        }

        const body = await parseCategoryPayload(req);

        if (!body.name) {
            return sendJson(res, 400, {
                success: false,
                message: ERROR_MESSAGES.missingName
            });
        }

        await CategoryModel.update(id, {
            name: body.name,
            icon: body.icon || ''
        });

        sendJson(res, 200, {
            success: true,
            message: 'تم تحديث القسم بنجاح'
        });
    } catch (error) {
        sendJson(res, error.statusCode || 500, {
            success: false,
            message: error.message
        });
    }
}

async function deleteCategory(req, res, id) {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return sendJson(res, 403, {
                success: false,
                message: 'غير مصرح لك'
            });
        }

        await CategoryModel.delete(id);

        sendJson(res, 200, {
            success: true,
            message: 'تم حذف القسم بنجاح'
        });
    } catch (error) {
        sendJson(res, 500, {
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory
};
