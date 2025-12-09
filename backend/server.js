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
const PORT = process.env.PORT || 3000;

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
app.use(express.static(path.join(__dirname, 'public'))); 

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/guests', guestRoutes);

async function startServer() {
    try {
        console.log("🚩 [SERVER] Calling connectDB()...");
        await connectDB();
        
        console.log("🚩 [SERVER] Calling syncDB()...");
        
        // --- שים לב: force: true ימחק את הטבלה ויבנה אותה מחדש ---
        // זה יפתור את הבעיה של 'column side missing'
        await syncDB({ alert: true });
        
        app.listen(PORT, () => {
            console.log(`✅ [SERVER] Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ [SERVER] Failed to start server:", error);
    }
}

startServer();