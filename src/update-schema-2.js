const getDb = require('./config/database');

async function updateDatabase3() {
    try {
        const db = await getDb.init();
        console.log('🔄 جاري تحديث قاعدة البيانات للبانر المتقدم...');

        const bannerColumns = [
            'bg_color TEXT DEFAULT "#ffffff"',
            'text_color TEXT DEFAULT "#1f2937"',
            'button_text TEXT DEFAULT "اكتشف الآن"',
            'button_color TEXT DEFAULT "#0891b2"'
        ];
        
        for (let col of bannerColumns) {
            try {
                await db.run(`ALTER TABLE banners ADD COLUMN ${col}`);
                console.log(`✅ تم إضافة الحقل ${col.split(' ')[0]} لجدول السلايدر.`);
            } catch (e) {
                if (e.message.includes('duplicate column name')) {
                    console.log(`⚠️ الحقل ${col.split(' ')[0]} موجود بالفعل.`);
                }
            }
        }
        console.log('🎉 تم التحديث بنجاح!');
    } catch (error) {
        console.error('❌ حصل خطأ:', error);
    }
}
updateDatabase3();