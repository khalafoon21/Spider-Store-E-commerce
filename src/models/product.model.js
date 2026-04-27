const getDb = require('../config/database');

class ProductModel {
    static async ensureDb() {
        let db = getDb();
        if (!db) {
            db = await getDb.init();
        }

        // ✨ التعديل السحري: فحص وإضافة كل عمود لوحده عشان لو واحد موجود ميعطلش الباقي
        const alterQueries = [
            "ALTER TABLE products ADD COLUMN discount REAL DEFAULT 0",
            "ALTER TABLE products ADD COLUMN brand TEXT",
            "ALTER TABLE products ADD COLUMN tags TEXT",
            "ALTER TABLE products ADD COLUMN images TEXT"
        ];

        for (let query of alterQueries) {
            try {
                await db.run(query);
            } catch (e) {
                // لو العمود ده بالذات موجود، تجاهل الخطأ وكمل للي بعده
            }
        }

        return db;
    }

    static processRows(rows) {
        return rows.map(row => {
            if (row.images) {
                try { row.images_array = JSON.parse(row.images); } 
                catch (e) { row.images_array = []; }
            } else {
                row.images_array = [];
            }
            return row;
        });
    }

    static async create(productData) {
        const db = await ProductModel.ensureDb();
        const { 
            seller_id, title, description, price, stock_quantity, image_url, category_id = null,
            discount = 0, brand = '', tags = '', additional_images = []
        } = productData;
        
        const imagesJson = JSON.stringify(additional_images);

        const result = await db.run(
            `INSERT INTO products (seller_id, title, description, price, stock_quantity, image_url, category_id, discount, brand, tags, images) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [seller_id, title, description, price, stock_quantity, image_url, category_id, discount, brand, tags, imagesJson]
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
        
        const rows = await db.all(query, params);
        return this.processRows(rows);
    }

    static async getAllForSeller(sellerId) {
        const db = await ProductModel.ensureDb();
        const rows = await db.all(
            `SELECT p.*, c.name AS category_name
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.seller_id = ?
             ORDER BY p.created_at DESC`,
            [sellerId]
        );
        return this.processRows(rows);
    }

    static async updateById(productId, productData) {
        const db = await ProductModel.ensureDb();
        const {
            title, description, price, stock_quantity, image_url, category_id = null,
            discount = 0, brand = '', tags = ''
        } = productData;

        await db.run(
            `UPDATE products
             SET title = ?, description = ?, price = ?, stock_quantity = ?, image_url = ?, category_id = ?, discount = ?, brand = ?, tags = ?
             WHERE id = ?`,
            [title, description, price, stock_quantity, image_url, category_id, discount, brand, tags, productId]
        );
    }

    static async deleteById(productId) {
        const db = await ProductModel.ensureDb();
        await db.run(`DELETE FROM products WHERE id = ?`, [productId]);
    }

    static async getById(productId) {
        const db = await ProductModel.ensureDb();
        const row = await db.get(`SELECT * FROM products WHERE id = ?`, [productId]);
        if(row) {
            return this.processRows([row])[0]; 
        }
        return row;
    }
}

module.exports = ProductModel;
