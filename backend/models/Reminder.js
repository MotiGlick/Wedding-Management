const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // וודא שזה הנתיב לקובץ החיבור ל-DB שלך

const Reminder = sequelize.define('Reminder', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    triggerAt: {
        type: DataTypes.DATE, // התאריך והשעה המדויקים למשלוח
        allowNull: false
    },
    type: {
        type: DataTypes.STRING, 
        defaultValue: 'email' // סוג התזכורת
    },
    isSent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false // האם נשלח כבר?
    }
});

module.exports = Reminder;