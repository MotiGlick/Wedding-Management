const express = require('express');
const router = express.Router();
const Guest = require('../models/Guest');

// ייבוא ה-Middleware לאימות
const { protect } = require('../middleware/auth.middleware');

// ----- הוספה -----
router.post('/', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        const { firstName, lastName, email, phone, rsvp, plusOne, diet, notes, side } = req.body;
        
        // נדרש רק שם פרטי ושם משפחה
        if (!firstName || !lastName) {
            return res.status(400).json({ success: false, message: 'שם פרטי ושם משפחה הם שדות חובה' });
        }

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

// ----- מחיקה חכמה לפי ID -----
router.delete('/:id', protect, async (req, res) => {
    try {
        const userId = req.user.id; 
        const guestId = req.params.id; // לוקח את ה-ID מהנתיב
        
        // מוחק רק אם ה-ID תואם והאורח שייך למשתמש
        const deleted = await Guest.destroy({ 
            where: { 
                id: guestId,
                userId: userId 
            } 
        });

        if (deleted) {
            res.json({ success: true, message: 'האורח נמחק בהצלחה' });
        } else {
            res.status(404).json({ success: false, message: 'לא נמצא אורח כזה בחשבון שלך' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'שגיאה במחיקת אורח' });
    }
});

// ----- קבלת כל האורחים -----
router.get('/', protect, async (req, res) => {
    try {
        const userId = req.user.id; 

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