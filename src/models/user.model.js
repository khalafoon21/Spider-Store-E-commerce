const getDb = require('../config/database');

function nullableText(value) {
    const clean = String(value || '').trim();
    return clean || null;
}

function nullableDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString().slice(0, 10);

    const clean = String(value).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(clean) ? clean : null;
}

class UserModel {
    static async findByEmail(email) {
        const db = getDb();
        return await db.get('SELECT * FROM users WHERE email = ?', [email]);
    }

    static async findByActivationToken(token) {
        const db = getDb();
        return await db.get('SELECT * FROM users WHERE activation_token = ?', [token]);
    }

    static async findByResetToken(token) {
        const db = getDb();
        return await db.get('SELECT * FROM users WHERE reset_token = ?', [token]);
    }

    static async create(userDATA) {
        const db = getDb();

        const {
            first_name,
            last_name,
            email,
            password_hash,
            phone = null,
            role = 'user',
            seller_status = '',
            email_verified = 0,
            activation_token = null,
            activation_expires = null
        } = userDATA;

        const result = await db.run(
            `
                INSERT INTO users
                    (
                        first_name,
                        last_name,
                        email,
                        password_hash,
                        phone,
                        role,
                        seller_status,
                        email_verified,
                        activation_token,
                        activation_expires
                    )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                first_name,
                last_name,
                email,
                password_hash,
                phone,
                role,
                seller_status,
                Number(email_verified) === 1 ? 1 : 0,
                activation_token,
                activation_expires
            ]
        );

        return result.lastID || result.insertId;
    }

    static async getById(userId) {
        const db = getDb();

        return await db.get(
            `
                SELECT
                    id,
                    first_name,
                    last_name,
                    email,
                    phone,
                    role,
                    seller_status,
                    profile_picture,
                    email_verified,
                    address,
                    birthdate,
                    city,
                    country,
                    store_name,
                    store_description
                FROM users
                WHERE id = ?
            `,
            [userId]
        );
    }

    static async updateProfile(userId, profileData) {
        const db = getDb();

        const {
            first_name,
            last_name,
            phone,
            address,
            birthdate,
            city,
            country,
            profile_picture = null,
            store_name = null,
            store_description = null
        } = profileData;

        await db.run(
            `
                UPDATE users
                SET
                    first_name = ?,
                    last_name = ?,
                    phone = ?,
                    address = ?,
                    birthdate = ?,
                    city = ?,
                    country = ?,
                    profile_picture = COALESCE(?, profile_picture),
                    store_name = COALESCE(?, store_name),
                    store_description = COALESCE(?, store_description)
                WHERE id = ?
            `,
            [
                first_name,
                last_name,
                nullableText(phone),
                nullableText(address),
                nullableDate(birthdate),
                nullableText(city),
                nullableText(country),
                profile_picture,
                nullableText(store_name),
                nullableText(store_description),
                userId
            ]
        );
    }

    static async updatePassword(userId, passwordHash) {
        const db = getDb();

        await db.run(
            `
                UPDATE users
                SET
                    password_hash = ?,
                    reset_token = NULL,
                    reset_expires = NULL
                WHERE id = ?
            `,
            [passwordHash, userId]
        );
    }

    static async activate(userId) {
        const db = getDb();

        await db.run(
            `
                UPDATE users
                SET
                    email_verified = 1,
                    activation_token = NULL,
                    activation_expires = NULL
                WHERE id = ?
            `,
            [userId]
        );
    }

    static async setResetToken(userId, token, expiresAt) {
        const db = getDb();

        await db.run(
            `
                UPDATE users
                SET
                    reset_token = ?,
                    reset_expires = ?
                WHERE id = ?
            `,
            [token, expiresAt, userId]
        );
    }
}

module.exports = UserModel;