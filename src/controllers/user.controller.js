const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');
const { getPostData } = require('../utils/helpers');

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

async function updateProfile(req, res) {
    try {
        const userId = req.user.userId;
        const body = await getPostData(req);

        const currentUser = await UserModel.getById(userId);
        if (!currentUser) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
                success: false,
                message: 'User not found'
            }));
        }

        const profileData = {
            first_name: body.first_name || currentUser.first_name,
            last_name: body.last_name || currentUser.last_name,
            phone: body.phone || currentUser.phone || '',
            default_shipping_address: body.default_shipping_address || currentUser.default_shipping_address || ''
        };

        await UserModel.updateProfile(userId, profileData);

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

        const updated = await UserModel.getById(userId);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: 'Profile updated successfully',
            data: updated
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
