const getDb = require('../config/database');

class BannerModel {
    static async getAll() {
        const db = getDb();

        return await db.all(`
            SELECT
                id,
                title,
                description,
                image_url,
                COALESCE(bg_color, '#0f172a') AS bg_color,
                COALESCE(text_color, '#ffffff') AS text_color,
                COALESCE(button_text, 'اكتشف الآن') AS button_text,
                COALESCE(button_color, '#06B6D4') AS button_color,
                created_at
            FROM banners
            ORDER BY created_at DESC
        `);
    }

    static async create(data) {
        const db = getDb();

        const title = String(data.title || '').trim();
        const description = String(data.description || '').trim();
        const image_url = String(data.image_url || '').trim();
        const bg_color = String(data.bg_color || '#0f172a').trim();
        const text_color = String(data.text_color || '#ffffff').trim();
        const button_text = String(data.button_text || 'اكتشف الآن').trim();
        const button_color = String(data.button_color || '#06B6D4').trim();

        const result = await db.run(
            `
                INSERT INTO banners
                    (title, description, image_url, bg_color, text_color, button_text, button_color)
                VALUES
                    (?, ?, ?, ?, ?, ?, ?)
            `,
            [
                title,
                description,
                image_url,
                bg_color,
                text_color,
                button_text,
                button_color
            ]
        );

        return result.lastID || result.insertId;
    }

    static async update(id, data) {
        const db = getDb();

        const existing = await db.get(
            'SELECT * FROM banners WHERE id = ?',
            [id]
        );

        if (!existing) return null;

        const title = data.title !== undefined
            ? String(data.title || '').trim()
            : existing.title;

        const description = data.description !== undefined
            ? String(data.description || '').trim()
            : existing.description;

        const image_url = data.image_url !== undefined
            ? String(data.image_url || '').trim()
            : existing.image_url;

        const bg_color = data.bg_color !== undefined
            ? String(data.bg_color || '#0f172a').trim()
            : existing.bg_color;

        const text_color = data.text_color !== undefined
            ? String(data.text_color || '#ffffff').trim()
            : existing.text_color;

        const button_text = data.button_text !== undefined
            ? String(data.button_text || 'اكتشف الآن').trim()
            : existing.button_text;

        const button_color = data.button_color !== undefined
            ? String(data.button_color || '#06B6D4').trim()
            : existing.button_color;

        await db.run(
            `
                UPDATE banners
                SET
                    title = ?,
                    description = ?,
                    image_url = ?,
                    bg_color = ?,
                    text_color = ?,
                    button_text = ?,
                    button_color = ?
                WHERE id = ?
            `,
            [
                title,
                description,
                image_url,
                bg_color,
                text_color,
                button_text,
                button_color,
                id
            ]
        );

        return true;
    }

    static async delete(id) {
        const db = getDb();

        await db.run(
            'DELETE FROM banners WHERE id = ?',
            [id]
        );
    }
}

module.exports = BannerModel;