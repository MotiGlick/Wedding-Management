const { Sequelize } = require('sequelize');

const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST, 
    dialect: 'postgres',
    // --- ביטלנו את ה-SSL לעבודה מקומית ---
    // dialectOptions: {
    //     ssl: { 
    //         require: true,
    //         rejectUnauthorized: false
    //     }
    // }
});

async function connectDB() {
    try {
        require('./models/associations'); 
        await sequelize.authenticate();
        //console.log('✅ [DB] Connected.');
    } catch (error) {
        throw error;
    }
}

// --- התיקון הקריטי כאן: הוספנו את (options) ---
async function syncDB(options) { 
    try {
        // עכשיו הפונקציה יודעת להשתמש ב-force או alter ששולחים לה
        await sequelize.sync(options); 
    } catch (error) {
        console.error('❌ [DB] Sync error:', error);
    }
}

module.exports = { sequelize, connectDB, syncDB };