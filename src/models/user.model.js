const getDb = require('../config/database');

class UserModel {
    static async findByEmail(email) {
        const db = getDb();
        return await db.get('SELECT * FROM users WHERE email = ?', [email]);
    }

    static async create(userDATA) {
        const db = getDb();
        const { first_name, last_name, email, password_hash, phone } = userDATA;
        const result = await db.run(
            'INSERT INTO users (first_name, last_name, email, password_hash, phone) VALUES (?, ?, ?, ?, ?)',
            [first_name, last_name, email, password_hash, phone]
        );
        return result.lastID;
    }

    static async getById(userId) {
        const db = getDb();
        // ✨ تم إضافة الحقول الجديدة هنا عشان تظهر في البروفايل
        return await db.get(
            `SELECT id, first_name, last_name, email, phone, role, address, birthdate, city, country
             FROM users
             WHERE id = ?`,
            [userId]
        );
    }

    static async updateProfile(userId, profileData) {
        const db = getDb();
        // ✨ تم إضافة الحقول الجديدة عشان تتحدث في الداتا بيز
        const { first_name, last_name, phone, address, birthdate, city, country } = profileData;

        await db.run(
            `UPDATE users
             SET first_name = ?, last_name = ?, phone = ?, address = ?, birthdate = ?, city = ?, country = ?
             WHERE id = ?`,
            [first_name, last_name, phone, address, birthdate, city, country, userId]
        );
    }

    static async updatePassword(userId, passwordHash) {
        const db = getDb();
        await db.run(
            `UPDATE users SET password_hash = ? WHERE id = ?`,
            [passwordHash, userId]
        );
    }
}
module.exports = UserModel;