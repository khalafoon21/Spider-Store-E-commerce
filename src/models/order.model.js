const getDb = require('../config/database');
const CartModel = require('./cart.model');

class OrderModel {
    static async createOrder(userId, shippingAddress) {
        const db = getDb();
        const cartItems = await CartModel.getCart(userId);
        
        if (cartItems.length === 0) {
            throw new Error('Your cart is empty. You cannot complete the order.');
        }

        let totalAmount = 0;
        cartItems.forEach(item => {
            totalAmount += item.total_price;
        });

        const orderResult = await db.run(
            `INSERT INTO orders (user_id, total_amount, shipping_address) VALUES (?, ?, ?)`,
            [userId, totalAmount, shippingAddress]
        );
        const orderId = orderResult.lastID;

        for (const item of cartItems) {
            await db.run(
                `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)`,
                [orderId, item.product_id, item.quantity, item.price]
            );
        }

        await db.run(`DELETE FROM cart_items WHERE user_id = ?`, [userId]);

        return orderId;
    }

    static async getUserOrders(userId) {
        const db = getDb();
        // بنجيب الطلبات الأساسية لليوزر ده بس
        const orders = await db.all(
            `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`, 
            [userId]
        );

        for (let order of orders) {
            const items = await db.all(`
                SELECT oi.quantity, oi.price_at_purchase, p.title, p.image_url
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            `, [order.id]);
            
            order.items = items;
        }
        
        return orders;
    }

    // 🔥 دي الدالة الجديدة الخاصة بالأدمن (بتجيب كل الطلبات في المتجر) 🔥
    static async getAllOrders() {
        const db = getDb();
        
        // بنجيب كل الطلبات من غير ما نحدد يوزر معين
        const orders = await db.all(
            `SELECT * FROM orders ORDER BY created_at DESC`
        );

        // بنجيب محتويات كل طلب (إضافة احترافية عشان لو حبيت تعرضها)
        for (let order of orders) {
            const items = await db.all(`
                SELECT oi.quantity, oi.price_at_purchase, p.title, p.image_url
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            `, [order.id]);
            
            order.items = items;
        }
        
        return orders;
    }

    static async updateStatus(orderId, newStatus) {
        const db = getDb();
        await db.run(
            `UPDATE orders SET status = ? WHERE id = ?`,
            [newStatus, orderId]
        );
    }
}

module.exports = OrderModel;