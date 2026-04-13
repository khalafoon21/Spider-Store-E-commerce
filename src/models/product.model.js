const getDb = require('../config/database');

class ProductModel {
static async ensureDb() {
        let db = getDb();
        if (!db) {
            db = await getDb.init();
        }

        // ✨ كود تحديث قاعدة البيانات تلقائياً (سيتم تنفيذه وتجاهل الخطأ إذا كانت الأعمدة موجودة بالفعل)
        try {
            await db.run("ALTER TABLE products ADD COLUMN discount REAL DEFAULT 0");
            await db.run("ALTER TABLE products ADD COLUMN brand TEXT");
            await db.run("ALTER TABLE products ADD COLUMN tags TEXT");
            await db.run("ALTER TABLE products ADD COLUMN images TEXT");
            console.log("✅ تم إضافة الأعمدة الجديدة لقاعدة البيانات بنجاح!");
        } catch (e) {
            // تجاهل الخطأ لأن معناه إن الأعمدة متضافة جاهزة قبل كده
        }

        return db;
    }

    // ✨ دالة مساعدة لتحويل النصوص إلى مصفوفات عند جلب الداتا
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
        
        // تحويل مصفوفة الصور لنص (JSON) عشان تتخزن في الداتا بيز
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
        return this.processRows(rows); // إرجاع البيانات بعد معالجة الصور
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
        return this.processRows(rows); // إرجاع البيانات بعد معالجة الصور
    }

    static async updateById(productId, productData) {
        const db = await ProductModel.ensureDb();
        const {
            title, description, price, stock_quantity, image_url, category_id = null
        } = productData;

        // لتحديث الأساسيات حالياً (يمكنك تطويرها لاحقاً لتشمل تعديل الصور المتعددة)
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
        const row = await db.get(`SELECT * FROM products WHERE id = ?`, [productId]);
        if(row) {
            return this.processRows([row])[0]; // فك تشفير الصور لو المنتج موجود
        }
        return row;
    }
}

module.exports = ProductModel;