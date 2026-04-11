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
        const { seller_id, title, description, price, stock_quantity, image_url } = productData;
        
        const result = await db.run(
            `INSERT INTO products (seller_id, title, description, price, stock_quantity, image_url) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [seller_id, title, description, price, stock_quantity, image_url]
        );
        return result.lastID;
    }

    // خلينا دالة واحدة بس بتعالج البحث وبدون بحث
    static async getAll(searchQuery = '') {
        const db = await ProductModel.ensureDb();
        
        let query = `
            SELECT p.*, u.first_name || ' ' || u.last_name AS seller_name 
            FROM products p
            JOIN users u ON p.seller_id = u.id
        `;
        let params = [];

        if (searchQuery) {
            query += ` WHERE p.title LIKE ? OR p.description LIKE ?`;
            params.push(`%${searchQuery}%`, `%${searchQuery}%`);
        }

        query += ` ORDER BY p.created_at DESC`;
        
        return await db.all(query, params);
    }
}

module.exports = ProductModel;