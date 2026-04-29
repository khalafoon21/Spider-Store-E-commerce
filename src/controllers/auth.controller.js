const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const UserModel = require('../models/user.model');
const { getPostData } = require('../utils/helpers');
const { sendMail } = require('../services/email.service');
const bcrypt = require('bcryptjs');

function getAppBaseUrl(req) {
    return String(process.env.APP_BASE_URL || `http://${req.headers.host}`).replace(/\/+$/, '');
}

function makeToken() {
    return crypto.randomBytes(32).toString('hex');
}

function toMysqlDateTime(date) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

function parseDbDate(value) {
    if (!value) return null;

    if (value instanceof Date) {
        return value;
    }

    const clean = String(value).trim();

    if (!clean) return null;

    return new Date(clean.replace(' ', 'T'));
}

function normalizeRole(role) {
    return role === 'customer' ? 'user' : (role || 'user');
}

function createAuthToken(user) {
    return jwt.sign(
        {
            userId: user.id,
            role: normalizeRole(user.role)
        },
        process.env.JWT_SECRET || 'fallback_secret_key',
        { expiresIn: '30d' }
    );
}

function getAuthUserPayload(user) {
    return {
        id: user.id,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        role: normalizeRole(user.role),
        seller_status: user.seller_status || ''
    };
}

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
}

