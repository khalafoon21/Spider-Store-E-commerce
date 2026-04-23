const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// مسار الداتا بيز (بناءً على مسارك في المشروع)
const dbPath = path.join(__dirname, 'database.sqlite'); 
const db = new sqlite3.Database(dbPath);

// ⚠️ اكتب إيميل الحساب اللي لسه مسجله هنا
const targetEmail = 'ahmed@example.com'; 

db.run(`UPDATE users SET role = 'admin' WHERE email = ?`, [targetEmail], function(err) {
    if (err) {
        return console.error('❌ خطأ:', err.message);
    }
    if (this.changes > 0) {
        console.log(`✅ تم ترقية الحساب (${targetEmail}) إلى Admin بنجاح!`);
    } else {
        console.log(`❌ لم يتم العثور على حساب بهذا الإيميل.`);
    }
    db.close();
});