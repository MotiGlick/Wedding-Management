const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');
const { protect } = require('../middleware/auth.middleware');

// יצירה או עדכון של תזכורת
router.post('/', protect, async (req, res) => {
    try {
        const { taskId, triggerAt, type } = req.body;
        
        // 1. נסה למצוא תזכורת קיימת למשימה הזו
        let reminder = await Reminder.findOne({ where: { taskId: taskId } });

        if (reminder) {
            // === מצב עדכון ===
            // אם כבר יש תזכורת, נעדכן את הזמן שלה ואת הסטטוס
            console.log(`♻️ מעדכן תזכורת קיימת למשימה ${taskId}`);
            
            reminder.triggerAt = new Date(triggerAt);
            reminder.type = type || 'email';
            reminder.isSent = false; // חשוב: מאפסים ל-false כדי שתישלח שוב בזמן החדש
            await reminder.save();

            return res.status(200).json({ success: true, message: "התזכורת עודכנה בהצלחה", id: reminder.id });
        }

        // === מצב יצירה חדשה ===
        // אם לא קיימת תזכורת, ניצור אחת חדשה
        console.log(`✨ יוצר תזכורת חדשה למשימה ${taskId}`);
        
        reminder = await Reminder.create({
            taskId: taskId,
            triggerAt: new Date(triggerAt),
            type: type || 'email',
            isSent: false
        });

        res.status(201).json({ success: true, message: "תזכורת נוצרה", id: reminder.id });

    } catch (error) {
        console.error("Error creating/updating reminder:", error);
        res.status(500).json({ error: "שגיאה בשמירת התזכורת" });
    }
});

module.exports = router;