const fs = require('fs');
const sysPath = require('path');
const url = require('url');

const { isAdmin } = require('./middleware/role.middleware');
const { addCategory, getAllUsers, updateUserRole } = require('./controllers/admin.controller');
// التعديل هنا: ضفنا getAllOrdersAdmin
const { checkout, getOrderHistory, updateOrderStatus, getAllOrdersAdmin } = require('./controllers/order.controller'); 
const { addToCart, viewCart } = require('./controllers/cart.controller');
const { getProducts, createProduct } = require('./controllers/product.controller');
const { authenticate } = require('./middleware/auth.middleware');
const { getProfile } = require('./controllers/user.controller');
const { registerUser, loginUser } = require('./controllers/auth.controller');
const { createReview, getReviews, replyToReview } = require('./controllers/review.controller');

const router = async (req, res) => {
    const baseURL = `http://${req.headers.host}`;
    const parsedUrl = new URL(req.url, baseURL);
    const path = parsedUrl.pathname;
    const method = req.method;

    // ======= 1. مسار عرض الصور (Static Files) =======
    if (path.startsWith('/uploads/') && method === 'GET') {
        const filePath = sysPath.join(__dirname, '..', path);
        try {
            if (fs.existsSync(filePath)) {
                const ext = sysPath.extname(filePath).toLowerCase();
                let contentType = 'application/octet-stream';
                if (ext === '.png') contentType = 'image/png';
                else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
                else if (ext === '.webp') contentType = 'image/webp';

                res.writeHead(200, { 'Content-Type': contentType });
                const readStream = fs.createReadStream(filePath);
                return readStream.pipe(res);
            }
        } catch (error) {
            console.error(error);
        }
    }

    // ======= 2. مسارات المصادقة (Auth) =======
    if (path === '/api/register' && method === 'POST') {
        return registerUser(req, res);
    }

    if (path === '/api/login' && method === 'POST') {
        return loginUser(req, res);
    }

    // ======= 3. مسار الملف الشخصي =======
    if (path === '/api/profile' && method === 'GET') {
        try {
            await authenticate(req, res);
            return getProfile(req, res);
        } catch (error) { return; }
    }

    // ======= 4. مسارات المنتجات =======
    if (path === '/api/products' && method === 'GET') {
        return getProducts(req, res);
    }

    if (path === '/api/products' && method === 'POST') {
        try {
            await authenticate(req, res); 
            return createProduct(req, res);
        } catch (error) { return; }
    }

    // ======= 5. مسارات السلة =======
    if (path === '/api/cart' && method === 'POST') {
        try {
            await authenticate(req, res);
            return addToCart(req, res);
        } catch (error) { return; }
    }

    if (path === '/api/cart' && method === 'GET') {
        try {
            await authenticate(req, res);
            return viewCart(req, res);
        } catch (error) { return; }
    }

    // ======= 6. مسارات الطلبات =======
    if (path === '/api/orders/checkout' && method === 'POST') {
        try {
            await authenticate(req, res);
            return checkout(req, res);
        } catch (error) { return; }
    }

    if (path === '/api/orders/history' && method === 'GET') {
        try {
            await authenticate(req, res);
            return getOrderHistory(req, res);
        } catch (error) { return; }
    }

    if (path === '/api/orders/update-status' && method === 'POST') {
        try {
            await authenticate(req, res);
            return updateOrderStatus(req, res);
        } catch (error) { return; }
    }

    // ======= 7. مسارات الإدارة (Admin) =======
    // التعديل هنا: ضفنا مسار جلب كل الطلبات للأدمن
    if (path === '/api/orders/all' && method === 'GET') {
        try {
            await authenticate(req, res);
            return getAllOrdersAdmin(req, res);
        } catch (error) { return; }
    }

    if (path === '/api/admin/categories' && method === 'POST') {
        try {
            await authenticate(req, res); 
            await isAdmin(req, res);  
            return addCategory(req, res);
        } catch (error) { return; }
    }

    if (path === '/api/admin/users' && method === 'GET') {
        try {
            await authenticate(req, res);
            await isAdmin(req, res);
            return getAllUsers(req, res);
        } catch (error) { return; }
    }

    if (path === '/api/admin/users/role' && method === 'PUT') {
        try {
            await authenticate(req, res);
            await isAdmin(req, res);
            return updateUserRole(req, res);
        } catch (error) { return; }
    }

    // ======= 9. مسارات التقييمات والمراجعات =======
    if (path === '/api/reviews' && method === 'GET') {
        return getReviews(req, res);
    }

    if (path === '/api/reviews' && method === 'POST') {
        try {
            await authenticate(req, res);
            return createReview(req, res);
        } catch (error) { return; }
    }

    if (path === '/api/reviews/reply' && method === 'POST') {
        try {
            await authenticate(req, res);
            return replyToReview(req, res);
        } catch (error) { return; }
    }

    // ======= 8. مسار غير موجود (404) =======
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
        success: false, 
        error: '(404 route not found)' 
    }));
};

module.exports = router;