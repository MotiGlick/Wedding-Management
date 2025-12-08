require('dotenv').config();
const express = require('express');
const path = require('path');
const { connectDB, syncDB } = require('./db');
require('./models/associations.js');
const authRoutes = require('./routes/auth.routes.js');
const taskRoutes = require('./routes/task.routes.js');
const expenseRoutes = require('./routes/expenses.routes.js');
const guestRoutes = require('./routes/guest.routes.js'); 
const cors = require('cors');

const app = express();
// Render נותן פורט משלו, לכן חשוב להשתמש ב-process.env.PORT
const PORT = process.env.PORT || 3000;

// --- 1. עדכון CORS לייצור ---
app.use(cors({
    origin: '*', // מאפשר גישה מכל כתובת (חיוני להתחלה ב-Render)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));
app.options(/.*/, cors());

// --- Middlewares ---
app.use(express.json()); 

// --- 2. עדכון נתיב לקבצים סטטיים ---
// __dirname = התיקייה הנוכחית (backend)
// ../public = התיקייה שמעליה (הראשית) ושם public
app.use(express.static(path.join(__dirname, '../public'))); 

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/guests', guestRoutes);

// נתיב Fallback: אם המשתמש נכנס לכתובת לא מוכרת, נחזיר לו את דף הבית
// זה חשוב מאוד באפליקציות Single Page
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

async function startServer() {
    try {
        console.log("🚩 [SERVER] Connecting to DB...");
        await connectDB();
        
        console.log("🚩 [SERVER] Syncing DB...");
        
        // --- 3. סנכרון חכם ---
        // אם אנחנו בייצור: alter: true (מעדכן טבלאות בלי למחוק מידע)
        // אם אנחנו בבית: force: false (שומר על המידע)
        // שנה ל-force: true ידנית רק אם אתה רוצה לאפס את ה-DB המקומי
        const isProduction = process.env.NODE_ENV === 'production';
        await syncDB({ alter: true }); 
        
        app.listen(PORT, () => {
            console.log(`✅ [SERVER] Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("❌ [SERVER] Failed to start server:", error);
    }
}

startServer();