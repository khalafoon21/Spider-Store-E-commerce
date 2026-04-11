const ReviewModel = require('../models/review.model');
const { getPostData } = require('../utils/helpers');
const url = require('url');

// 1. إضافة تقييم
async function createReview(req, res) {
    try {
        const userId = req.user.userId;
        const body = await getPostData(req);
        const { product_id, rating, comment } = body;

        if (!product_id || !rating || rating < 1 || rating > 5) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'رقم المنتج والتقييم (من 1 لـ 5) مطلوبان' }));
        }

        const reviewId = await ReviewModel.addReview(product_id, userId, rating, comment || '');
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'تم إضافة تقييمك بنجاح!', reviewId }));
    } catch (error) {
        if (error.code === 'INVALID_JSON') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'Invalid JSON payload' }));
        }

        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: error.message || 'حدث خطأ أثناء إضافة التقييم' }));
    }
}

// 2. جلب تقييمات منتج معين
async function getReviews(req, res) {
    try {
        const parsedUrl = url.parse(req.url, true);
        const productId = parsedUrl.query.product_id;
        
        if (!productId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'يرجى إرسال رقم المنتج (product_id)' }));
        }

        const reviews = await ReviewModel.getProductReviews(productId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: reviews }));
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'حدث خطأ أثناء جلب التقييمات' }));
    }
}

// 3. إضافة رد على تقييم (للبائع أو الأدمن)
async function replyToReview(req, res) {
    try {
        if (req.user.role !== 'seller' && req.user.role !== 'admin') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'غير مصرح لك بالرد على التقييمات' }));
        }

        const body = await getPostData(req);
        const { review_id, reply } = body;

        if (!review_id || !reply) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'رقم التقييم والرد مطلوبان' }));
        }

        await ReviewModel.addReply(review_id, reply);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'تم إضافة الرد بنجاح' }));
    } catch (error) {
        if (error.code === 'INVALID_JSON') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'Invalid JSON payload' }));
        }

        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'حدث خطأ أثناء إضافة الرد' }));
    }
}

module.exports = { createReview, getReviews, replyToReview };