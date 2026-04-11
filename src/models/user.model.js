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
        return await db.get(
            `SELECT id, first_name, last_name, email, phone, role, default_shipping_address
             FROM users
             WHERE id = ?`,
            [userId]
        );
    }

    static async updateProfile(userId, profileData) {
        const db = getDb();
        const { first_name, last_name, phone, default_shipping_address } = profileData;

        await db.run(
            `UPDATE users
             SET first_name = ?, last_name = ?, phone = ?, default_shipping_address = ?
             WHERE id = ?`,
            [first_name, last_name, phone, default_shipping_address, userId]
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