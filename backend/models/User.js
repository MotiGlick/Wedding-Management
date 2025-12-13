const { DataTypes } = require('sequelize');
const { sequelize } = require('../db'); 

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    invitationImage: {
        type: DataTypes.STRING,
        allowNull: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // ===============================================
    // 🆕 הוספה: שדות זמניים לאיפוס סיסמה
    // ===============================================
    resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true, // יכול להיות Null כאשר אין בקשת איפוס פעילה
    },
    resetPasswordExpire: {
        type: DataTypes.DATE,
        allowNull: true, // יכול להיות Null כאשר אין בקשת איפוס פעילה
    }
    // ===============================================
    
}, {
    
    tableName: 'Users' 
});

module.exports = User;