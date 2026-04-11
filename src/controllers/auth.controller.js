const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const {getPostData} = require('../utils/helpers');
const bcrypt = require('bcryptjs');

async function registerUser(req, res) {
    try {
        const body = await getPostData(req);
        const { first_name, last_name, email, password, phone } = body;

        if ( !first_name || !last_name || !email || !password) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ message: 'All fields are require' }));
        }

        const existingUser = await UserModel.findByEmail(email);
        if (existingUser) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ message: 'Email already exists' }));
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const newUserId = await UserModel.create({
            first_name,
            last_name,
            email,
            password_hash,
            phone: phone || null, 
        });

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'User registered successfully', userId: newUserId }));

    } catch (error) {
        console.error('Error registering user:', error);

        if (error.code === 'INVALID_JSON') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ message: 'Invalid JSON payload' }));
        }

        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Server error' }));
    }   
}
async function loginUser(req, res) {
    try {
        const body = await getPostData(req);
        const { email, password } = body;

        if (!email || !password) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'Please enter your email address and password.' }));
        }

        const user = await UserModel.findByEmail(email);
        if (!user) {

            res.writeHead(401, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'Invalid email or password.' }));
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordMatch) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'Invalid email or password.' }));
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role }, 
            process.env.JWT_SECRET || 'fallback_secret_key', 
            { expiresIn: '30d' } 
        );

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                first_name: user.first_name,
                email: user.email,
                role: user.role
            }
        }));

    } catch (error) {
        console.error(error);

        if (error.code === 'INVALID_JSON') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'Invalid JSON payload' }));
        }

        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'حدث خطأ في السيرفر' }));
    }
}

module.exports = {
    registerUser,
    loginUser
};
