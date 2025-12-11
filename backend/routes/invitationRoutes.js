// backend/routes/invitationRoutes.js

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ייבוא המודלים והשירותים
const { Guest } = require('../models/associations'); 
const { sendMail } = require('../utils/notificationService');

// --- הגדרת תיקיית השמירה ---
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir); 
}

// --- הגדרת Multer ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, uploadDir) },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); 
    }
});
const upload = multer({ storage: storage });

// ============================================
// נתיב 1: העלאת תמונה
// ============================================
router.post('/upload', upload.single('invitationImage'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "לא נשלח קובץ תמונה" });
        
        console.log("Image uploaded successfully:", req.file.path);
        
        res.json({ 
            success: true, 
            message: "ההזמנה נשמרה בשרת!",
            filePath: req.file.path 
        });
    } catch (error) {
        console.error("Error inside upload route:", error);
        res.status(500).json({ error: "שגיאה בשמירת הקובץ בשרת" });
    }
});

// ============================================
// נתיב 2: שליחת הזמנות במייל (עם התיקון!)
// ============================================
router.post('/send-batch', async (req, res) => {
    try {
        const { sendToAll, guestIds } = req.body;
        
        // ביטלנו זמנית את השימוש ב-User ID כדי למנוע את באג ה-0 אורחים
        // const userId = req.user ? req.user.id : 1; 

        let guestsToSend = [];

        // שלב א: הבאת האורחים מה-DB (ללא סינון משתמש!)
        if (sendToAll) {
            guestsToSend = await Guest.findAll({
                where: { 
                    // userId: userId, // <--- שמנו בהערה זמנית
                    email: { [Op.ne]: null } 
                }
            });
        } else {
            if (!guestIds || guestIds.length === 0) {
                return res.status(400).json({ error: "לא נבחרו אורחים לשליחה" });
            }
            guestsToSend = await Guest.findAll({
                where: { 
                    id: { [Op.in]: guestIds }, 
                    // userId: userId // <--- שמנו בהערה זמנית
                }
            });
        }

        console.log(`Starting to send emails to ${guestsToSend.length} guests...`);

        // שלב ב: שליחת המיילים
        const results = [];
        for (const guest of guestsToSend) {
            if (guest.email) {
                try {
                    await sendMail({
                        to: guest.email,
                        subject: `הזמנה לחתונה של ${guest.firstName}!`, 
                        html: `
                            <div dir="rtl" style="text-align: right; font-family: Arial;">
                                <h2>היי ${guest.firstName},</h2>
                                <p>שמחים להזמינך לחתונה שלנו!</p>
                                <p>כנס למערכת לאישור הגעה.</p>
                                <br>
                                <p>באהבה!</p>
                            </div>
                        `
                    });
                    results.push({ email: guest.email, status: 'success' });
                } catch (err) {
                    console.error(`Failed to send to ${guest.email}`);
                    results.push({ email: guest.email, status: 'failed' });
                }
            }
        }

        res.json({ 
            success: true, 
            message: `תהליך השליחה הסתיים. נשלח ל-${results.filter(r => r.status === 'success').length} אורחים.` 
        });

    } catch (error) {
        console.error("Error in send-batch route:", error);
        res.status(500).json({ error: "שגיאה כללית בשרת בעת שליחת ההזמנות" });
    }
});

module.exports = router;