const getDb = require('../config/database');
const CartModel = require('./cart.model');

function toMoney(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function makeConnectionDb(connection) {
    return {
        get: async (sql, params = []) => {
            const [rows] = await connection.execute(sql, params);
            return rows[0] || null;
        },
        all: async (sql, params = []) => {
            const [rows] = await connection.execute(sql, params);
            return rows;
        },
        run: async (sql, params = []) => {
            const [result] = await connection.execute(sql, params);
            return {
                lastID: result.insertId || null,
                changes: result.affectedRows || 0
            };
        }
    };
}

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
            totalAmount += toMoney(item.total_price);
        });

        // التعديل 2: إضافة مصاريف الشحن للإجمالي عشان يتطابق مع اللي اليوزر شافه في الـ Checkout
        totalAmount = toMoney(totalAmount) + 50; 

        const connection = await db.pool.getConnection();

        try {
            await connection.beginTransaction();
            const tx = makeConnectionDb(connection);

            for (const item of cartItems) {
                const product = await tx.get(
                    `SELECT stock_quantity FROM products WHERE id = ? FOR UPDATE`,
                    [item.product_id]
                );

                if (!product || product.stock_quantity < item.quantity) {
                    throw new Error(`Product "${item.title}" does not have enough stock.`);
                }
            }

            const orderResult = await tx.run(
                `INSERT INTO orders (user_id, total_amount, shipping_address, phone, full_name) VALUES (?, ?, ?, ?, ?)`,
                [userId, totalAmount, shippingAddress, phone, fullName]
            );
            const orderId = orderResult.lastID;

        // تسجيل المنتجات داخل الطلب
            for (const item of cartItems) {
            // حساب سعر القطعة الواحدة لحظة الشراء (لتسجيلها في الفاتورة التاريخية بشكل صحيح)
            const price = toMoney(item.price);
            const discount = toMoney(item.discount);
            const finalPrice = discount > 0 ? price - (price * discount / 100) : price;
            
                await tx.run(
                    `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)`,
                    [orderId, item.product_id, item.quantity, finalPrice]
                );

                const stockUpdate = await tx.run(
                    `UPDATE products
                     SET stock_quantity = stock_quantity - ?
                     WHERE id = ? AND stock_quantity >= ?`,
                    [item.quantity, item.product_id, item.quantity]
                );

                if (!stockUpdate.changes) {
                    throw new Error(`Product "${item.title}" does not have enough stock.`);
                }
            }

        // مسح السلة بعد نجاح الطلب 100%
            await tx.run(`DELETE FROM cart_items WHERE user_id = ?`, [userId]);
            await connection.commit();

            return orderId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
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
                SELECT oi.product_id, oi.quantity, oi.price_at_purchase, oi.seller_status,
                       p.title, p.image_url, p.seller_id,
                       CONCAT(u.first_name, ' ', u.last_name) AS seller_name
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                JOIN users u ON u.id = p.seller_id
                WHERE oi.order_id = ?
            `, [order.id]);
            
            order.items = items;
            order.subtotal = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.price_at_purchase), 0);
            order.shipping_amount = Math.max(0, Number(order.total_amount || 0) - order.subtotal);
            const shipments = {};
            items.forEach(item => {
                const key = item.seller_id;
                if (!shipments[key]) {
                    shipments[key] = {
                        seller_id: item.seller_id,
                        seller_name: item.seller_name,
                        seller_status: item.seller_status || 'pending_review',
                        subtotal: 0,
                        items: []
                    };
                }
                shipments[key].subtotal += Number(item.quantity) * Number(item.price_at_purchase);
                shipments[key].items.push(item);
            });
            order.seller_shipments = Object.values(shipments);
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
                SELECT oi.product_id, oi.quantity, oi.price_at_purchase, oi.seller_status,
                       p.title, p.image_url, p.seller_id,
                       CONCAT(u.first_name, ' ', u.last_name) AS seller_name
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                JOIN users u ON u.id = p.seller_id
                WHERE oi.order_id = ?
            `, [order.id]);
            
            order.items = items;
            order.subtotal = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.price_at_purchase), 0);
            order.shipping_amount = Math.max(0, Number(order.total_amount || 0) - order.subtotal);
        }
        
        return orders;
    }

    static async getOrdersForSeller(sellerId) {
        const db = getDb();

        const orders = await db.all(`
            SELECT DISTINCT o.*
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
            JOIN products p ON p.id = oi.product_id
            WHERE p.seller_id = ?
            ORDER BY o.created_at DESC
        `, [sellerId]);

        for (let order of orders) {
            const items = await db.all(`
                SELECT oi.product_id, oi.quantity, oi.price_at_purchase, oi.seller_status,
                       p.title, p.image_url, p.seller_id
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ? AND p.seller_id = ?
            `, [order.id, sellerId]);

            order.items = items;
            order.seller_subtotal = items.reduce(
                (sum, item) => sum + (Number(item.quantity) * Number(item.price_at_purchase)),
                0
            );
            order.seller_status = this.resolveSellerStatus(items.map(item => item.seller_status));
            const orderTotals = await db.get(`
                SELECT COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) AS subtotal
                FROM order_items oi
                WHERE oi.order_id = ?
            `, [order.id]);
            order.order_subtotal = Number(orderTotals && orderTotals.subtotal || 0);
            order.shipping_amount = Math.max(0, Number(order.total_amount || 0) - order.order_subtotal);
            order.seller_total_with_shipping = Number(order.seller_subtotal || 0) + Number(order.shipping_amount || 0);
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

    static resolveSellerStatus(statuses) {
        const clean = statuses.filter(Boolean);
        if (!clean.length) return 'pending_review';
        return clean.every(status => status === clean[0]) ? clean[0] : 'mixed';
    }

    static async updateSellerOrderStatus(orderId, sellerId, newStatus) {
        const validStatuses = ['pending_review', 'processing', 'shipped', 'delivered'];
        if (!validStatuses.includes(newStatus)) throw new Error('Invalid seller order status');

        const db = getDb();
        const ownedItems = await db.get(`
            SELECT COUNT(*) AS count
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id = ? AND p.seller_id = ?
        `, [orderId, sellerId]);

        if (!ownedItems || Number(ownedItems.count || 0) === 0) {
            throw new Error('Seller order segment not found');
        }

        await db.run(`
            UPDATE order_items oi
            JOIN products p ON p.id = oi.product_id
            SET oi.seller_status = ?
            WHERE oi.order_id = ? AND p.seller_id = ?
        `, [newStatus, orderId, sellerId]);
    }

    static async getById(orderId) {
        const db = getDb();
        return db.get(`SELECT * FROM orders WHERE id = ?`, [orderId]);
    }

    static async cancelOrder(orderId, userId = null) {
        const db = getDb();
        const connection = await db.pool.getConnection();
        try {
            await connection.beginTransaction();
            const tx = makeConnectionDb(connection);
            const order = userId
                ? await tx.get(`SELECT * FROM orders WHERE id = ? AND user_id = ? FOR UPDATE`, [orderId, userId])
                : await tx.get(`SELECT * FROM orders WHERE id = ? FOR UPDATE`, [orderId]);

            if (!order) throw new Error('Order not found');
            if (order.status === 'Delivered') throw new Error('Delivered orders cannot be cancelled');
            if (order.status === 'Shipped' && userId) throw new Error('Shipped orders cannot be cancelled by customer');
            if (order.status === 'Cancelled') {
                await connection.commit();
                return order;
            }

            const items = await tx.all(`SELECT product_id, quantity FROM order_items WHERE order_id = ?`, [orderId]);
            for (const item of items) {
                await tx.run(
                    `UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?`,
                    [item.quantity, item.product_id]
                );
            }

            await tx.run(`UPDATE orders SET status = 'Cancelled' WHERE id = ?`, [orderId]);
            await connection.commit();
            return { ...order, status: 'Cancelled' };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getAnalytics() {
        const db = getDb();
        const totals = await db.get(`
            SELECT
                COALESCE(SUM(CASE WHEN status != 'Cancelled' THEN total_amount ELSE 0 END), 0) AS total_sales,
                COUNT(*) AS order_count
            FROM orders
        `);
        const products = await db.get(`SELECT COUNT(*) AS product_count FROM products`);
        const users = await db.get(`SELECT COUNT(*) AS user_count FROM users`);
        const latestOrders = await db.all(`SELECT * FROM orders ORDER BY created_at DESC LIMIT 5`);
        const bestProducts = await db.all(`
            SELECT p.id, p.title, p.image_url, SUM(oi.quantity) AS sold_quantity,
                   SUM(oi.quantity * oi.price_at_purchase) AS sales_total
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            JOIN orders o ON o.id = oi.order_id
            WHERE o.status != 'Cancelled'
            GROUP BY p.id, p.title, p.image_url
            ORDER BY sold_quantity DESC
            LIMIT 5
        `);

        return {
            total_sales: totals.total_sales || 0,
            order_count: totals.order_count || 0,
            product_count: products.product_count || 0,
            user_count: users.user_count || 0,
            latest_orders: latestOrders,
            best_products: bestProducts
        };
    }

    static async getSellerAnalytics(sellerId) {
        const db = getDb();

        const totals = await db.get(`
            SELECT
                COALESCE(SUM(CASE WHEN o.status != 'Cancelled' THEN oi.quantity * oi.price_at_purchase ELSE 0 END), 0) AS total_sales,
                COUNT(DISTINCT CASE WHEN o.status != 'Cancelled' THEN o.id END) AS total_orders
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            JOIN products p ON p.id = oi.product_id
            WHERE p.seller_id = ?
        `, [sellerId]);

        const products = await db.get(
            `SELECT COUNT(*) AS product_count FROM products WHERE seller_id = ?`,
            [sellerId]
        );

        const latestOrders = await db.all(`
            SELECT DISTINCT o.id, o.status, o.created_at, o.full_name, o.phone, o.shipping_address
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
            JOIN products p ON p.id = oi.product_id
            WHERE p.seller_id = ?
            ORDER BY o.created_at DESC
            LIMIT 5
        `, [sellerId]);

        const bestProducts = await db.all(`
            SELECT p.id, p.title, p.image_url,
                   COALESCE(SUM(oi.quantity), 0) AS sold_quantity,
                   COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) AS sales_total
            FROM products p
            JOIN order_items oi ON oi.product_id = p.id
            JOIN orders o ON o.id = oi.order_id
            WHERE p.seller_id = ? AND o.status != 'Cancelled'
            GROUP BY p.id, p.title, p.image_url
            ORDER BY sold_quantity DESC
            LIMIT 5
        `, [sellerId]);

        const lowStockProducts = await db.all(`
            SELECT id, title, image_url, stock_quantity
            FROM products
            WHERE seller_id = ? AND stock_quantity <= 5
            ORDER BY stock_quantity ASC, created_at DESC
            LIMIT 5
        `, [sellerId]);

        return {
            total_sales: totals.total_sales || 0,
            total_orders: totals.total_orders || 0,
            product_count: products.product_count || 0,
            latest_orders: latestOrders,
            best_products: bestProducts,
            low_stock_products: lowStockProducts
        };
    }
}

module.exports = OrderModel;
