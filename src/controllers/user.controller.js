const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { formidable } = require('formidable');
const UserModel = require('../models/user.model');
const { getPostData } = require('../utils/helpers');

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function fieldValue(fields, key, fallback = '') {
    return fields[key] ? fields[key][0] : fallback;
}

function uploadedProfilePath(file) {
    const fileName = path.basename(file.filepath || file.newFilename || '');
    return fileName ? `/uploads/profiles/${fileName}` : null;
}

// جلب بيانات الملف الشخصي
async function getProfile(req, res) {
    try {
        const userId = req.user.userId;
        const user = await UserModel.getById(userId);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            data: user
        }));
    } catch (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            message: 'An error occurred while fetching profile'
        }));
    }
}

// تحديث بيانات الملف الشخصي
async function updateProfile(req, res) {
    try {
        const userId = req.user.userId;
        const isMultipart = (req.headers['content-type'] || '').includes('multipart/form-data');

        // جلب البيانات الحالية للمستخدم لاستخدامها كقيم افتراضية في حالة عدم إرسال بعض الحقول
        const currentUser = await UserModel.getById(userId);
        if (!currentUser) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
                success: false,
                message: 'User not found'
            }));
        }

        if (isMultipart) {
            const uploadFolder = path.join(__dirname, '../../uploads/profiles');
            if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder, { recursive: true });

            const form = formidable({
                uploadDir: uploadFolder,
                keepExtensions: true,
                maxFileSize: 5 * 1024 * 1024
            });

            return form.parse(req, async (err, fields, files) => {
                if (err) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: false, message: 'Error uploading profile image' }));
                }

                let profilePicture = null;
                if (files.profile_picture) {
                    const file = Array.isArray(files.profile_picture) ? files.profile_picture[0] : files.profile_picture;
                    if (!allowedImageTypes.includes(file.mimetype)) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ success: false, message: 'Only image files are allowed' }));
                    }
                    profilePicture = uploadedProfilePath(file);
                }

                await UserModel.updateProfile(userId, {
                    first_name: fieldValue(fields, 'first_name', currentUser.first_name),
                    last_name: fieldValue(fields, 'last_name', currentUser.last_name),
                    phone: fieldValue(fields, 'phone', currentUser.phone || ''),
                    address: fieldValue(fields, 'address', currentUser.address || ''),
                    birthdate: fieldValue(fields, 'birthdate', currentUser.birthdate || ''),
                    city: fieldValue(fields, 'city', currentUser.city || ''),
                    country: fieldValue(fields, 'country', currentUser.country || ''),
                    store_name: fields.store_name ? fields.store_name[0] : null,
                    store_description: fields.store_description ? fields.store_description[0] : null,
                    profile_picture: profilePicture
                });

                const updatedUser = await UserModel.getById(userId);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Profile updated successfully', data: updatedUser }));
            });
        }

        const body = await getPostData(req);

        // تجهيز البيانات المحدثة شاملة الحقول الإضافية المطلوبة للمشروع
        const profileData = {
            first_name: body.first_name || currentUser.first_name,
            last_name: body.last_name || currentUser.last_name,
            phone: body.phone || currentUser.phone || '',
            address: body.address || currentUser.address || '',     // ✨ الحقل الجديد: العنوان
            birthdate: body.birthdate || currentUser.birthdate || '', // ✨ الحقل الجديد: تاريخ الميلاد
            city: body.city || currentUser.city || '',              // ✨ الحقل الجديد: المدينة
            country: body.country || currentUser.country || ''      // ✨ الحقل الجديد: البلد
        };

        // تنفيذ عملية التحديث في قاعدة البيانات
        await UserModel.updateProfile(userId, profileData);

        // معالجة تغيير كلمة المرور إذا تم إرسال كلمة مرور جديدة
        if (body.new_password && String(body.new_password).trim().length > 0) {
            if (String(body.new_password).length < 6) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                    success: false,
                    message: 'Password must be at least 6 characters'
                }));
            }
            const hash = await bcrypt.hash(body.new_password, 10);
            await UserModel.updatePassword(userId, hash);
        }

        // جلب البيانات بعد التحديث لإعادتها للفرونت اند
        const updatedUser = await UserModel.getById(userId);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        }));
    } catch (error) {
        console.error(error);

        if (error.code === 'INVALID_JSON') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
                success: false,
                message: 'Invalid JSON payload'
            }));
        }

        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            message: 'An error occurred while updating profile'
        }));
    }
}

module.exports = { getProfile, updateProfile };
