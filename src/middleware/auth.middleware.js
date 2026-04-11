const jwt = require('jsonwebtoken');
require('dotenv').config();

function authenticate(req, res) {
    return new Promise((resolve, reject) => {
        const authHeader = req.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Unauthorized' }));
            return reject('No token');
        }

        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');

            req.user = decoded;
            resolve(true);
        } catch (err) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Forbidden' }));
            reject('Invalid token');
        }
    });
}

module.exports = {authenticate};