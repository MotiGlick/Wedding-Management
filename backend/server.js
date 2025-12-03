// server.js (הקוד המומלץ והמתוקן)
require('dotenv').config(); // טוען את המשתנים מקובץ .env


const express = require('express');
const path = require('path'); // נחוץ לטיפול בנתיבים
// שורה מתוקנת:
const { connectDB, syncDB } = require('./db');
require('./models/associations.js');
const authRoutes = require('./routes/auth.routes.js'); // *** תיקון: משתמש בנתיב auto.routes.js כפי שצוין ***
const taskRoutes = require('./routes/task.routes.js');
const expenseRoutes = require('./routes/expenses.routes.js');
const cors = require('cors'); // ייבוא של CORS
const app = express();
const PORT = process.env.PORT || 3000; // אפשרות להגדיר פורט דרך משתני סביבה

// 1. הפעלת CORS (מאפשר גישה מכל מקור, פותר שגיאות רשת)

app.use(cors({
   origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5500',
        'http://127.0.0.1:5500'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));
app.options(/.*/, cors());


// --- Middlewares ---
// 2. טיפול ב-JSON
app.use(express.json()); 

// 3. הגשת קבצים סטטיים (HTML, CSS, JS)
// אם server.js בתוך /backend והקבצים בתוך /public, הנתיב צריך להיות:
// app.use(express.static(path.join(__dirname, '..', 'public'))); 
// אם public באותה רמה כמו server.js:
app.use(express.static(path.join(__dirname, 'public'))); 

// --- חיבור ראוטרים ---
// כל הניתובים לאימות (הרשמה/התחברות) יתחילו ב-/api/auth
app.use('/api/auth', authRoutes); // משאיר את ה-URL כ- '/api/auth' כדי להתאים לקוד ה-JS של הלקוח
app.use('/api/tasks', taskRoutes);

app.use('/api/expenses', expenseRoutes);
const guestRoutes = require('./routes/guest.routes.js'); 
app.use('/api/guests', guestRoutes);


// --- הפעלת השרת ---
async function startServer() {
    try {
        console.log("🚩 [SERVER] Calling connectDB()...");
        await connectDB();
        console.log("🚩 [SERVER] Calling syncDB()...");
        await syncDB();
        
        app.listen(PORT, () => {
            console.log(`✅ [SERVER] Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ [SERVER] Failed to start server:", error);
    }
}

startServer();