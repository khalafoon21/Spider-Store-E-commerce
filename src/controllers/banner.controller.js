const BannerModel = require('../models/banner.model');
const { formidable } = require('formidable');
const path = require('path');
const fs = require('fs');
const { finalizeUploadedImage } = require('../utils/upload-security');
const { getPostData } = require('../utils/helpers');

const allowedImageTypes = [
    'image/jpeg',
    'image/png',
    'image/webp'
];

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
}

function ensureUploadFolder() {
    const uploadFolder = path.join(__dirname, '../../uploads/banners');

    if (!fs.existsSync(uploadFolder)) {
        fs.mkdirSync(uploadFolder, { recursive: true });
    }

    return uploadFolder;
}

function getFieldValue(fields, key, fallback = '') {
    const value = fields[key];

    if (Array.isArray(value)) {
        return value[0] !== undefined ? String(value[0]).trim() : fallback;
    }

    if (value !== undefined && value !== null) {
        return String(value).trim();
    }

    return fallback;
}

function isMultipart(req) {
    return String(req.headers['content-type'] || '')
        .toLowerCase()
        .includes('multipart/form-data');
}

function bannerImagePath(file, uploadFolder) {
    return finalizeUploadedImage(file, {
        uploadDir: uploadFolder,
        publicDir: '/uploads/banners',
        allowedMimeTypes: allowedImageTypes,
        maxSize: 5 * 1024 * 1024,
        filenamePrefix: 'banner'
    });
}

function parseBannerMultipart(req, imageRequired = false) {
    const uploadFolder = ensureUploadFolder();

    const form = formidable({
        uploadDir: uploadFolder,
        keepExtensions: true,
        maxFileSize: 5 * 1024 * 1024,
        maxTotalFileSize: 5 * 1024 * 1024
    });

    return new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) {
                const error = new Error('خطأ أثناء رفع الصورة');
                error.statusCode = 400;
                reject(error);
                return;
            }

            try {
                const payload = {
                    title: getFieldValue(fields, 'title'),
                    description: getFieldValue(fields, 'description'),
                    bg_color: getFieldValue(fields, 'bg_color', '#0f172a'),
                    text_color: getFieldValue(fields, 'text_color', '#ffffff'),
                    button_text: getFieldValue(fields, 'button_text', 'اكتشف الآن'),
                    button_color: getFieldValue(fields, 'button_color', '#06B6D4')
                };

                if (files.image) {
                    const file = Array.isArray(files.image) ? files.image[0] : files.image;
                    payload.image_url = bannerImagePath(file, uploadFolder);
                }

                if (imageRequired && !payload.image_url) {
                    const error = new Error('صورة البانر مطلوبة');
                    error.statusCode = 400;
                    throw error;
                }

                resolve(payload);
            } catch (uploadError) {
                reject(uploadError);
            }
        });
    });
}

async function getAllBanners(req, res) {
    try {
        const banners = await BannerModel.getAll();

        return sendJson(res, 200, {
            success: true,
            data: banners
        });
    } catch (error) {
        console.error('Get banners error:', error);

        return sendJson(res, 500, {
            success: false,
            message: error.message || 'تعذر تحميل البانرات'
        });
    }
}

async function createBanner(req, res) {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return sendJson(res, 403, {
                success: false,
                message: 'غير مصرح لك'
            });
        }

        if (!isMultipart(req)) {
            return sendJson(res, 400, {
                success: false,
                message: 'يجب إرسال بيانات البانر كـ multipart/form-data'
            });
        }

        const payload = await parseBannerMultipart(req, true);

        await BannerModel.create(payload);

        return sendJson(res, 201, {
            success: true,
            message: 'تم إضافة البانر بنجاح'
        });
    } catch (error) {
        console.error('Create banner error:', error);

        return sendJson(res, error.statusCode || 500, {
            success: false,
            message: error.message || 'تعذر إضافة البانر'
        });
    }
}

async function updateBanner(req, res, id) {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return sendJson(res, 403, {
                success: false,
                message: 'غير مصرح لك'
            });
        }

        let payload;

        if (isMultipart(req)) {
            payload = await parseBannerMultipart(req, false);
        } else {
            const body = await getPostData(req);

            payload = {
                title: body.title,
                description: body.description,
                bg_color: body.bg_color,
                text_color: body.text_color,
                button_text: body.button_text,
                button_color: body.button_color,
                image_url: body.image_url
            };
        }

        const updated = await BannerModel.update(id, payload);

        if (!updated) {
            return sendJson(res, 404, {
                success: false,
                message: 'البانر غير موجود'
            });
        }

        return sendJson(res, 200, {
            success: true,
            message: 'تم تحديث البانر بنجاح'
        });
    } catch (error) {
        console.error('Update banner error:', error);

        return sendJson(res, error.statusCode || 500, {
            success: false,
            message: error.message || 'تعذر تحديث البانر'
        });
    }
}

async function deleteBanner(req, res, id) {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return sendJson(res, 403, {
                success: false,
                message: 'غير مصرح لك'
            });
        }

        await BannerModel.delete(id);

        return sendJson(res, 200, {
            success: true,
            message: 'تم حذف البانر بنجاح'
        });
    } catch (error) {
        console.error('Delete banner error:', error);

        return sendJson(res, 500, {
            success: false,
            message: error.message || 'تعذر حذف البانر'
        });
    }
}

module.exports = {
    getAllBanners,
    createBanner,
    updateBanner,
    deleteBanner
};