// backend/models/associations.js

// ייבוא כל המודלים רק פעם אחת
const User = require('./User');
const Task = require('./Task');
const Expense = require('./Expense');
const Guest = require('./Guest');
const Message = require('./Message');

// --- קשרים: משתמש <=> משימות ---
User.hasMany(Task, { foreignKey: 'userId', as: 'tasks', onDelete: 'CASCADE' });
Task.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

// --- קשרים: משתמש <=> הוצאות ---
User.hasMany(Expense, { foreignKey: 'UserId', as: 'expenses', onDelete: 'CASCADE' });
Expense.belongsTo(User, { foreignKey: 'UserId', as: 'user' });

// --- קשרים: משתמש <=> הודעות ---
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages', onDelete: 'CASCADE' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

User.hasMany(Message, { foreignKey: 'recipientId', as: 'receivedMessages', onDelete: 'CASCADE' });
Message.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });

// --- (אופציונלי) קשרים עם אורחים, אם רוצים להוסיף משתמשId ל-Guest ---
// User.hasMany(Guest, { foreignKey: 'userId', as: 'guests', onDelete: 'CASCADE' });
// Guest.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

// ייצוא כל המודלים
module.exports = { User, Task, Expense, Guest, Message };
