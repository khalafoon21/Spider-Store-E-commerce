const getDb = require('../config/database');

class CategoryModel {
    static async getAll() {
        const db = getDb();

        return await db.all(`
            SELECT 
                id,
                name,
                COALESCE(icon, '') AS icon
            FROM categories
            ORDER BY id DESC
        `);
    }

    static async create(data) {
        const db = getDb();

        const name = String(data.name || '').trim();
        const icon = String(data.icon || '').trim();

        const result = await db.run(
            'INSERT INTO categories (name, icon) VALUES (?, ?)',
            [name, icon]
        );

        return result.lastID || result.insertId;
    }

    static async update(id, data) {
        const db = getDb();

        const name = String(data.name || '').trim();
        const icon = String(data.icon || '').trim();

        await db.run(
            'UPDATE categories SET name = ?, icon = ? WHERE id = ?',
            [name, icon, id]
        );
    }

    static async delete(id) {
        const db = getDb();

        await db.run(
            'DELETE FROM categories WHERE id = ?',
            [id]
        );
    }
}

module.exports = CategoryModel;