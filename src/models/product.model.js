const getDb = require('../config/database');

class ProductModel {
    static async ensureDb() {
        let db = getDb();
        if (!db) {
            db = await getDb.init();
        }
        return db;
    }

    static async create(productData) {
        const db = await ProductModel.ensureDb();
        const { seller_id, title, description, price, stock_quantity, image_url, category_id = null } = productData;
        
        const result = await db.run(
            `INSERT INTO products (seller_id, title, description, price, stock_quantity, image_url, category_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [seller_id, title, description, price, stock_quantity, image_url, category_id]
        );
        return result.lastID;
    }

    static async getAll(searchQuery = '', categoryId = null) {
        const db = await ProductModel.ensureDb();
        
        let query = `
            SELECT p.*, u.first_name || ' ' || u.last_name AS seller_name, c.name AS category_name
            FROM products p
            JOIN users u ON p.seller_id = u.id
            LEFT JOIN categories c ON p.category_id = c.id
        `;
        const params = [];
        const conditions = [];

        if (searchQuery) {
            conditions.push(`(p.title LIKE ? OR p.description LIKE ?)`);
            params.push(`%${searchQuery}%`, `%${searchQuery}%`);
        }

        if (categoryId) {
            conditions.push(`p.category_id = ?`);
            params.push(categoryId);
        }

        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(' AND ');
        }

        query += ` ORDER BY p.created_at DESC`;
        
        return await db.all(query, params);
    }

    static async getAllForSeller(sellerId) {
        const db = await ProductModel.ensureDb();
        return await db.all(
            `SELECT p.*, c.name AS category_name
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.seller_id = ?
             ORDER BY p.created_at DESC`,
            [sellerId]
        );
    }

    static async updateById(productId, productData) {
        const db = await ProductModel.ensureDb();
        const {
            title,
            description,
            price,
            stock_quantity,
            image_url,
            category_id = null
        } = productData;

        await db.run(
            `UPDATE products
             SET title = ?, description = ?, price = ?, stock_quantity = ?, image_url = ?, category_id = ?
             WHERE id = ?`,
            [title, description, price, stock_quantity, image_url, category_id, productId]
        );
    }

    static async deleteById(productId) {
        const db = await ProductModel.ensureDb();
        await db.run(`DELETE FROM products WHERE id = ?`, [productId]);
    }

    static async getById(productId) {
        const db = await ProductModel.ensureDb();
        return await db.get(`SELECT * FROM products WHERE id = ?`, [productId]);
    }
}

module.exports = ProductModel;