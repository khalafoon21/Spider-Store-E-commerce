const getDb = require('../config/database');

class ProductModel {
    static async ensureDb() {
        let db = getDb();
        if (!db) {
            db = await getDb.init();
        }

        // ✨ التعديل السحري: فحص وإضافة كل عمود لوحده عشان لو واحد موجود ميعطلش الباقي
        const alterQueries = [
            "ALTER TABLE products ADD COLUMN discount DECIMAL(10, 2) DEFAULT 0",
            "ALTER TABLE products ADD COLUMN brand VARCHAR(100)",
            "ALTER TABLE products ADD COLUMN tags TEXT",
            "ALTER TABLE products ADD COLUMN status VARCHAR(50) DEFAULT 'approved'",
            "ALTER TABLE products ADD COLUMN featured TINYINT(1) DEFAULT 0",
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
            const images = [];
            const pushImage = image => {
                const clean = String(image || '').trim();
                if (clean && !images.includes(clean)) images.push(clean);
            };

            pushImage(row.image_url || row.image);

            if (row.images) {
                try {
                    const parsed = JSON.parse(row.images);
                    if (Array.isArray(parsed)) parsed.forEach(pushImage);
                    else pushImage(parsed);
                } catch (e) {
                    String(row.images).split(/[,\n]/).forEach(pushImage);
                }
            }

            if (Array.isArray(row.images_array)) row.images_array.forEach(pushImage);
            row.image_url = row.image_url || images[0] || '';
            row.image = row.image_url;
            row.images_array = images;
            row.images_list = images;
            row.images_json = JSON.stringify(images);
            row.rating_average = Number(row.rating_average || 0);
            row.rating_count = Number(row.rating_count || 0);
            return row;
        });
    }

    static async create(productData) {
        const db = await ProductModel.ensureDb();
        const { 
            seller_id, title, description, price, stock_quantity, image_url, category_id = null,
            discount = 0, brand = '', tags = '', additional_images = [], status = 'approved', featured = 0
        } = productData;
        
        const limitedImages = (Array.isArray(additional_images) ? additional_images : []).slice(0, 7);
        const imagesJson = JSON.stringify(limitedImages);

        const result = await db.run(
            `INSERT INTO products (seller_id, title, description, price, stock_quantity, image_url, category_id, discount, brand, tags, status, featured, images) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [seller_id, title, description, price, stock_quantity, image_url, category_id, discount, brand, tags, status, featured ? 1 : 0, imagesJson]
        );
        return result.lastID;
    }

    static async getAll(searchQuery = '', categoryId = null, options = {}) {
        const db = await ProductModel.ensureDb();
        
        let query = `
            SELECT p.*, CONCAT(u.first_name, ' ', u.last_name) AS seller_name,
                   u.role AS owner_role, u.seller_status, c.name AS category_name,
                   COALESCE(rs.rating_average, 0) AS rating_average,
                   COALESCE(rs.rating_count, 0) AS rating_count
            FROM products p
            JOIN users u ON p.seller_id = u.id
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN (
                SELECT product_id, AVG(rating) AS rating_average, COUNT(*) AS rating_count
                FROM reviews
                GROUP BY product_id
            ) rs ON rs.product_id = p.id
        `;
        const params = [];
        const conditions = [];

        if (options.publicOnly !== false) {
            conditions.push(`COALESCE(p.status, 'approved') = 'approved'`);
        }

        if (options.featuredOnly) {
            conditions.push(`COALESCE(p.featured, 0) = 1`);
        }

        if (options.status) {
            conditions.push(`COALESCE(p.status, 'approved') = ?`);
            params.push(options.status);
        }

        if (searchQuery) {
            conditions.push(`(p.title LIKE ? OR p.description LIKE ? OR p.brand LIKE ? OR p.tags LIKE ?)`);
            params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
        }

        if (categoryId) {
            conditions.push(`p.category_id = ?`);
            params.push(categoryId);
        }

        if (options.brand) {
            conditions.push(`p.brand LIKE ?`);
            params.push(`%${options.brand}%`);
        }

        if (options.tag) {
            conditions.push(`p.tags LIKE ?`);
            params.push(`%${options.tag}%`);
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
            `SELECT p.*, c.name AS category_name,
                    COALESCE(rs.rating_average, 0) AS rating_average,
                    COALESCE(rs.rating_count, 0) AS rating_count
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             LEFT JOIN (
                SELECT product_id, AVG(rating) AS rating_average, COUNT(*) AS rating_count
                FROM reviews
                GROUP BY product_id
             ) rs ON rs.product_id = p.id
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
            discount = 0, brand = '', tags = '', status = 'approved', featured = 0, additional_images = undefined
        } = productData;

        const setImages = Array.isArray(additional_images);

        await db.run(
            `UPDATE products
             SET title = ?, description = ?, price = ?, stock_quantity = ?, image_url = ?, category_id = ?, discount = ?, brand = ?, tags = ?, status = ?, featured = ?${setImages ? ', images = ?' : ''}
             WHERE id = ?`,
            setImages
                ? [title, description, price, stock_quantity, image_url, category_id, discount, brand, tags, status, featured ? 1 : 0, JSON.stringify(additional_images.slice(0, 7)), productId]
                : [title, description, price, stock_quantity, image_url, category_id, discount, brand, tags, status, featured ? 1 : 0, productId]
        );
    }

    static async updateStatusById(productId, status) {
        const db = await ProductModel.ensureDb();
        await db.run(
            `UPDATE products SET status = ? WHERE id = ?`,
            [status, productId]
        );
    }

    static async updateFeaturedById(productId, featured) {
        const db = await ProductModel.ensureDb();
        await db.run(
            `UPDATE products SET featured = ? WHERE id = ?`,
            [featured ? 1 : 0, productId]
        );
    }

    static async deleteById(productId) {
        const db = await ProductModel.ensureDb();
        await db.run(`DELETE FROM products WHERE id = ?`, [productId]);
    }

    static async getById(productId) {
        const db = await ProductModel.ensureDb();
        const row = await db.get(`
            SELECT p.*, CONCAT(u.first_name, ' ', u.last_name) AS seller_name,
                   u.role AS owner_role, u.seller_status, c.name AS category_name,
                   COALESCE(rs.rating_average, 0) AS rating_average,
                   COALESCE(rs.rating_count, 0) AS rating_count
            FROM products p
            JOIN users u ON p.seller_id = u.id
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN (
                SELECT product_id, AVG(rating) AS rating_average, COUNT(*) AS rating_count
                FROM reviews
                GROUP BY product_id
            ) rs ON rs.product_id = p.id
            WHERE p.id = ?
        `, [productId]);
        if(row) {
            const product = this.processRows([row])[0];
            product.rating_breakdown = await this.getRatingBreakdown(productId);
            return product; 
        }
        return row;
    }

    static async getRatingBreakdown(productId) {
        const db = await ProductModel.ensureDb();
        const rows = await db.all(
            `SELECT rating, COUNT(*) AS count
             FROM reviews
             WHERE product_id = ?
             GROUP BY rating`,
            [productId]
        );
        const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        rows.forEach(row => {
            breakdown[Number(row.rating)] = Number(row.count || 0);
        });
        return breakdown;
    }
}

module.exports = ProductModel;
