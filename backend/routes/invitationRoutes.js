// backend/routes/invitationRoutes.js

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ייבוא המודלים - מוודאים ש-User מיובא כדי למנוע קריסה
const { Guest, User } = require('../models/associations'); 
const { sendMail } = require('../utils/notificationService');

// --- תיקון טכני יחיד: מיקום התיקייה ---
// משתמשים ב-path.join כדי להבטיח שהקבצים יישמרו בתוך backend/uploads
const uploadDir = path.join(__dirname, '../uploads'); 

if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true }); 
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
// נתיב 1: העלאת תמונה + שמירה ב-DB
// ============================================
router.post('/upload', upload.single('invitationImage'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "לא נשלח קובץ תמונה" });

        // --- תיקון טכני: שמירת הנתיב ---
        // לוקחים את שם הקובץ ומוסיפים לו uploads/ כדי שהדפדפן ידע לקרוא אותו
        const cleanPath = 'uploads/' + req.file.filename;

        const userId = req.user ? req.user.id : 1;
        
        console.log(`✅ שומר ל-DB את הנתיב: ${cleanPath}`);

        await User.update(
            { invitationImage: cleanPath },
            { where: { id: userId } }
        );
        
        res.json({ 
            success: true, 
            message: "ההזמנה נשמרה בשרת ובמסד הנתונים!",
            filePath: cleanPath 
        });

    } catch (error) {
        console.error("Error inside upload route:", error);
        res.status(500).json({ error: "שגיאה בשמירת הקובץ" });
    }
});

// ============================================
// נתיב 2: שליפת תמונה קיימת
// ============================================
router.get('/current', async (req, res) => {
    try {
        const userId = req.query.userId || (req.user ? req.user.id : 1);
        const user = await User.findByPk(userId, { attributes: ['invitationImage'] });
        
        if (user && user.invitationImage) {
            res.json({ hasImage: true, imageUrl: user.invitationImage });
        } else {
            res.json({ hasImage: false });
        }
    } catch (error) {
        console.error("Error fetching current image:", error);
        res.status(500).json({ error: "שגיאה בטעינת תמונה" });
    }
});

// ============================================
// נתיב 3: שליחת הזמנות במייל (עם הטקסט שלך!)
// ============================================
router.post('/send-batch', async (req, res) => {
    try {
        const { sendToAll, guestIds } = req.body;
        let guestsToSend = [];

        if (sendToAll) {
            guestsToSend = await Guest.findAll({
                where: { email: { [Op.ne]: null } }
            });
        } else {
            if (!guestIds || guestIds.length === 0) {
                return res.status(400).json({ error: "לא נבחרו אורחים" });
            }
            guestsToSend = await Guest.findAll({
                where: { id: { [Op.in]: guestIds } }
            });
        }

        console.log(`Sending emails to ${guestsToSend.length} guests...`);

        const results = [];
        for (const guest of guestsToSend) {
            if (guest.email) {
                try {
                    await sendMail({
                        to: guest.email,
                        subject: `הזמנה לחתונה שלנו!`, 
                        html: `
                            <div dir="rtl" style="text-align: right; font-family: Arial;">
                            <h2>היי ${guest.firstName},</h2>
                            <p>שמחים להזמינך לחתונה שלנו!</p>
                            <p>לצפייה בהזמנה ואישור הגעה, היכנס/י לקישור:</p>

                            <a href="https://objective-crow-summar-7375e746.koyeb.app/invitation.html?userId=${req.user ? req.user.id : 1}"
                            style="font-size:18px; color:#1a73e8;">
                            לחץ כאן לפתיחת ההזמנה 🎉
                            </a>

                            <br><br>
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
            message: `נשלח ל-${results.filter(r => r.status === 'success').length} אורחים.` 
        });

    } catch (error) {
        console.error("Error in send-batch route:", error);
        res.status(500).json({ error: "שגיאה כללית" });
    }
});

module.exports = router;