async function registerUser(req, res) {
    try {
        const body = await getPostData(req);

        const first_name = String(body.first_name || '').trim();
        const last_name = String(body.last_name || '').trim();
        const email = String(body.email || '').trim().toLowerCase();
        const phone = body.phone ? String(body.phone).trim() : null;
        const password = String(body.password || '');

        if (!first_name || !last_name || !email || !password) {
            return sendJson(res, 400, {
                success: false,
                message: 'كل الحقول المطلوبة يجب إدخالها'
            });
        }

        if (password.length < 6) {
            return sendJson(res, 400, {
                success: false,
                message: 'كلمة المرور يجب ألا تقل عن 6 أحرف'
            });
        }

        const existingUser = await UserModel.findByEmail(email);

        if (existingUser) {
            return sendJson(res, 400, {
                success: false,
                message: 'البريد الإلكتروني مستخدم بالفعل'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const activationToken = makeToken();
        const activationExpires = toMysqlDateTime(
            new Date(Date.now() + 24 * 60 * 60 * 1000)
        );

        await UserModel.create({
            first_name,
            last_name,
            email,
            password_hash,
            phone,
            role: 'user',
            seller_status: '',
            email_verified: 0,
            activation_token: activationToken,
            activation_expires: activationExpires
        });

        const activationUrl = `${getAppBaseUrl(req)}/pages/auth/activate.html?token=${activationToken}`;

        await sendMail({
            to: email,
            subject: 'تفعيل حسابك في Spider Store',
            text: `مرحبًا ${first_name}، افتح الرابط التالي لتفعيل حسابك خلال 24 ساعة: ${activationUrl}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.8; direction: rtl; text-align: right;">
                    <h2 style="margin:0 0 16px;color:#0f172a;">تفعيل حسابك في Spider Store</h2>

                    <p>مرحبًا ${first_name}،</p>

                    <p>تم إنشاء حسابك بنجاح. اضغط على الزر التالي لتفعيل الحساب.</p>
                    <p>الرابط صالح لمدة 24 ساعة فقط.</p>

                    <p style="margin:24px 0;">
                        <a
                            href="${activationUrl}"
                            style="display:inline-block;background:#06B6D4;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold;"
                        >
                            تفعيل الحساب
                        </a>
                    </p>

                    <p>لو الزر لا يعمل، انسخ الرابط التالي وافتحه في المتصفح:</p>
                    <p style="direction:ltr;text-align:left;word-break:break-all;color:#0891B2;">
                        ${activationUrl}
                    </p>
                </div>
            `
        });

        return sendJson(res, 201, {
            success: true,
            message: 'تم إنشاء الحساب بنجاح. برجاء تفعيل حسابك من رابط التفعيل المرسل إلى بريدك الإلكتروني.'
        });

    } catch (error) {
        console.error('Error registering user:', error);

        if (error.code === 'INVALID_JSON') {
            return sendJson(res, 400, {
                success: false,
                message: 'بيانات غير صالحة'
            });
        }

        if (error.code === 'EMAIL_CONFIG_MISSING') {
            return sendJson(res, 500, {
                success: false,
                message: 'إعدادات البريد الإلكتروني غير مكتملة'
            });
        }

        return sendJson(res, 500, {
            success: false,
            message: 'حدث خطأ أثناء إنشاء الحساب'
        });
    }
}

async function loginUser(req, res) {
    try {
        const body = await getPostData(req);

        const email = String(body.email || '').trim().toLowerCase();
        const password = String(body.password || '');

        if (!email || !password) {
            return sendJson(res, 400, {
                success: false,
                message: 'برجاء إدخال البريد الإلكتروني وكلمة المرور'
            });
        }

        const user = await UserModel.findByEmail(email);

        if (!user) {
            return sendJson(res, 401, {
                success: false,
                message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordMatch) {
            return sendJson(res, 401, {
                success: false,
                message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            });
        }

        if (Number(user.email_verified) !== 1) {
            return sendJson(res, 403, {
                success: false,
                message: 'برجاء تفعيل حسابك من البريد الإلكتروني قبل تسجيل الدخول'
            });
        }

        const token = createAuthToken(user);

        return sendJson(res, 200, {
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            token,
            user: getAuthUserPayload(user)
        });

    } catch (error) {
        console.error('Error logging in:', error);

        if (error.code === 'INVALID_JSON') {
            return sendJson(res, 400, {
                success: false,
                message: 'بيانات غير صالحة'
            });
        }

        return sendJson(res, 500, {
            success: false,
            message: 'حدث خطأ في السيرفر'
        });
    }
}

async function activateEmail(req, res) {
    try {
        const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
        const token = parsedUrl.searchParams.get('token');

        if (!token) {
            return sendJson(res, 400, {
                success: false,
                message: 'رابط التفعيل غير صحيح'
            });
        }

        const user = await UserModel.findByActivationToken(token);
        const expiresAt = user ? parseDbDate(user.activation_expires) : null;

        if (!user || !expiresAt || expiresAt < new Date()) {
            return sendJson(res, 400, {
                success: false,
                message: 'رابط التفعيل غير صحيح أو انتهت صلاحيته'
            });
        }

        await UserModel.activate(user.id);

        return sendJson(res, 200, {
            success: true,
            message: 'تم تفعيل الحساب بنجاح'
        });

    } catch (error) {
        console.error('Error activating email:', error);

        return sendJson(res, 500, {
            success: false,
            message: 'حدث خطأ أثناء تفعيل الحساب'
        });
    }
}

async function forgotPassword(req, res) {
    try {
        const body = await getPostData(req);
        const email = String(body.email || '').trim().toLowerCase();

        if (!email) {
            return sendJson(res, 400, {
                success: false,
                message: 'البريد الإلكتروني مطلوب'
            });
        }

        const user = await UserModel.findByEmail(email);

        if (user) {
            const resetToken = makeToken();
            const resetExpires = toMysqlDateTime(new Date(Date.now() + 60 * 60 * 1000));
            const resetUrl = `${getAppBaseUrl(req)}/pages/auth/reset-password.html?token=${resetToken}`;

            await UserModel.setResetToken(user.id, resetToken, resetExpires);

            await sendMail({
                to: email,
                subject: 'إعادة تعيين كلمة المرور - Spider Store',
                text: `افتح الرابط التالي خلال ساعة واحدة لإعادة تعيين كلمة المرور: ${resetUrl}`,
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.8; direction: rtl; text-align: right;">
                        <h2>إعادة تعيين كلمة المرور</h2>
                        <p>اضغط على الزر التالي لإعادة تعيين كلمة المرور. الرابط صالح لمدة ساعة واحدة فقط.</p>

                        <p style="margin:24px 0;">
                            <a
                                href="${resetUrl}"
                                style="display:inline-block;background:#06B6D4;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold;"
                            >
                                إعادة تعيين كلمة المرور
                            </a>
                        </p>

                        <p style="direction:ltr;text-align:left;word-break:break-all;color:#0891B2;">
                            ${resetUrl}
                        </p>
                    </div>
                `
            });
        }

        return sendJson(res, 200, {
            success: true,
            message: 'إذا كان البريد الإلكتروني موجودًا، سيتم إرسال رابط إعادة التعيين.'
        });

    } catch (error) {
        console.error('Error in forgot password:', error);

        return sendJson(res, 500, {
            success: false,
            message: 'حدث خطأ أثناء إرسال رابط إعادة التعيين'
        });
    }
}

async function resetPassword(req, res) {
    try {
        const body = await getPostData(req);
        const token = String(body.token || '').trim();
        const password = String(body.password || '');

        if (!token || !password || password.length < 6) {
            return sendJson(res, 400, {
                success: false,
                message: 'رابط إعادة التعيين أو كلمة المرور غير صالح'
            });
        }

        const user = await UserModel.findByResetToken(token);
        const expiresAt = user ? parseDbDate(user.reset_expires) : null;

        if (!user || !expiresAt || expiresAt < new Date()) {
            return sendJson(res, 400, {
                success: false,
                message: 'رابط إعادة التعيين غير صحيح أو انتهت صلاحيته'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await UserModel.updatePassword(user.id, passwordHash);

        return sendJson(res, 200, {
            success: true,
            message: 'تم تحديث كلمة المرور بنجاح'
        });

    } catch (error) {
        console.error('Error resetting password:', error);

        return sendJson(res, 500, {
            success: false,
            message: 'حدث خطأ أثناء تحديث كلمة المرور'
        });
    }
}

module.exports = {
    registerUser,
    loginUser,
    activateEmail,
    forgotPassword,
    resetPassword
};