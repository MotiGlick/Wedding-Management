// routes/guest.routes.js
const express = require('express');
const router = express.Router();
const Guest = require('../models/Guest'); // חשוב!! לא { Guest } אלא Guest


// ----- הוספה -----
// POST /api/guests
router.post('/', async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            rsvp,
            plusOne,
            diet,
            notes
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
            notes
        });

        res.status(201).json(guest);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'שגיאה בהוספת אורח' });
    }
});

// ----- מחיקה -----
// POST /api/guests/delete
router.post('/delete', async (req, res) => {
    try {
        const { fullName, email } = req.body;

        if (!fullName || !email) {
            return res.status(400).json({
                success: false,
                message: 'נא להזין שם מלא ומייל'
            });
        }

        const deleted = await Guest.destroy({
            where: { fullName, email }
        });

        if (deleted) {
            res.json({
                success: true,
                message: `האורח "${fullName}" נמחק בהצלחה`
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'לא נמצא אורח עם הפרטים האלה'
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'שגיאה במחיקת אורח' });
    }
});

module.exports = router;
