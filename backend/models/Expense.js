// models/Expense.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../db'); // ייבוא אובייקט החיבור

const Expense = sequelize.define('Expense', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    // קטגוריית ההוצאה (לוקיישן, קייטרינג וכו')
    category: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // סכום ההוצאה
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    // תאריך יעד/תשלום
    date: {
        type: DataTypes.DATEONLY, // שומר רק את התאריך (YYYY-MM-DD)
        allowNull: false,
    },
    // סטטוס תשלום (paid/pending)
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
    },
    // הערות נוספות
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    // ForeignKey: מזהה המשתמש ששייך אליו ההוצאה
    // יוגדר בקובץ associations.js
}, {
    tableName: 'Expenses' 
});

module.exports = Expense;