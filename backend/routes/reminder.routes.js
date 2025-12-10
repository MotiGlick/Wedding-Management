const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');
const { protect } = require('../middleware/auth.middleware'); // ייבוא נדרש

// יצירת תזכורת חדשה
// הוספת Middleware 'protect' לאימות המשתמש
router.post('/', protect, async (req, res) => {
    try {
        // המידע של המשתמש (כולל req.user.id) זמין כאן אם ה-Middleware עבר
        const { taskId, triggerAt, type } = req.body;
        
        // לוודא שהתזכורת מקושרת למשימה של המשתמש המאומת
        // הערה: בדיקה זו נדרשת אבל אינה קיימת כרגע, לביטחון צריך:
        // const task = await Task.findOne({ where: { id: taskId, userId: req.user.id } });
        // if (!task) return res.status(404).json({ error: "Task not found or unauthorized" });


        const newReminder = await Reminder.create({
            taskId: taskId,
            // אם ה-Frontend שלח ISO String תקין (עם התיקון הקודם), Sequelize יטפל בו נכון כ-UTC
            triggerAt: new Date(triggerAt),
            type: type || 'email',
            isSent: false
        });

        res.status(201).json({ success: true, message: "תזכורת נוצרה", id: newReminder.id });
    } catch (error) {
        console.error("Error creating reminder:", error);
        // שליחת הודעה מפורטת יותר ללקוח
        res.status(500).json({ error: "שגיאה בשמירת התזכורת. בדוק את לוג השרת." });
    }
});

module.exports = router;