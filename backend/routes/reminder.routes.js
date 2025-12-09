const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder'); // ייבוא המודל שיצרת

// יצירת תזכורת חדשה
// הנתיב הוא '/' כי ב-server.js נגדיר שהקובץ הזה אחראי על '/api/reminders'
router.post('/', async (req, res) => {
    try {
        const { taskId, triggerAt, type } = req.body;
        
        const newReminder = await Reminder.create({
            taskId: taskId,
            triggerAt: new Date(triggerAt),
            type: type || 'email',
            isSent: false
        });

        res.status(201).json({ success: true, message: "תזכורת נוצרה", id: newReminder.id });
    } catch (error) {
        console.error("Error creating reminder:", error);
        res.status(500).json({ error: "שגיאה בשמירת התזכורת" });
    }
});

module.exports = router;