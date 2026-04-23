const getDb = require('../config/database');
const CartModel = require('./cart.model');

class OrderModel {
    // التعديل 1: إضافة phone و fullName للدالة
    static async createOrder(userId, shippingAddress, phone, fullName) {
        const db = getDb();
        const cartItems = await CartModel.getCart(userId);
        
        if (cartItems.length === 0) {
            throw new Error('سلة المشتريات فارغة. لا يمكن إتمام الطلب.');
        }

        let totalAmount = 0;
        cartItems.forEach(item => {
            // total_price جاية من الـ CartModel محسوبة وجاهزة (الكمية × السعر بعد الخصم)
            totalAmount += item.total_price;
        });

        // التعديل 2: إضافة مصاريف الشحن للإجمالي عشان يتطابق مع اللي اليوزر شافه في الـ Checkout
        totalAmount += 50; 

        // التعديل 3: إدخال البيانات الجديدة (phone, full_name) في جدول الطلبات
        const orderResult = await db.run(
            `INSERT INTO orders (user_id, total_amount, shipping_address, phone, full_name) VALUES (?, ?, ?, ?, ?)`,
            [userId, totalAmount, shippingAddress, phone, fullName]
        );
        const orderId = orderResult.lastID;

        // تسجيل المنتجات داخل الطلب
        for (const item of cartItems) {
            // حساب سعر القطعة الواحدة لحظة الشراء (لتسجيلها في الفاتورة التاريخية بشكل صحيح)
            const finalPrice = item.discount > 0 ? item.price - (item.price * item.discount / 100) : item.price;
            
            await db.run(
                `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)`,
                [orderId, item.product_id, item.quantity, finalPrice]
            );
        }

        // مسح السلة بعد نجاح الطلب 100%
        await db.run(`DELETE FROM cart_items WHERE user_id = ?`, [userId]);

        return orderId;
    }

    static async getUserOrders(userId) {
        const db = getDb();
        // جلب الطلبات الخاصة باليوزر فقط
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

    // دالة الأدمن لجلب جميع الطلبات
    static async getAllOrders() {
        const db = getDb();
        
        const orders = await db.all(
            `SELECT * FROM orders ORDER BY created_at DESC`
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

    static async updateStatus(orderId, newStatus) {
        const db = getDb();
        await db.run(
            `UPDATE orders SET status = ? WHERE id = ?`,
            [newStatus, orderId]
        );
    }
}

module.exports = OrderModel;