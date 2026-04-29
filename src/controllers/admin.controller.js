const getDb = require('../config/database');
const { getPostData } = require('../utils/helpers');

// 1. إضافة قسم جديد (صلاحية أدمن فقط)
async function addCategory(req, res) {
    try {
        // حماية إضافية: التأكد إن المستخدم أدمن
        if (req.user.role !== 'admin' && req.user.role !== 'seller') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'غير مصرح لك بإضافة أقسام' }));
        }

        const body = await getPostData(req);
        const { name } = body;

        if (!name) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'اسم القسم مطلوب' }));
        }

        const db = getDb();
        const result = await db.run(`INSERT INTO categories (name) VALUES (?)`, [name]);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: true, 
            message: 'تم إضافة القسم بنجاح', 
            categoryId: result.lastID 
        }));
    } catch (error) {
        console.error(error);
        if (error.code === 'INVALID_JSON') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'بيانات غير صالحة' }));
        }
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'حدث خطأ أثناء إضافة القسم' }));
    }
}

// 2. جلب جميع المستخدمين (لإدارتهم)
async function getAllUsers(req, res) {
    try {
        if (req.user.role !== 'admin') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'صلاحية أدمن فقط' }));
        }

        const db = getDb();
        const users = await db.all(`
            SELECT
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                u.role,
                u.seller_status,
                u.created_at,
                sr.id AS seller_request_id,
                sr.status AS seller_request_status,
                CASE WHEN sr.id IS NULL THEN 0 ELSE 1 END AS has_seller_request
            FROM users u
            LEFT JOIN (
                SELECT latest_request.*
                FROM seller_requests latest_request
                INNER JOIN (
                    SELECT user_id, MAX(id) AS id
                    FROM seller_requests
                    GROUP BY user_id
                ) latest ON latest.id = latest_request.id
            ) sr ON sr.user_id = u.id
            ORDER BY u.created_at DESC
        `);

        const normalizedUsers = users.map(user => ({
            ...user,
            seller_request_id: user.seller_request_id || null,
            seller_request_status: user.seller_request_status || null,
            has_seller_request: Boolean(user.has_seller_request)
        }));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: normalizedUsers }));
    } catch (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'حدث خطأ أثناء جلب المستخدمين' }));
    }
}

// 3. ترقية المستخدمين (من أهم الدوال الأمنية)
async function updateUserRole(req, res) {
    try {
        // حماية صارمة: الأدمن فقط هو من يمكنه ترقية الناس
        if (req.user.role !== 'admin') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'صلاحية أدمن فقط للترقية' }));
        }

        const body = await getPostData(req);
        const { user_id, new_role } = body;

        const requestedRole = new_role === 'customer' ? 'user' : new_role;
        const validRoles = ['user', 'seller', 'admin'];
        
        if (!user_id || !validRoles.includes(requestedRole)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'بيانات غير صالحة أو رتبة غير مسموحة' }));
        }

        // منع الأدمن من تغيير رتبته لنفسه بالخطأ عشان ميقفلش على نفسه السيستم
        if (req.user.userId === parseInt(user_id)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'لا يمكنك تغيير صلاحياتك الشخصية' }));
        }

        const db = getDb();
        const sellerStatus = requestedRole === 'seller' ? 'approved_seller' : '';
        await db.run(
            `UPDATE users SET role = ?, seller_status = ? WHERE id = ?`,
            [requestedRole, sellerStatus, user_id]
        );

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: `تم تحديث صلاحيات المستخدم إلى: ${requestedRole}` }));
    } catch (error) {
        console.error(error);
        if (error.code === 'INVALID_JSON') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'بيانات غير صالحة' }));
        }
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'حدث خطأ أثناء التحديث' }));
    }
}

// دالة جلب الأقسام (غالباً عامة عشان بتظهر في الموقع)
async function getCategories(req, res) {
    try {
        const db = getDb();
        const categories = await db.all(`SELECT id, name FROM categories ORDER BY name ASC`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: categories }));
    } catch (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'حدث خطأ أثناء جلب الأقسام' }));
    }
}

module.exports = { addCategory, getCategories, getAllUsers, updateUserRole };
