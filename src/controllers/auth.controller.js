const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const UserModel = require('../models/user.model');
const { getPostData } = require('../utils/helpers');
const { sendMail } = require('../services/email.service');
const bcrypt = require('bcryptjs');

function getAppBaseUrl(req) {
    return process.env.APP_BASE_URL || `http://${req.headers.host}`;
}

function makeToken() {
    return crypto.randomBytes(32).toString('hex');
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

        console.log('Registration attempt:', {
            first_name,
            last_name,
            email,
            phone
        });

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

        /*
            Email activation is temporarily disabled.
            We intentionally do NOT generate activation_token here.
            We also pass verified/active fields in case UserModel.create supports them.
            If UserModel.create ignores extra fields, loginUser below also no longer blocks email_verified.
        */
        const newUserId = await UserModel.create({
            first_name,
            last_name,
            email,
            password_hash,
            phone,
            role: 'user',
            seller_status: '',
            email_verified: 1,
            is_active: 1,
            activation_token: null,
            activation_expires: null
        });

        console.log('User created with ID:', newUserId);

        const newUser = {
            id: newUserId,
            first_name,
            last_name,
            email,
            role: 'user',
            seller_status: '',
            email_verified: 1,
            is_active: 1
        };

        const token = createAuthToken(newUser);

        return sendJson(res, 201, {
            success: true,
            message: 'تم إنشاء الحساب بنجاح',
            token,
            user: getAuthUserPayload(newUser)
        });

    } catch (error) {
        console.error('Error registering user:', error);

        if (error.code === 'INVALID_JSON') {
            return sendJson(res, 400, {
                success: false,
                message: 'Invalid JSON payload'
            });
        }

        return sendJson(res, 500, {
            success: false,
            message: 'حدث خطأ في السيرفر'
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
                message: 'Please enter your email address and password.'
            });
        }

        const user = await UserModel.findByEmail(email);

        if (!user) {
            return sendJson(res, 401, {
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordMatch) {
            return sendJson(res, 401, {
                success: false,
                message: 'Invalid email or password.'
            });
        }

        /*
            Email activation is temporarily disabled.
            Do NOT block login by email_verified for now.
            Keep activateEmail function below for future reuse.
        */

        const token = createAuthToken(user);

        return sendJson(res, 200, {
            success: true,
            message: 'Login successful',
            token,
            user: getAuthUserPayload(user)
        });

    } catch (error) {
        console.error('Error logging in:', error);

        if (error.code === 'INVALID_JSON') {
            return sendJson(res, 400, {
                success: false,
                message: 'Invalid JSON payload'
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
                message: 'Activation token is required'
            });
        }

        const user = await UserModel.findByActivationToken(token);

        if (!user || !user.activation_expires || new Date(user.activation_expires) < new Date()) {
            return sendJson(res, 400, {
                success: false,
                message: 'Activation link is invalid or expired'
            });
        }

        await UserModel.activate(user.id);

        return sendJson(res, 200, {
            success: true,
            message: 'Email activated successfully. You can login now.'
        });

    } catch (error) {
        console.error('Error activating email:', error);

        return sendJson(res, 500, {
            success: false,
            message: 'Server error'
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
                message: 'Email is required'
            });
        }

        const user = await UserModel.findByEmail(email);

        if (user) {
            const resetToken = makeToken();
            const resetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

            await UserModel.setResetToken(user.id, resetToken, resetExpires);

            const resetUrl = `${getAppBaseUrl(req)}/frontend/pages/auth/reset-password.html?token=${resetToken}`;

            await sendMail({
                to: email,
                subject: 'Reset your Spider Store password',
                text: `Open this link within 1 hour to reset your password: ${resetUrl}`
            });
        }

        return sendJson(res, 200, {
            success: true,
            message: 'If this email exists, a reset link has been sent.'
        });

    } catch (error) {
        console.error('Error in forgot password:', error);

        return sendJson(res, 500, {
            success: false,
            message: 'Server error'
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
                message: 'Valid token and password are required'
            });
        }

        const user = await UserModel.findByResetToken(token);

        if (!user || !user.reset_expires || new Date(user.reset_expires) < new Date()) {
            return sendJson(res, 400, {
                success: false,
                message: 'Reset link is invalid or expired'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await UserModel.updatePassword(user.id, passwordHash);

        return sendJson(res, 200, {
            success: true,
            message: 'Password updated successfully.'
        });

    } catch (error) {
        console.error('Error resetting password:', error);

        return sendJson(res, 500, {
            success: false,
            message: 'Server error'
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