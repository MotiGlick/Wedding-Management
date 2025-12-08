// models/associations.js

// ייבוא כל המודלים
const User = require('./User'); 
const Task = require('./Task'); 
const Expense = require('./Expense');
const Guest = require('./Guest');
const Message = require('./Message'); // אם אתה צריך הודעות

// --- קשרים ---
// User <-> Task
User.hasMany(Task, { foreignKey: 'userId', as: 'tasks', onDelete: 'CASCADE' });
Task.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

// User <-> Expense
User.hasMany(Expense, { foreignKey: 'UserId', as: 'expenses', onDelete: 'CASCADE' });
Expense.belongsTo(User, { foreignKey: 'UserId', as: 'user' });

// (אופציונלי) User <-> Guest
// אם תרצה בעתיד שהאורחים יהיו משויכים למשתמש, תוסיף כאן קשר

// User <-> Message
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages', onDelete: 'CASCADE' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

User.hasMany(Message, { foreignKey: 'recipientId', as: 'receivedMessages', onDelete: 'CASCADE' });
Message.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });

// ייצוא כל המודלים בפעם אחת
module.exports = { User, Task, Expense, Guest, Message };
