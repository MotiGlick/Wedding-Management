require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const cron = require('node-cron'); 
const { Op } = require('sequelize'); 
const { connectDB, syncDB } = require('./db');

// --- ייבוא המודלים (חשוב ל-Cron Job) ---
require('./models/associations.js');
const User = require('./models/User'); 
const Task = require('./models/Task');       
const Reminder = require('./models/Reminder'); 

// --- ייבוא הראוטים ---
const invitationRoutes = require('./routes/invitationRoutes');
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
    origin: '*', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));

// --- Middlewares ---
app.use(express.json());
app.use(express.static(path.join(__dirname, '../Frontend')));

// --- Routes ---
app.use('/api/invitations', invitationRoutes);

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
// 🕒 מנגנון התזכורות (CRON JOB) - מעודכן
// ==========================================

cron.schedule('* * * * *', async () => {
    console.log('⏰ בודק תזכורות...');

    try {
        const now = new Date();

        // 1. שליפה חכמה: תזכורת -> משימה -> משתמש
        const reminders = await Reminder.findAll({
            where: {
                triggerAt: { [Op.lte]: now }, //
                isSent: false                 //
            },
            include: [
                { 
                    model: Task,
                    include: [{ 
                           model: User,
                           as: 'owner', 
                           attributes: ['email', 'username'] 
                           }]
                }
            ]
        });
        
        // --- בדיקה 1: כמות רשומות ---
        if (reminders.length > 0) {
            console.log(`✅ [CRON] נמצאו ${reminders.length} תזכורות לשליחה.`);
        } else {
            console.log(`⚠️ [CRON] לא נמצאו תזכורות לשליחה.`);
        }
        // ---------------------------


       for (const reminder of reminders) {
            
            if (!reminder.Task) {
                console.log(`⚠️ משימה נמחקה (ID: ${reminder.taskId})`);
                continue; 
            }
            if (!reminder.Task.owner) {
                console.log(`⚠️ משתמש לא נמצא עבור המשימה (TaskID: ${reminder.Task.id})`);
                continue; 
            }

            const userEmail = reminder.Task.owner.email;
            const emailHtml = getReminderTemplate(reminder.Task.title, reminder.Task.date);

            // --- בדיקה 2: אימות מייל ושם משימה ---
            if (!userEmail) {
                console.error(`❌ [CRON] שגיאה: כתובת מייל חסרה עבור משימה ${reminder.Task.title}`);
                continue;
            }
            console.log(`➡️ [CRON] מנסה לשלוח תזכורת: ${reminder.Task.title} ל: ${userEmail}`);
            // ------------------------------------

            const mailOptions = {
                to: userEmail,
                subject: `🔔 תזכורת: ${reminder.Task.title}`,
                html: emailHtml
            };

            try {
                // 1. נסה לשלוח
                console.log(`🚀 שולח מייל דרך SendGrid ל-${userEmail}...`);
                await sendMail(mailOptions);
                
                // 2. אם ההגעה לכאן, המייל נשלח בהצלחה
                reminder.isSent = true;
                await reminder.save();
                
                console.log(`✅ מייל נשלח בהצלחה ל-${userEmail}`);

            } catch (emailError) {
                // 3. אם יש שגיאה, אל תעדכן את ה-DB
                console.error(`❌ שגיאה בשליחה ל-${userEmail}: המייל נכשל. ה-DB לא עודכן.`);
                console.error("פרטי השגיאה:", emailError.message || emailError); // הדפסת השגיאה המלאה
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
        await syncDB({ alter: true });

        app.listen(PORT, () => {
            console.log(`✅ [SERVER] Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("❌ [SERVER] Failed to start server:", error);
    }
}

startServer();