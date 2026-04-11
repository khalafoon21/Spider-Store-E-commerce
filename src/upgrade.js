const getDb = require('./config/database');

async function upgradeUser() {
    try {
        // 1. بنفتح الاتصال بقاعدة البيانات
        const db = await getDb.init();
        
        // 2. بنعمل ترقية لأول مستخدم في الداتا بيز (اللي إنت لسا عامله)
        await db.run(`UPDATE users SET role = 'admin' WHERE id = 1`);
        
        console.log('✅ مبروك! تم ترقية حسابك إلى أدمن (Admin) بنجاح.');
    } catch (error) {
        console.error('❌ حصل خطأ:', error);
    }
}

upgradeUser();