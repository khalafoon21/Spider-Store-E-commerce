const mysql = require('mysql2/promise');

let pool = null;
let dbWrapper = null;

function checkRequiredEnv() {
    const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(
            `Missing required database environment variables: ${missing.join(', ')}`
        );
    }
}

// تحويل تواريخ JavaScript / ISO إلى صيغة MySQL DATETIME
function normalizeParams(params = []) {
    return params.map((value) => {
        if (value instanceof Date) {
            return value.toISOString().slice(0, 19).replace('T', ' ');
        }

        if (
            typeof value === 'string' &&
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
        ) {
            return value.slice(0, 19).replace('T', ' ');
        }

        return value;
    });
}

async function initDB() {
    if (dbWrapper) return dbWrapper;

    try {
        checkRequiredEnv();

        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: Number(process.env.DB_PORT) || 3306,

            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,

            multipleStatements: true,
            charset: 'utf8mb4'
        });

        const connection = await pool.getConnection();
        connection.release();

        console.log('✅ تم الاتصال بقاعدة بيانات MySQL على Railway بنجاح!');

        dbWrapper = {
            get: async (sql, params = []) => {
                const [rows] = await pool.execute(sql, normalizeParams(params));
                return rows[0] || null;
            },

            all: async (sql, params = []) => {
                const [rows] = await pool.execute(sql, normalizeParams(params));
                return rows;
            },

            run: async (sql, params = []) => {
                const [result] = await pool.execute(sql, normalizeParams(params));

                return {
                    lastID: result.insertId || null,
                    changes: result.affectedRows || 0
                };
            },

            exec: async (sql) => {
                const [result] = await pool.query(sql);
                return result;
            },

            pool
        };

        await dbWrapper.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                first_name VARCHAR(255) NOT NULL,
                last_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                role VARCHAR(50) DEFAULT 'user',
                seller_status VARCHAR(50) DEFAULT 'pending',
                profile_picture TEXT,
                email_verified TINYINT(1) DEFAULT 1,
                activation_token VARCHAR(255),
                activation_expires DATETIME,
                reset_token VARCHAR(255),
                reset_expires DATETIME,
                address TEXT,
                birthdate DATE,
                city VARCHAR(100),
                country VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE TABLE IF NOT EXISTS categories (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                icon VARCHAR(100) DEFAULT 'fa-tags'
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE TABLE IF NOT EXISTS tags (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE TABLE IF NOT EXISTS products (
                id INT PRIMARY KEY AUTO_INCREMENT,
                seller_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2) NOT NULL,
                discount DECIMAL(10, 2) DEFAULT 0,
                stock_quantity INT NOT NULL DEFAULT 0,
                image_url TEXT,
                category_id INT,
                brand VARCHAR(100),
                tags TEXT,
                status VARCHAR(50) DEFAULT 'approved',
                featured TINYINT(1) DEFAULT 0,
                images TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                INDEX idx_products_seller_id (seller_id),
                INDEX idx_products_category_id (category_id),
                INDEX idx_products_status (status),

                CONSTRAINT fk_products_seller
                    FOREIGN KEY (seller_id) REFERENCES users(id)
                    ON DELETE CASCADE,

                CONSTRAINT fk_products_category
                    FOREIGN KEY (category_id) REFERENCES categories(id)
                    ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE TABLE IF NOT EXISTS product_images (
                id INT PRIMARY KEY AUTO_INCREMENT,
                product_id INT NOT NULL,
                image_url TEXT NOT NULL,

                INDEX idx_product_images_product_id (product_id),

                CONSTRAINT fk_product_images_product
                    FOREIGN KEY (product_id) REFERENCES products(id)
                    ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE TABLE IF NOT EXISTS banners (
                id INT PRIMARY KEY AUTO_INCREMENT,
                title VARCHAR(255),
                description TEXT,
                image_url TEXT NOT NULL,
                bg_color VARCHAR(50) DEFAULT '#ffffff',
                text_color VARCHAR(50) DEFAULT '#1f2937',
                button_text VARCHAR(100) DEFAULT 'اكتشف الآن',
                button_color VARCHAR(50) DEFAULT '#0891b2',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE TABLE IF NOT EXISTS cart_items (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                INDEX idx_cart_user_id (user_id),
                INDEX idx_cart_product_id (product_id),

                CONSTRAINT fk_cart_user
                    FOREIGN KEY (user_id) REFERENCES users(id)
                    ON DELETE CASCADE,

                CONSTRAINT fk_cart_product
                    FOREIGN KEY (product_id) REFERENCES products(id)
                    ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE TABLE IF NOT EXISTS wishlist_items (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                product_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                UNIQUE KEY unique_wishlist_item (user_id, product_id),
                INDEX idx_wishlist_user_id (user_id),
                INDEX idx_wishlist_product_id (product_id),

                CONSTRAINT fk_wishlist_user
                    FOREIGN KEY (user_id) REFERENCES users(id)
                    ON DELETE CASCADE,

                CONSTRAINT fk_wishlist_product
                    FOREIGN KEY (product_id) REFERENCES products(id)
                    ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE TABLE IF NOT EXISTS orders (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                total_amount DECIMAL(10, 2) NOT NULL,
                status VARCHAR(50) DEFAULT 'Pending',
                shipping_address TEXT NOT NULL,
                city VARCHAR(100),
                country VARCHAR(100),
                payment_method VARCHAR(100) DEFAULT 'Cash on Delivery',
                notes TEXT,
                phone VARCHAR(50) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                INDEX idx_orders_user_id (user_id),
                INDEX idx_orders_status (status),

                CONSTRAINT fk_orders_user
                    FOREIGN KEY (user_id) REFERENCES users(id)
                    ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE TABLE IF NOT EXISTS order_items (
                id INT PRIMARY KEY AUTO_INCREMENT,
                order_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL,
                price_at_purchase DECIMAL(10, 2) NOT NULL,

                INDEX idx_order_items_order_id (order_id),
                INDEX idx_order_items_product_id (product_id),

                CONSTRAINT fk_order_items_order
                    FOREIGN KEY (order_id) REFERENCES orders(id)
                    ON DELETE CASCADE,

                CONSTRAINT fk_order_items_product
                    FOREIGN KEY (product_id) REFERENCES products(id)
                    ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE TABLE IF NOT EXISTS reviews (
                id INT PRIMARY KEY AUTO_INCREMENT,
                product_id INT NOT NULL,
                user_id INT NOT NULL,
                rating INT NOT NULL,
                comment TEXT,
                reply TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                INDEX idx_reviews_product_id (product_id),
                INDEX idx_reviews_user_id (user_id),

                CONSTRAINT chk_reviews_rating
                    CHECK (rating >= 1 AND rating <= 5),

                CONSTRAINT fk_reviews_product
                    FOREIGN KEY (product_id) REFERENCES products(id)
                    ON DELETE CASCADE,

                CONSTRAINT fk_reviews_user
                    FOREIGN KEY (user_id) REFERENCES users(id)
                    ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await dbWrapper.run(`
            UPDATE users
            SET role = 'user'
            WHERE role = 'customer' OR role IS NULL
        `);

        await dbWrapper.run(`
            UPDATE users
            SET seller_status = 'pending'
            WHERE seller_status IS NULL
        `);

        console.log('✅ تم تجهيز جداول MySQL بنجاح!');

        return dbWrapper;
    } catch (error) {
        console.error('❌ خطأ في الاتصال أو تجهيز قاعدة بيانات MySQL:', error.message);
        throw error;
    }
}

const getDb = () => dbWrapper;

getDb.init = initDB;

module.exports = getDb;