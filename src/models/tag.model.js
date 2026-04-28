const getDb = require('../config/database');

class TagModel {
    static async getAll() {
        const db = getDb();
        return db.all(`SELECT * FROM tags ORDER BY name ASC`);
    }

    static async create(name) {
        const db = getDb();
        const result = await db.run(
            `INSERT INTO tags (name) VALUES (?)`,
            [String(name || '').trim()]
        );
        return result.lastID;
    }

    static async update(id, name) {
        const db = getDb();
        await db.run(`UPDATE tags SET name = ? WHERE id = ?`, [String(name || '').trim(), id]);
    }

    static async delete(id) {
        const db = getDb();
        await db.run(`DELETE FROM tags WHERE id = ?`, [id]);
    }
}

module.exports = TagModel;
