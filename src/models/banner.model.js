const getDb = require('../config/database');

class BannerModel {
    static async getAll() {
        const db = getDb();
        return await db.all('SELECT * FROM banners ORDER BY created_at DESC');
    }

    static async create(data) {
        const db = getDb();
        const { title, description, image_url, bg_color, text_color, button_text, button_color } = data;
        const result = await db.run(
            'INSERT INTO banners (title, description, image_url, bg_color, text_color, button_text, button_color) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, description, image_url, bg_color || '#ffffff', text_color || '#1f2937', button_text || 'اكتشف الآن', button_color || '#0891b2']
        );
        return result.lastID;
    }

    static async update(id, data) {
        const db = getDb();
        const { title, description, bg_color, text_color, button_text, button_color } = data;
        await db.run(
            'UPDATE banners SET title = ?, description = ?, bg_color = ?, text_color = ?, button_text = ?, button_color = ? WHERE id = ?',
            [title, description, bg_color, text_color, button_text, button_color, id]
        );
    }

    static async delete(id) {
        const db = getDb();
        await db.run('DELETE FROM banners WHERE id = ?', [id]);
    }
}
module.exports = BannerModel;