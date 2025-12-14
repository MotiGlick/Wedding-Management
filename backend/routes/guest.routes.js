const express = require('express');
const router = express.Router();
const Guest = require('../models/Guest');

// ----- Middleware קטן לוודא התחברות -----
const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Not authenticated'
        });
    }
    next();
};

// ----- הוספת אורח -----
router.post('/', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            firstName,
            lastName,
            email,
            phone,
            rsvp,
            plusOne,
            diet,
            notes,
            side
        } = req.body;

        if (!firstName || !lastName || !rsvp) {
            return res.status(400).json({
                success: false,
                message: 'firstName, lastName ו-rsvp הם חובה'
            });
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
            userId
        });

        res.status(201).json(guest);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

// ----- מחיקת אורח -----
router.post('/delete', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'נא להזין מייל'
            });
        }

        const deleted = await Guest.destroy({
            where: {
                email,
                userId
            }
        });

        if (deleted) {
            res.json({ success: true, message: 'האורח נמחק בהצלחה' });
        } else {
            res.status(404).json({
                success: false,
                message: 'לא נמצא אורח כזה בחשבון שלך'
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'שגיאה במחיקת אורח'
        });
    }
});

// ----- קבלת כל האורחים של המשתמש -----
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        const guests = await Guest.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']]
        });

        res.json(guests);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'שגיאה בטעינת האורחים'
        });
    }
});

module.exports = router;
