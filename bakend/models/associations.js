// ייבוא מודל המשתמש
const User = require('./User'); 
// ייבוא מודל המשימה
const Task = require('./Task'); 
const Expense = require('./Expense');

// 1. הגדרת הקשר: לכל משתמש יש משימות רבות (One-to-Many)
// Sequelize יחפש עמודה בשם 'userId' בטבלת Tasks
User.hasMany(Task, {
    foreignKey: 'userId', // השם של המפתח הזר בטבלת tasks
    as: 'tasks',         // כיצד לגשת למשימות מהמשתמש (user.getTasks())
    onDelete: 'CASCADE'  // אם משתמש נמחק, כל המשימות שלו נמחקות
});

// 2. הגדרת הקשר ההפוך: כל משימה שייכת למשתמש אחד
Task.belongsTo(User, {
    foreignKey: 'userId', // השם של המפתח הזר בטבלת tasks
    as: 'owner'           // כיצד לגשת לבעלים מהמשימה (task.getOwner())
});

// 3. הגדרת הקשר: לכל משתמש יש הוצאות רבות (One-to-Many)
User.hasMany(Expense, {
    foreignKey: 'UserId', // 💡 שימו לב ל-UserId, כפי שהוגדר במודל
    as: 'expenses',
    onDelete: 'CASCADE' 
});

// 4. הגדרת הקשר ההפוך: כל הוצאה שייכת למשתמש אחד
Expense.belongsTo(User, {
    foreignKey: 'UserId',
    as: 'user'
});

// ייצוא המודלים (אם כי נהוג לייבא אותם ישירות, אבל זה מוודא שהקישור מופעל)
module.exports = { User, Task };