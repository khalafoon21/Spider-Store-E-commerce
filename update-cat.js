const getDb = require('./src/config/database');

async function updateCategoriesIconColumn() {
    const db = await getDb.init();
    try {
        await db.run("ALTER TABLE categories ADD COLUMN icon VARCHAR(100) DEFAULT 'fa-tags'");
        console.log('categories.icon column added');
    } catch (error) {
        const message = String(error && error.message || '').toLowerCase();
        if (message.includes('duplicate')) {
            console.log('categories.icon column already exists');
            return;
        }
        throw error;
    }
}

updateCategoriesIconColumn()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Failed to update categories schema:', error.message);
        process.exit(1);
    });
