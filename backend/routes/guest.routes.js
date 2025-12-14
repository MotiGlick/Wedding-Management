const express = require('express');
const router = express.Router();
const Guest = require('../models/Guest');

// 1. ייבוא ה-Middleware בדיוק כמו ב-expenses.routes.js
const { protect } = require('../middleware/auth.middleware');

// ----- הוספה -----
// הוספנו את protect - עכשיו יש אימות!
router.post('/', protect, async (req, res) => {
    try {
        // 2. לוקחים את ה-ID האמיתי (req.user מלא בזכות protect)
        const userId = req.user.id;

        const { firstName, lastName, email, phone, rsvp, plusOne, diet, notes, side } = req.body;
        
        if (!firstName || !lastName || !rsvp) 
            return res.status(400).json({ success: false, message: 'firstName, lastName ו-rsvp הם חובה' });

        const guest = await Guest.create({ 
            firstName, 
            lastName, 
            email, 
            phone, 
            rsvp, 
            plusOne, 
            diet, 
            notes, 
            side,
            userId: userId // נשמר תחת היוזר הנכון
        });

        res.status(201).json(guest);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ----- מחיקה -----
// הוספנו את protect
router.post('/delete', protect, async (req, res) => {
    try {
        const userId = req.user.id; // שימוש ב-ID האמיתי
        const { email } = req.body;
        
        if (!email) return res.status(400).json({ success: false, message: 'נא להזין מייל' });

        const deleted = await Guest.destroy({ 
            where: { 
                email: email,
                userId: userId // מוחק רק מהרשימה של המשתמש הספציפי
            } 
        });

        if (deleted) res.json({ success: true, message: 'האורח נמחק בהצלחה' });
        else res.status(404).json({ success: false, message: 'לא נמצא אורח כזה בחשבון שלך' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'שגיאה במחיקת אורח' });
    }
});

// ----- קבלת כל האורחים -----
// הוספנו את protect
router.get('/', protect, async (req, res) => {
    try {
        const userId = req.user.id; // שימוש ב-ID האמיתי

        const guests = await Guest.findAll({ 
            where: { userId: userId }, // מביא רק את האורחים של המשתמש המחובר
            order: [['createdAt', 'DESC']] 
        });

        res.json(guests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'שגיאה בטעינת האורחים' });
    }
});

module.exports = router;