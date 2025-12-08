// models/associations.js

// ייבוא המודלים
const User = require('./User'); 
const Task = require('./Task'); 
const Expense = require('./Expense');
const Guest = require('./Guest'); 

// --- קשרים עבור משימות (Tasks) ---
User.hasMany(Task, {
    foreignKey: 'userId',
    as: 'tasks',
    onDelete: 'CASCADE'
});
Task.belongsTo(User, {
    foreignKey: 'userId',
    as: 'owner'
});

// --- קשרים עבור הוצאות (Expenses) ---
User.hasMany(Expense, {
    foreignKey: 'UserId',
    as: 'expenses',
    onDelete: 'CASCADE' 
});
Expense.belongsTo(User, {
    foreignKey: 'UserId',
    as: 'user'
});

// --- קשרים עבור אורחים (Guests) - אופציונלי אך מומלץ ---
// כרגע בקוד שלך האורחים לא משויכים למשתמש ספציפי, אבל כדי שהמערכת תעבוד מסודר:
// (אם תרצה בעתיד שכל משתמש יראה רק את האורחים שלו, תצטרך להוסיף userId ל-Guest)

// ייצוא כל המודלים
// 2. התיקון הקריטי: הוספנו את Guest ו-Expense לרשימת הייצוא
module.exports = { User, Task, Expense, Guest };