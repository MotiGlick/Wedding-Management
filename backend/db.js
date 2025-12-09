const { Sequelize } = require('sequelize');
require('dotenv').config();

// זיהוי הסביבה: אם רצים ב-Render, המשתנה הזה יהיה 'production'
const isProduction = process.env.NODE_ENV === 'production';

let sequelize;

// לוגיקה חכמה: אם יש משתנה DATABASE_URL (כמו ב-Render), נשתמש בו.
// אחרת (במחשב שלך), נשתמש במשתנים הנפרדים.
if (process.env.DATABASE_URL) {
    // --- חיבור לענן (Render / Supabase) ---
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false, // מנקה את הלוגים
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // חובה עבור Supabase כדי לאשר את התעודה
            }
        }
    });
} else {
    // --- חיבור מקומי (המחשב שלך) ---
    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            host: process.env.DB_HOST,
            dialect: 'postgres',
            logging: false,
            // ב-Localhost אנחנו לא צריכים SSL בדרך כלל
        }
    );
}

async function connectDB() {
    try {
        // טעינת הקשרים בין הטבלאות
        require('./models/associations'); 
        
        await sequelize.authenticate();
        console.log(`✅ [DB] Connected successfully (${isProduction ? 'Cloud' : 'Local'}).`);
    } catch (error) {
        console.error('❌ [DB] Connection failed:', error);
        // זריקת שגיאה כדי שהשרת ידע שיש בעיה
        throw error;
    }
}

async function syncDB(options) { 
    try {
        // בייצור נרצה בדרך כלל להימנע מ-force: true בטעות, אבל נשאיר את השליטה למפעיל הפונקציה
        await sequelize.sync(options); 
        console.log(`✅ [DB] Synced (Options: ${JSON.stringify(options)})`);
    } catch (error) {
        console.error('❌ [DB] Sync error:', error);
    }
}

module.exports = { sequelize, connectDB, syncDB };