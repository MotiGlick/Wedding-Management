const { DataTypes } = require('sequelize');
const { sequelize } = require('../db'); // ייבוא אובייקט החיבור שיצרנו

const User = sequelize.define('User', {
    // השדה הראשי
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    // שדה שם משתמש (שם הלקוח)
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    // שדה אימייל
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    // שדה סיסמה (חובה להצפין סיסמאות באפליקציות אמיתיות!)
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'Users' // שם הטבלה ב-PostgreSQL
});

module.exports = User;