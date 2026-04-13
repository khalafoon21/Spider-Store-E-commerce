const fs = require('fs');
const sysPath = require('path');
const url = require('url');

const { isAdmin } = require('./middleware/role.middleware');
const { getAllUsers, updateUserRole } = require('./controllers/admin.controller');
const { checkout, getOrderHistory, updateOrderStatus, getAllOrdersAdmin } = require('./controllers/order.controller'); 
const { addToCart, viewCart } = require('./controllers/cart.controller');
const { getProducts, createProduct, getMyProducts, updateProduct, deleteProduct } = require('./controllers/product.controller');
const { authenticate } = require('./middleware/auth.middleware');
const { getProfile, updateProfile } = require('./controllers/user.controller');
const { registerUser, loginUser } = require('./controllers/auth.controller');
const { createReview, getReviews, replyToReview } = require('./controllers/review.controller');
const { getAllCategories, createCategory, updateCategory, deleteCategory } = require('./controllers/category.controller');

// ✨ تم إضافة updateBanner و deleteBanner
const { getAllBanners, createBanner, updateBanner, deleteBanner } = require('./controllers/banner.controller');

const router = async (req, res) => {
    const baseURL = `http://${req.headers.host}`;
    const parsedUrl = new URL(req.url, baseURL);
    const path = parsedUrl.pathname;
    const method = req.method;

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
        } catch (error) { console.error(error); }
    }

    if (path === '/api/register' && method === 'POST') return registerUser(req, res);
    if (path === '/api/login' && method === 'POST') return loginUser(req, res);

    if (path === '/api/profile' && method === 'GET') { try { await authenticate(req, res); return getProfile(req, res); } catch (e) { return; } }
    if (path === '/api/profile' && method === 'PUT') { try { await authenticate(req, res); return updateProfile(req, res); } catch (e) { return; } }

    if (path === '/api/categories' && method === 'GET') return getAllCategories(req, res);
    if (path === '/api/categories' && method === 'POST') { try { await authenticate(req, res); return createCategory(req, res); } catch (e) { return; } }
    if (path.startsWith('/api/categories/') && method === 'PUT') { try { await authenticate(req, res); const id = path.split('/').pop(); return updateCategory(req, res, Number(id)); } catch (e) { return; } }
    if (path.startsWith('/api/categories/') && method === 'DELETE') { try { await authenticate(req, res); const id = path.split('/').pop(); return deleteCategory(req, res, Number(id)); } catch (e) { return; } }

    // ======= ✨ مسارات السلايدر =======
    if (path === '/api/banners' && method === 'GET') return getAllBanners(req, res);
    if (path === '/api/banners' && method === 'POST') { try { await authenticate(req, res); return createBanner(req, res); } catch (e) { return; } }
    if (path.startsWith('/api/banners/') && method === 'PUT') { try { await authenticate(req, res); const id = path.split('/').pop(); return updateBanner(req, res, Number(id)); } catch (e) { return; } }
    if (path.startsWith('/api/banners/') && method === 'DELETE') { try { await authenticate(req, res); const id = path.split('/').pop(); return deleteBanner(req, res, Number(id)); } catch (e) { return; } }

    if (path === '/api/products' && method === 'GET') return getProducts(req, res);
    if (path === '/api/products' && method === 'POST') { try { await authenticate(req, res); return createProduct(req, res); } catch (e) { return; } }
    if (path === '/api/admin/products' && method === 'GET') { try { await authenticate(req, res); return getMyProducts(req, res); } catch (e) { return; } }
    if (path.startsWith('/api/products/') && method === 'PUT') { try { await authenticate(req, res); const id = path.split('/').pop(); return updateProduct(req, res, Number(id)); } catch (e) { return; } }
    if (path.startsWith('/api/products/') && method === 'DELETE') { try { await authenticate(req, res); const id = path.split('/').pop(); return deleteProduct(req, res, Number(id)); } catch (e) { return; } }

    if (path === '/api/cart' && method === 'POST') { try { await authenticate(req, res); return addToCart(req, res); } catch (e) { return; } }
    if (path === '/api/cart' && method === 'GET') { try { await authenticate(req, res); return viewCart(req, res); } catch (e) { return; } }

    if (path === '/api/orders/checkout' && method === 'POST') { try { await authenticate(req, res); return checkout(req, res); } catch (e) { return; } }
    if (path === '/api/orders/history' && method === 'GET') { try { await authenticate(req, res); return getOrderHistory(req, res); } catch (e) { return; } }
    if (path === '/api/orders/update-status' && method === 'POST') { try { await authenticate(req, res); return updateOrderStatus(req, res); } catch (e) { return; } }

    if (path === '/api/orders/all' && method === 'GET') { try { await authenticate(req, res); return getAllOrdersAdmin(req, res); } catch (e) { return; } }
    if (path === '/api/admin/users' && method === 'GET') { try { await authenticate(req, res); await isAdmin(req, res); return getAllUsers(req, res); } catch (e) { return; } }
    if (path === '/api/admin/users/role' && method === 'PUT') { try { await authenticate(req, res); await isAdmin(req, res); return updateUserRole(req, res); } catch (e) { return; } }

    if (path === '/api/reviews' && method === 'GET') return getReviews(req, res);
    if (path === '/api/reviews' && method === 'POST') { try { await authenticate(req, res); return createReview(req, res); } catch (e) { return; } }
    if (path === '/api/reviews/reply' && method === 'POST') { try { await authenticate(req, res); return replyToReview(req, res); } catch (e) { return; } }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: '(404 route not found)' }));
};

module.exports = router;