// backend/routes/message.routes.js

const express = require('express');
const router = express.Router();
// ייבוא הקונטרולר שיצרנו עבור לוגיקת ההודעות
const controller = require('../controllers/message.controller'); 
// ייבוא ה-Middleware הקיים שלך לאימות
const { protect } = require('../middleware/auth.middleware'); 

/**
 * POST /api/messages/send
 * נתיב לשליחת הודעה חדשה. דורש אימות משתמש.
 */
router.post('/send', protect, controller.sendMessage); 

// אם תרצה להוסיף בעתיד נתיבים נוספים, כמו:
// router.get('/', protect, controller.getInbox);
// router.put('/:id/read', protect, controller.markAsRead);


module.exports = router;