const { DataTypes } = require('sequelize');
const { sequelize } = require('../db'); 

const Reminder = sequelize.define('Reminder', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    triggerAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING, 
        defaultValue: 'email'
    },
    isSent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

module.exports = Reminder;