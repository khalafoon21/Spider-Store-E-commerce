const mysql = require('mysql2/promise');

let pool = null;
let dbWrapper = null;

async function initDB() {
    if (dbWrapper) return dbWrapper;

    try {
        // إنشاء الاتصال بقاعدة بيانات MySQL على Railway
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            multipleStatements: true // ضروري لتشغيل أكثر من استعلام مع بعض
        });

        // اختبار الاتصال
        await pool.getConnection();
        console.log('✅ تم الاتصال بقاعدة بيانات MySQL على Railway بنجاح!');

        // الغلاف (Wrapper) عشان باقي كود المشروع يشتغل كأنه SQLite من غير ما تعدل حاجة تانية
        dbWrapper = {
            get: async (sql, params) => {
                const [rows] = await pool.execute(sql, params);
                return rows[0] || null;
            },
            all: async (sql, params) => {
                const [rows] = await pool.execute(sql, params);
                return rows;
            },
            run: async (sql, params) => {
                const [result] = await pool.execute(sql, params);
                return { lastID: result.insertId, changes: result.affectedRows };
            },
            exec: async (sql) => {
                return await pool.query(sql);
            }
        };

        // إنشاء الجداول بنفس الهيكل الخاص بك متوافق مع MySQL
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
            );

            CREATE TABLE IF NOT EXISTS categories (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                icon VARCHAR(100) DEFAULT 'fa-tags'
            );

            CREATE TABLE IF NOT EXISTS tags (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

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
                FOREIGN KEY (seller_id) REFERENCES users(id),
                FOREIGN KEY (category_id) REFERENCES categories(id)
            );

            CREATE TABLE IF NOT EXISTS product_images (
                id INT PRIMARY KEY AUTO_INCREMENT,
                product_id INT NOT NULL,
                image_url TEXT NOT NULL,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            );

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
            );

            CREATE TABLE IF NOT EXISTS cart_items (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            );

            CREATE TABLE IF NOT EXISTS wishlist_items (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                product_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, product_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS orders (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                total_amount DECIMAL(10, 2) NOT NULL,
                status VARCHAR(50) DEFAULT 'Pending', 
                shipping_address TEXT NOT NULL,
                city VARCHAR(100),
                country VARCHAR(100),
                payment_method VARCHAR(50) DEFAULT 'Cash on Delivery',
                notes TEXT,
                phone VARCHAR(50) NOT NULL,          
                full_name VARCHAR(255) NOT NULL,      
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS order_items (
                id INT PRIMARY KEY AUTO_INCREMENT,
                order_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL,
                price_at_purchase DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            );

            CREATE TABLE IF NOT EXISTS reviews (
                id INT PRIMARY KEY AUTO_INCREMENT,
                product_id INT NOT NULL,
                user_id INT NOT NULL,
                rating INT NOT NULL CHECK(rating >= 1 AND rating <= 5),
                comment TEXT,
                reply TEXT, 
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        `);

        // تحديث الحسابات القديمة إن وجدت لتجنب المشاكل (متوافق مع MySQL)
        await dbWrapper.run(`UPDATE users SET role = 'user' WHERE role = 'customer' OR role IS NULL`);
        await dbWrapper.run(`UPDATE users SET seller_status = 'pending' WHERE seller_status IS NULL`);

        return dbWrapper;
    } catch (error) {
        console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error.message);
        throw error;
    }
}

// السحر كله في الـ 4 سطور دول:
const getDb = () => dbWrapper;

// بنربط دالة التهيئة بالدالة دي عشان نقدر نستدعيها من السيرفر قبل ما يشتغل
getDb.init = initDB; 

module.exports = getDb;