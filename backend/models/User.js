// backend/models/User.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../db'); 
const crypto = require('crypto'); // 💡 חובה לייבא את ספריית crypto

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
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // ----------------------------------------------------
    // 💡 שדות חדשים הנדרשים לאיפוס סיסמה
    // ----------------------------------------------------
    resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true // הטוקן קיים רק בזמן שהמשתמש ביקש איפוס
    },
    resetPasswordExpire: {
        type: DataTypes.DATE,
        allowNull: true // תאריך התפוגה של הטוקן
    }
}, {
    tableName: 'Users' 
});

// ----------------------------------------------------
// 💡 שיטת מודל (Model Method) ליצירת טוקן איפוס
// ----------------------------------------------------
User.prototype.getResetPasswordToken = function() {
    // 1. יצירת טוקן רנדומלי (הטוקן שנשלח למייל)
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // 2. גיבוב (Hash) של הטוקן כדי לשמור אותו מאובטח בבסיס הנתונים
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
        
    // 3. הגדרת תאריך תפוגה לטוקן (לדוגמה, 10 דקות)
    this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 דקות מהרגע הנוכחי
    
    // 4. החזרת הטוקן הלא מגובב (שליחה למייל)
    return resetToken;
};


module.exports = User;