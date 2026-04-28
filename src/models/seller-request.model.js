const getDb = require('../config/database');

class SellerRequestModel {
    static async createOrUpdate(userId, data) {
        const db = getDb();
        const existing = await db.get(
            `SELECT id FROM seller_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
            [userId]
        );

        if (existing) {
            await db.run(
                `UPDATE seller_requests
                 SET store_name = ?, phone = ?, address = ?, city = ?, country = ?, description = ?, store_image = ?, status = 'pending', admin_note = NULL
                 WHERE id = ?`,
                [data.store_name, data.phone, data.address, data.city, data.country, data.description, data.store_image || null, existing.id]
            );
            return existing.id;
        }

        const result = await db.run(
            `INSERT INTO seller_requests (user_id, store_name, phone, address, city, country, description, store_image, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [userId, data.store_name, data.phone, data.address, data.city, data.country, data.description, data.store_image || null]
        );
        return result.lastID;
    }

    static async getLatestForUser(userId) {
        const db = getDb();
        return db.get(
            `SELECT * FROM seller_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
            [userId]
        );
    }

    static async getAllWithStats() {
        const db = getDb();
        return db.all(`
            SELECT u.id AS user_id, u.first_name, u.last_name, u.email, u.phone, u.profile_picture,
                   u.address, u.city, u.country, u.created_at, u.role, u.seller_status,
                   u.store_name, u.store_description,
                   sr.id AS request_id, sr.store_name AS request_store_name, sr.description AS request_description,
                   sr.store_image, sr.status AS request_status, sr.created_at AS request_created_at,
                   COALESCE(ps.product_count, 0) AS product_count,
                   COALESCE(ps.pending_products, 0) AS pending_products,
                   COALESCE(ps.approved_products, 0) AS approved_products,
                   COALESCE(ps.rejected_products, 0) AS rejected_products,
                   COALESCE(os.order_count, 0) AS order_count,
                   COALESCE(os.total_sales, 0) AS total_sales,
                   COALESCE(rs.rating_average, 0) AS rating_average
            FROM users u
            LEFT JOIN (
                SELECT x.*
                FROM seller_requests x
                JOIN (
                    SELECT user_id, MAX(id) AS id
                    FROM seller_requests
                    GROUP BY user_id
                ) latest ON latest.id = x.id
            ) sr ON sr.user_id = u.id
            LEFT JOIN (
                SELECT seller_id,
                       COUNT(*) AS product_count,
                       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_products,
                       SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_products,
                       SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_products
                FROM products
                GROUP BY seller_id
            ) ps ON ps.seller_id = u.id
            LEFT JOIN (
                SELECT p.seller_id,
                       COUNT(DISTINCT o.id) AS order_count,
                       SUM(CASE WHEN o.status != 'Cancelled' THEN oi.quantity * oi.price_at_purchase ELSE 0 END) AS total_sales
                FROM order_items oi
                JOIN orders o ON o.id = oi.order_id
                JOIN products p ON p.id = oi.product_id
                GROUP BY p.seller_id
            ) os ON os.seller_id = u.id
            LEFT JOIN (
                SELECT p.seller_id, AVG(r.rating) AS rating_average
                FROM reviews r
                JOIN products p ON p.id = r.product_id
                GROUP BY p.seller_id
            ) rs ON rs.seller_id = u.id
            WHERE u.role = 'seller' OR sr.id IS NOT NULL
            ORDER BY COALESCE(sr.created_at, u.created_at) DESC
        `);
    }

    static async updateStatus(requestId, status, adminNote = '') {
        const validStatuses = ['pending', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) throw new Error('Invalid seller request status');

        const db = getDb();
        const request = await db.get(`SELECT * FROM seller_requests WHERE id = ?`, [requestId]);
        if (!request) throw new Error('Seller request not found');

        await db.run(
            `UPDATE seller_requests SET status = ?, admin_note = ? WHERE id = ?`,
            [status, adminNote, requestId]
        );

        if (status === 'approved') {
            await db.run(
                `UPDATE users
                 SET role = 'seller', seller_status = 'approved_seller',
                     store_name = ?, store_description = ?,
                     phone = COALESCE(NULLIF(?, ''), phone),
                     address = COALESCE(NULLIF(?, ''), address),
                     city = COALESCE(NULLIF(?, ''), city),
                     country = COALESCE(NULLIF(?, ''), country),
                     profile_picture = COALESCE(NULLIF(?, ''), profile_picture)
                 WHERE id = ?`,
                [request.store_name, request.description, request.phone, request.address, request.city, request.country, request.store_image, request.user_id]
            );
        } else if (status === 'rejected') {
            await db.run(`UPDATE users SET seller_status = 'rejected' WHERE id = ?`, [request.user_id]);
        }

        return request;
    }
}

module.exports = SellerRequestModel;
