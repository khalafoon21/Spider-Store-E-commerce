require('dotenv').config();

const http = require('http');
const fs = require('fs');
const path = require('path');

const router = require('./router');
const getDb = require('./config/database');

const PORT = process.env.PORT || 3000;

// تحديد مكان فولدر الفرونت
// لو server.js داخل src استخدم ../frontend
// لو server.js في جذر المشروع استخدم frontend
const frontendPaths = [
    path.join(__dirname, '../frontend'),
];

const FRONTEND_DIR = frontendPaths.find((p) => fs.existsSync(p));

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

function serveFile(req, res) {
    if (!FRONTEND_DIR) {
        return false;
    }

    let requestedPath = decodeURIComponent(req.url.split('?')[0]);

    // الصفحة الرئيسية
    if (requestedPath === '/') {
        requestedPath = '/index.html';
    }

    // حماية من الوصول لملفات خارج فولدر frontend
    const filePath = path.normalize(path.join(FRONTEND_DIR, requestedPath));

    if (!filePath.startsWith(FRONTEND_DIR)) {
        return false;
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        return false;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, {
        'Content-Type': contentType
    });

    fs.createReadStream(filePath).pipe(res);
    return true;
}

const server = http.createServer((req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const urlPath = req.url.split('?')[0];

    // أي API يروح للراوتر
    if (urlPath.startsWith('/api')) {
        router(req, res);
        return;
    }

    // ملفات uploads لو الراوتر عندك بيتعامل معاها سيبها للراوتر
    if (urlPath.startsWith('/uploads')) {
        router(req, res);
        return;
    }

    // أي GET عادي نحاول نجيبه من frontend
    if (req.method === 'GET') {
        const served = serveFile(req, res);

        if (served) {
            return;
        }
    }

    // لو مش ملف فرونت، ابعته للراوتر
    router(req, res);
});

getDb.init()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);

            if (FRONTEND_DIR) {
                console.log(`✅ Frontend served from: ${FRONTEND_DIR}`);
            } else {
                console.log('⚠️ Frontend folder not found');
            }
        });
    })
    .catch((error) => {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    });