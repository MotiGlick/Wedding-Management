// routes/guest.routes.js
const express = require('express');
const router = express.Router();
const { Guest } = require('../models/Guest.js'); // המודל של האורחים

router.post('/delete', async (req, res) => {
    const { fullName, email } = req.body;
    if (!fullName || !email) {
        return res.status(400).json({ success: false, message: 'נא להזין שם ומייל' });
    }

    const deleted = await Guest.destroy({ where: { fullName, email } });
    if (deleted) {
        res.json({ success: true, message: `האורח "${fullName}" נמחק בהצלחה` });
    } else {
        res.status(404).json({ success: false, message: 'לא נמצא אורח עם פרטים אלה' });
    }
});

module.exports = router;
