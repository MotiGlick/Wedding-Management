// backend/routes/invitationRoutes.js

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken'); // נוסף כדי לזהות את המשתמש בתצוגה המקדימה

const { Guest, User } = require('../models/associations'); 
const { sendMail } = require('../utils/notificationService');

// ⚠️ ייבוא מנגנון ההגנה - ודא שהנתיב תואם למיקום הקובץ שלך! ⚠️
// אם הקובץ שלך נקרא אחרת (למשל auth.js) או נמצא בתיקייה אחרת, שנה את הנתיב כאן:
const { protect } = require('../middleware/authMiddleware'); 

const uploadDir = path.join(__dirname, '../uploads'); 

if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true }); 
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, uploadDir) },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); 
    }
});
const upload = multer({ storage: storage });

// ============================================
// נתיב 1: העלאת תמונה (מוגן על ידי protect)
// ============================================
router.post('/upload', protect, upload.single('invitationImage'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "לא נשלח קובץ תמונה" });

        const cleanPath = 'uploads/' + req.file.filename;

        // מכיוון שיש protect, אנחנו בטוחים ש-req.user.id קיים והוא נכון!
        const userId = req.user.id;
        
        console.log(`✅ שומר ל-DB את הנתיב: ${cleanPath} עבור משתמש: ${userId}`);

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
// נתיב 2: שליפת תמונה קיימת (חכם - משרת גם את החתן וגם את האורחים)
// ============================================
router.get('/current', async (req, res) => {
    try {
        let userId = req.query.userId; // מנסה לקחת מהקישור (לאורחים)

        // אם אין ID בקישור, מנסה לקחת מהטוקן (עבור המשתמש המחובר שצופה בתצוגה המקדימה)
        if (!userId && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
            } catch (err) {
                console.log("No valid token found in /current, moving on...");
            }
        }

        // אם עדיין אין משתמש, נחזיר שאין תמונה (במקום לשייך בטעות למשתמש 1)
        if (!userId) {
            return res.json({ hasImage: false });
        }

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
// נתיב 3: שליחת הזמנות במייל (מוגן על ידי protect)
// ============================================
router.post('/send-batch', protect, async (req, res) => {
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

                            <!-- שים לב שכאן אנחנו משתמשים ב-req.user.id האמיתי שהגיע מהטוקן -->
                            <a href="https://objective-crow-summar-7375e746.koyeb.app/invitation.html?userId=${req.user.id}"
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