const express = require('express');
const router = express.Router();
const Guest = require('../models/Guest');

// ----- הוספה (מתוקן!) -----
router.post('/', async (req, res) => {
    try {
        // 1. קודם כל משיגים את ה-ID של המשתמש
        const userId = req.user ? req.user.id : 1;

        const { firstName, lastName, email, phone, rsvp, plusOne, diet, notes, side } = req.body;
        
        if (!firstName || !lastName || !rsvp) 
            return res.status(400).json({ success: false, message: 'firstName, lastName ו-rsvp הם חובה' });

        // 2. התיקון: מוסיפים את userId ליצירה של האורח!
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
            userId: userId // <--- הנה החלק שהיה חסר לך!
        });

        res.status(201).json(guest);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ----- מחיקה (מומלץ לתקן שיוודא שהאורח שלך) -----
router.post('/delete', async (req, res) => {
    try {
        const userId = req.user ? req.user.id : 1;
        const { email } = req.body;
        
        if (!email) return res.status(400).json({ success: false, message: 'נא להזין מייל' });

        const deleted = await Guest.destroy({ 
            where: { 
                email: email,
                userId: userId // מוחק רק אם זה האורח שלך!
            } 
        });

        if (deleted) res.json({ success: true, message: 'האורח נמחק בהצלחה' });
        else res.status(404).json({ success: false, message: 'לא נמצא אורח כזה בחשבון שלך' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'שגיאה במחיקת אורח' });
    }
});

// ----- קבלת כל האורחים (זה היה בסדר, אבל עכשיו יהיה לו מה למצוא) -----
router.get('/', async (req, res) => {
    try {
        const userId = req.user ? req.user.id : 1;

        const guests = await Guest.findAll({ 
            where: { userId: userId }, 
            order: [['createdAt', 'DESC']] 
        });

        res.json(guests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'שגיאה בטעינת האורחים' });
    }
});

module.exports = router;