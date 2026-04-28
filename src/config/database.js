const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const dbPath = path.join(__dirname, '../../database.sqlite');

let dbInstance = null;

// غيرنا اسم الدالة لـ initDB عشان تكون واضحة
async function initDB() {
    try {
        const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

       await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                phone TEXT,
                role TEXT DEFAULT 'customer',
                profile_picture TEXT,
                email_verified INTEGER DEFAULT 1,
                activation_token TEXT,
                activation_expires DATETIME,
                reset_token TEXT,
                reset_expires DATETIME,
                address TEXT,        /* ✨ جديد: العنوان */
                birthdate DATE,      /* ✨ جديد: تاريخ الميلاد */
                city TEXT,           /* ✨ جديد: المدينة */
                country TEXT,        /* ✨ جديد: البلد */
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                icon TEXT DEFAULT 'fa-tags'
            );

            CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                seller_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                discount REAL DEFAULT 0,    /* ✨ جديد: نسبة الخصم الاختيارية */
                stock_quantity INTEGER NOT NULL DEFAULT 0,
                image_url TEXT,             /* الصورة الأساسية */
                category_id INTEGER,
                brand TEXT,                 /* ✨ جديد: العلامة التجارية */
                tags TEXT,                  /* ✨ جديد: الكلمات المفتاحية */
                status TEXT DEFAULT 'approved',
                featured INTEGER DEFAULT 0,
                images TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (seller_id) REFERENCES users(id),
                FOREIGN KEY (category_id) REFERENCES categories(id)
            );

            /* ✨ جديد: جدول لصور المنتج الإضافية (عشان السلايدر Slider) */
            CREATE TABLE IF NOT EXISTS product_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                image_url TEXT NOT NULL,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS banners (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                description TEXT,
                image_url TEXT NOT NULL,
                bg_color TEXT DEFAULT '#ffffff',
                text_color TEXT DEFAULT '#1f2937',
                button_text TEXT DEFAULT 'اكتشف الآن',
                button_color TEXT DEFAULT '#0891b2',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS cart_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            );

            CREATE TABLE IF NOT EXISTS wishlist_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, product_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                total_amount REAL NOT NULL,
                status TEXT DEFAULT 'Pending', 
                shipping_address TEXT NOT NULL,
                phone TEXT NOT NULL,          /* ✨ جديد: رقم الهاتف */
                full_name TEXT NOT NULL,      /* ✨ جديد: الاسم بالكامل */
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                price_at_purchase REAL NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            );

            CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
                comment TEXT,
                reply TEXT, 
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        `);
        
        console.log('✅ تم الاتصال بقاعدة البيانات وتجهيز الجداول بنجاح!');
        const migrationQueries = [
            "ALTER TABLE categories ADD COLUMN icon TEXT DEFAULT 'fa-tags'",
            "ALTER TABLE products ADD COLUMN discount REAL DEFAULT 0",
            "ALTER TABLE products ADD COLUMN brand TEXT",
            "ALTER TABLE products ADD COLUMN tags TEXT",
            "ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'approved'",
            "ALTER TABLE products ADD COLUMN featured INTEGER DEFAULT 0",
            "ALTER TABLE products ADD COLUMN images TEXT",
            "ALTER TABLE users ADD COLUMN profile_picture TEXT",
            "ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 1",
            "ALTER TABLE users ADD COLUMN activation_token TEXT",
            "ALTER TABLE users ADD COLUMN activation_expires DATETIME",
            "ALTER TABLE users ADD COLUMN reset_token TEXT",
            "ALTER TABLE users ADD COLUMN reset_expires DATETIME",
            "ALTER TABLE users ADD COLUMN address TEXT",
            "ALTER TABLE users ADD COLUMN birthdate DATE",
            "ALTER TABLE users ADD COLUMN city TEXT",
            "ALTER TABLE users ADD COLUMN country TEXT",
            "ALTER TABLE orders ADD COLUMN phone TEXT",
            "ALTER TABLE orders ADD COLUMN full_name TEXT"
        ];

        for (const query of migrationQueries) {
            try {
                await db.run(query);
            } catch (error) {
                if (!error.message.includes('duplicate column name')) {
                    throw error;
                }
            }
        }

        await db.exec(`
            CREATE TABLE IF NOT EXISTS wishlist_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, product_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        dbInstance = db;
        return db;
    } catch (error) {
        console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error.message);
    }
}

// السحر كله في الـ 4 سطور دول:
const getDb = () => dbInstance;

// بنربط دالة التهيئة بالدالة دي عشان نقدر نستدعيها من السيرفر قبل ما يشتغل
getDb.init = initDB; 

module.exports = getDb;
