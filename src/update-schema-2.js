const getDb = require('./config/database');

async function runSchemaUpdate() {
    const db = await getDb.init();
    const queries = [
        "ALTER TABLE products ADD COLUMN discount DECIMAL(10,2) DEFAULT 0",
        "ALTER TABLE products ADD COLUMN brand VARCHAR(100)",
        "ALTER TABLE products ADD COLUMN tags TEXT",
        "ALTER TABLE products ADD COLUMN images TEXT"
    ];

    for (const query of queries) {
        try {
            await db.run(query);
            console.log(`Applied: ${query}`);
        } catch (error) {
            const message = String(error && error.message || '').toLowerCase();
            if (message.includes('duplicate')) {
                console.log(`Already applied: ${query}`);
            } else {
                throw error;
            }
        }
    }
}

runSchemaUpdate()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Schema update failed:', error.message);
        process.exit(1);
    });
