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
}
module.exports = UserModel;