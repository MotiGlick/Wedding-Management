// backend/models/Message.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../db'); // ייבוא מופע ה-Sequelize מהקובץ db.js

const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    // מזהה השולח (מפתח זר)
    senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users', // השם של טבלת המשתמשים שלך במסד הנתונים
            key: 'id'
        }
    },
    // מזהה הנמען (מפתח זר)
    recipientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    // תוכן ההודעה
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    // האם ההודעה נקראה
    read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // ערוץ מועדף להתראה
    notificationChannel: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'in-app'
    }
}, {
    // השם של הטבלה במסד הנתונים
    tableName: 'Messages',
    // Sequelize מוסיף אוטומטית createdAt ו-updatedAt
    timestamps: true
});

module.exports = Message;