<<<<<<< HEAD
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
=======
// backend/models/associations.js (קוד מעודכן ושלם)

// ייבוא מודלים קיימים
const User = require('./User'); 
const Task = require('./Task'); 
const Expense = require('./Expense');
const Message = require('./Message'); // המודל החדש שאתה מייבא

// --- 1. קשרים: משתמש <=> משימה ---
// לכל משתמש יש משימות רבות (One-to-Many)
User.hasMany(Task, {
    foreignKey: 'userId', 
    as: 'tasks',         
    onDelete: 'CASCADE'  
});
// כל משימה שייכת למשתמש אחד
Task.belongsTo(User, {
    foreignKey: 'userId', 
    as: 'owner'           
});

// --- 2. קשרים: משתמש <=> הוצאה ---
// לכל משתמש יש הוצאות רבות (One-to-Many)
User.hasMany(Expense, {
    foreignKey: 'UserId', 
    as: 'expenses',
    onDelete: 'CASCADE' 
});
// כל הוצאה שייכת למשתמש אחד
>>>>>>> 776a45736b0c97d7257846493027f9130a7e5da4
Expense.belongsTo(User, {
    foreignKey: 'UserId',
    as: 'user'
});

<<<<<<< HEAD
// --- קשרים עבור אורחים (Guests) - אופציונלי אך מומלץ ---
// כרגע בקוד שלך האורחים לא משויכים למשתמש ספציפי, אבל כדי שהמערכת תעבוד מסודר:
// (אם תרצה בעתיד שכל משתמש יראה רק את האורחים שלו, תצטרך להוסיף userId ל-Guest)

// ייצוא כל המודלים
// 2. התיקון הקריטי: הוספנו את Guest ו-Expense לרשימת הייצוא
module.exports = { User, Task, Expense, Guest };
=======
// -------------------------------------------------------------------
// 💡 הקשרים החדשים הנדרשים עבור המודל Message:
// -------------------------------------------------------------------

// 3. קשר: משתמש כ**שולח** הודעה
User.hasMany(Message, {
    foreignKey: 'senderId', // השם של המפתח הזר בטבלת Messages
    as: 'sentMessages',     // כיצד לגשת: user.getSentMessages()
    onDelete: 'CASCADE'
});
Message.belongsTo(User, {
    foreignKey: 'senderId',
    as: 'sender'            // כיצד לגשת: message.getSender()
});


// 4. קשר: משתמש כ**נמען** הודעה
User.hasMany(Message, {
    foreignKey: 'recipientId', // השם של המפתח הזר בטבלת Messages
    as: 'receivedMessages',    // כיצד לגשת: user.getReceivedMessages()
    onDelete: 'CASCADE'
});
Message.belongsTo(User, {
    foreignKey: 'recipientId',
    as: 'recipient'            // כיצד לגשת: message.getRecipient()
});


// ייצוא כל המודלים
module.exports = { User, Task, Expense, Message };
>>>>>>> 776a45736b0c97d7257846493027f9130a7e5da4
