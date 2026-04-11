require('dotenv').config();
const http = require('http');
const router = require('./router');
const getDb = require('./config/database'); // استدعاء ملف الداتا بيز

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    // إعدادات الـ CORS عشان الفرونت اند يقدر يكلم السيرفر براحته
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // الرد على طلبات الـ Preflight بتاعت المتصفح
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // تمرير الطلب لملف الراوتر عشان يوزعه
    router(req, res);
});

// هنا السيرفر بيستنى الداتا بيز تخلص تحميل الأول وبعدين يشتغل
getDb.init().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
    });
});