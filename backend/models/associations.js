// backend/models/associations.js

// 1. ייבוא המודלים (רק פעם אחת!)
const User = require('./User');
const Task = require('./Task');
const Expense = require('./Expense');
const Guest = require('./Guest');
const Message = require('./message');
const Reminder = require('./Reminder'); // ייבוא המודל החדש

// 2. הגדרת הקשרים (Associations)


// קשר יחיד לרבים: למשימה אחת יכולות להיות הרבה תזכורות
Task.hasMany(Reminder, { foreignKey: 'taskId', onDelete: 'CASCADE' });
Reminder.belongsTo(Task, { foreignKey: 'taskId' });

// וודא שאתה מייצא את המודלים אם צריך, או שזה נעשה אוטומטית בקובץ שלך
// --- קשרים: משתמש <=> משימות ---
User.hasMany(Task, { foreignKey: 'userId', as: 'tasks', onDelete: 'CASCADE' });
Task.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

// --- קשרים: משתמש <=> הוצאות ---
User.hasMany(Expense, { foreignKey: 'UserId', as: 'expenses', onDelete: 'CASCADE' });
Expense.belongsTo(User, { foreignKey: 'UserId', as: 'user' });

// User <-> Guest
User.hasMany(Guest, { foreignKey: 'userId', as: 'guests', onDelete: 'CASCADE' });
Guest.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

// User <-> Message
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages', onDelete: 'CASCADE' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

User.hasMany(Message, { foreignKey: 'recipientId', as: 'receivedMessages', onDelete: 'CASCADE' });
Message.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });

// --- (אופציונלי) קשרים עם אורחים ---
// כרגע בהערה, ניתן להפעיל אם תוסיף userId לטבלת Guests
// User.hasMany(Guest, { foreignKey: 'userId', as: 'guests', onDelete: 'CASCADE' });
// Guest.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

// 3. ייצוא המודלים המעודכנים עם הקשרים
module.exports = { User, Task, Expense, Guest, Message };