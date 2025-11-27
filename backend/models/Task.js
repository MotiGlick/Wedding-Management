const { DataTypes } = require('sequelize');
const { sequelize } = require('../db'); 

const Task = sequelize.define('Task', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    completed: { type: DataTypes.BOOLEAN, defaultValue: false },
    description: {
        type: DataTypes.TEXT, // שימוש ב-TEXT לאחסון טקסט ארוך
        allowNull: true,     
        defaultValue: null,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false // כל משימה חייבת להיות שייכת למשתמש
    }
}, {
    tableName: 'Tasks'
});

module.exports = Task;
