const express = require('express');
const router = express.Router();
const Guest = require('../models/Guest');


// ----- הוספה -----
router.post('/', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, rsvp, plusOne, diet, notes, side } = req.body;
        if (!firstName || !lastName || !rsvp) 
            return res.status(400).json({ success: false, message: 'firstName, lastName ו-rsvp הם חובה' });

        const guest = await Guest.create({ firstName, lastName, email, phone, rsvp, plusOne, diet, notes, side });
        res.status(201).json(guest);
    } catch (err) {
       console.error(err);
res.status(500).json({ success: false, message: err.message });

    }
});

// ----- מחיקה -----
router.post('/delete', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'נא להזין מייל' });

        const deleted = await Guest.destroy({ where: { email } });
        if (deleted) res.json({ success: true, message: 'האורח נמחק בהצלחה' });
        else res.status(404).json({ success: false, message: 'לא נמצא אורח עם המייל הזה' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'שגיאה במחיקת אורח' });
    }
});

// ----- קבלת כל האורחים -----
router.get('/', async (req, res) => {
    try {
        const guests = await Guest.findAll({ order: [['createdAt','DESC']] });
        res.json(guests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'שגיאה בטעינת האורחים' });
    }
});

module.exports = router;
