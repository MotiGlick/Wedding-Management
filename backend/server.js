require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const cron = require('node-cron'); // <--- הוספנו
const { Op } = require('sequelize'); // <--- הוספנו
const { connectDB, syncDB } = require('./db');

// --- ייבוא המודלים (חשוב ל-Cron Job) ---
// בראש הקובץ server.js
require('./models/associations.js');
const User = require('./models/User'); // <--- תוסיף את זה!
const Task = require('./models/Task');       // <--- הוספנו
const Reminder = require('./models/Reminder'); // <--- הוספנו

// --- ייבוא הראוטים ---
const authRoutes = require('./routes/auth.routes.js');
const taskRoutes = require('./routes/task.routes.js');
const expenseRoutes = require('./routes/expenses.routes.js');
const guestRoutes = require('./routes/guest.routes.js');
const reminderRoutes = require('./routes/reminder.routes');
const { getReminderTemplate } = require('./utils/emailTemplates');

const { sendMail } = require('./utils/notificationService'); 

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1. הגדרת CORS ---
app.use(cors({
    origin: '*', // פתוח לכולם כרגע (נוח לפיתוח)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));

// --- Middlewares ---
app.use(express.json());
app.use(express.static(path.join(__dirname, '../Frontend')));

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/reminders', reminderRoutes);

// --- Fallback Route ---
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/landing.html'));
});

// ==========================================
// 🕒 מנגנון התזכורות (CRON JOB)
// ==========================================
// שמנו את זה מחוץ ל-startServer כדי לשמור על סדר, זה ירוץ ברגע שהקובץ נטען

// ==========================================
// 🕒 מנגנון התזכורות (CRON JOB)
// ==========================================

cron.schedule('* * * * *', async () => {
    console.log('⏰ בודק תזכורות...');

    try {
        const now = new Date();

        // 1. שליפה חכמה: תזכורת -> משימה -> משתמש
        const reminders = await Reminder.findAll({
            where: {
                triggerAt: { [Op.lte]: now },
                isSent: false
            },
            include: [
                { 
                    model: Task,
                    // כאן הקסם: שליפה מקוננת
                    // אנחנו אומרים: "תביא לי את המשימה, ובתוכה תביא את המשתמש של המשימה"
                  include: [{ 
                           model: User,
                           as: 'owner', // <--- הוספנו את השורה הזו
                           attributes: ['email', 'firstName'] 
                           }]
                }
            ]
        });

        for (const reminder of reminders) {
            
            // בדיקות תקינות כפולות
            if (!reminder.Task) {
                console.log(`⚠️ משימה נמחקה (ID: ${reminder.taskId})`);
                continue; 
            }
           if (!reminder.Task.owner) {
                console.log(`⚠️ משתמש לא נמצא עבור המשימה (TaskID: ${reminder.Task.id})`);
                continue; 
            }

            // שליפת המייל האמיתי של המשתמש!
            const userEmail = reminder.Task.owner.email;
            const userName = reminder.Task.owner.firstName || "לקוח יקר";
            
            console.log(`🚀 שולח תזכורת לכתובת: ${userEmail}`);

            // יצירת ה-HTML (אפשר להוסיף את שם המשתמש לתבנית אם רוצים)
            const emailHtml = getReminderTemplate(reminder.Task.title, reminder.Task.date);

            const mailOptions = {
                to: userEmail, // <--- הנה התיקון שלך!
                subject: `🔔 תזכורת: ${reminder.Task.title}`,
                html: emailHtml
            };

            try {
                await sendMail(mailOptions);
                
                reminder.isSent = true;
                await reminder.save();
                
                console.log(`✅ מייל נשלח בהצלחה ל-${userEmail}`);

            } catch (emailError) {
                console.error(`❌ שגיאה בשליחה ל-${userEmail}`, emailError);
            }
        }
    } catch (err) {
        console.error("❌ Cron Job Error:", err);
    }
});
// ==========================================
// 🚀 הפעלת השרת
// ==========================================

async function startServer() {
    try {
        console.log("🚩 [SERVER] Connecting to DB...");
        await connectDB();

        console.log("🚩 [SERVER] Syncing DB...");
        // alter: true מעדכן את הטבלאות בלי למחוק מידע קיים
        await syncDB({ force: true });

        app.listen(PORT, () => {
            console.log(`✅ [SERVER] Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("❌ [SERVER] Failed to start server:", error);
    }
}

startServer();