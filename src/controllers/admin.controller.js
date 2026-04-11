const getDb = require('../config/database');
const { getPostData } = require('../utils/helpers');

// 1. Add a new category
async function addCategory(req, res) {
    try {
        const body = await getPostData(req);
        const { name } = body;

        if (!name) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ 
                success: false, 
                message: 'Category name is required' 
            }));
        }

        const db = getDb();
        const result = await db.run(`INSERT INTO categories (name) VALUES (?)`, [name]);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: true, 
            message: 'Category added successfully', 
            categoryId: result.lastID 
        }));
    } catch (error) {
        console.error(error);

        if (error.code === 'INVALID_JSON') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
                success: false,
                message: 'Invalid JSON payload'
            }));
        }

        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: false, 
            message: 'An error occurred while adding the category' 
        }));
    }
}

// 2. Get all users
async function getAllUsers(req, res) {
    try {
        const db = getDb();
        
        const users = await db.all(
            `SELECT id, first_name, last_name, email, phone, role, created_at FROM users`
        );

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: true, 
            data: users 
        }));
    } catch (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: false, 
            message: 'An error occurred while fetching users' 
        }));
    }
}

// 3. Update user role (upgrade to seller or admin)
async function updateUserRole(req, res) {
    try {
        const body = await getPostData(req);
        const { user_id, new_role } = body;

        const validRoles = ['customer', 'seller', 'admin'];
        
        if (!user_id || !validRoles.includes(new_role)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ 
                success: false, 
                message: 'Invalid data or role not allowed' 
            }));
        }

        const db = getDb();
        await db.run(`UPDATE users SET role = ? WHERE id = ?`, [new_role, user_id]);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: true, 
            message: `User role updated successfully to: ${new_role}` 
        }));
    } catch (error) {
        console.error(error);

        if (error.code === 'INVALID_JSON') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
                success: false,
                message: 'Invalid JSON payload'
            }));
        }

        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: false, 
            message: 'An error occurred while updating user role' 
        }));
    }
}

module.exports = { addCategory, getAllUsers, updateUserRole };