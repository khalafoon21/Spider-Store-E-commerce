const OrderModel = require('../models/order.model');
const { getPostData } = require('../utils/helpers');


async function checkout(req, res) {
    try {
        const userId = req.user.userId; 
        
        const body = await getPostData(req);
        const { shipping_address } = body;

        if (!shipping_address) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ 
                success: false, 
                message: 'Shipping address is required to complete the order' 
            }));
        }

        const orderId = await OrderModel.createOrder(userId, shipping_address);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true, 
            message: 'Your order has been successfully placed!', 
            orderId: orderId 
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

        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: false, 
            message: error.message || 'An error occurred while processing your order' 
        }));
    }
} 


async function getOrderHistory(req, res) {
    try {
        const userId = req.user.userId;
        const orders = await OrderModel.getUserOrders(userId);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: orders }));
    } catch (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: false, 
            message: 'An error occurred while fetching order history' 
        }));
    }
}
async function getAllOrdersAdmin(req, res) {
    try {
        // 1. نتأكد إنه أدمن أو بائع
        if (req.user.role !== 'seller' && req.user.role !== 'admin') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ 
                success: false, 
                message: 'غير مصرح لك برؤية جميع الطلبات' 
            }));
        }

        // 2. نجيب كل الطلبات من الموديل
        const orders = await OrderModel.getAllOrders();

        // 3. نبعتها للفرونت اند
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: orders }));

    } catch (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: false, 
            message: 'حدث خطأ أثناء جلب الطلبات' 
        }));
    }
}

async function updateOrderStatus(req, res) {
    try {
        if (req.user.role !== 'seller' && req.user.role !== 'admin') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ 
                success: false, 
                message: 'You are not authorized to update order status' 
            }));
        }

        const body = await getPostData(req);
        const { order_id, status } = body;

        const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered'];
        
        if (!order_id || !validStatuses.includes(status)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ 
                success: false, 
                message: 'Invalid order ID or status' 
            }));
        }

        await OrderModel.updateStatus(order_id, status);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: true, 
            message: `Order status updated successfully to: ${status}` 
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
            message: 'An error occurred while updating order status' 
        }));
    }
} 

module.exports = { checkout, getOrderHistory, updateOrderStatus,getAllOrdersAdmin };