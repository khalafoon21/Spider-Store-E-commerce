const CartModel = require('../models/cart.model');
const { getPostData } = require('../utils/helpers');

async function addToCart(req, res) {
    try {

        const userId = req.user.userId; 
        
        const body = await getPostData(req);
        const { product_id, quantity } = body;

        if (!product_id) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'رقم المنتج مطلوب' }));
        }

        const qty = quantity || 1;

        await CartModel.addItem(userId, product_id, qty);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'تم إضافة المنتج للسلة بنجاح!' }));

    } catch (error) {
        console.error(error);

        if (error.code === 'INVALID_JSON') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'Invalid JSON payload' }));
        }

        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'حدث خطأ أثناء إضافة المنتج للسلة' }));
    }
}

async function viewCart(req, res) {
    try {
        const userId = req.user.userId;
        const cartItems = await CartModel.getCart(userId);


        let cartTotal = 0;
        cartItems.forEach(item => {
            cartTotal += item.total_price;
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: true, 
            data: cartItems,
            summary: {
                total_items: cartItems.length,
                total_price: cartTotal
            }
        }));

    } catch (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'حدث خطأ أثناء جلب محتويات السلة' }));
    }
}

module.exports = { addToCart, viewCart };