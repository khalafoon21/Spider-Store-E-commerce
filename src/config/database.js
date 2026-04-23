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
                address TEXT,        /* ✨ جديد: العنوان */
                birthdate DATE,      /* ✨ جديد: تاريخ الميلاد */
                city TEXT,           /* ✨ جديد: المدينة */
                country TEXT,        /* ✨ جديد: البلد */
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL
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

            CREATE TABLE IF NOT EXISTS cart_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
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