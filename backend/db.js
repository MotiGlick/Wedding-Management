

const { Sequelize } = require('sequelize');

//console.log("🚩 [DB] Initializing Sequelize connection."); // הדגל החדש

// --- הוסף את השורות האלה ---
const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST;




const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST, 
    dialect: 'postgres',
    // --- ההגדרות הללו קריטיות לחיבורי ענן ---
    dialectOptions: {
        ssl: { 
            require: true, // דורש SSL
            rejectUnauthorized: false // מאפשר חיבור גם אם אישור ה-SSL אינו מאומת במלואו
        }
    }
    
});
// פונקציה לבדיקת החיבור
async function connectDB() {
    try {
    // כולל את הקבצים המקשרים כדי להבטיח את טעינת כל המודלים
        require('./models/associations'); // מומלץ לוודא שהקשרים נטענו
        //console.log("🚩 [DB] Attempting to AUTHENTICATE...");
        await sequelize.authenticate();
        //console.log('✅ [DB] Connection to PostgreSQL established successfully.');
    } catch (error) {
        //console.error('❌ [DB] Unable to connect to the database:', error);
        throw error;
    }
}
//
async function syncDB() {
    try {
        //console.log("🚩 [DB] Attempting to SYNC models...");
        await sequelize.sync(); 
        //console.log('✅ [DB] All models were synchronized successfully.');
    } catch (error) {
        //console.error('❌ [DB] Unable to synchronize models:', error);
    }
}

module.exports = { sequelize, connectDB, syncDB };