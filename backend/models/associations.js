// backend/models/associations.js

<<<<<<< HEAD
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
=======
// ייבוא כל המודלים
const User = require('./User'); 
const Task = require('./Task'); 
const Expense = require('./Expense');
const Guest = require('./Guest');
const Message = require('./message'); // אם אתה צריך הודעות

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
>>>>>>> 6ea40c9c30b273b574140107581140a4467a6033
module.exports = { User, Task, Expense, Guest, Message };
