// backend/routes/invitationRoutes.js

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');

// 1. ייבוא המודלים שלך
const { Guest } = require('../models/associations'); 

// 2. ייבוא שירות השליחה שכבר קיים אצלך!
const { sendMail } = require('../utils/notificationService');

// נתיב לשליחת הזמנות (מחובר למה שכתבנו ב-HTML)
// הכתובת המלאה תהיה: POST /api/invitations/send-batch
router.post('/send-batch', async (req, res) => {
    try {
        // שליפת הנתונים שהגיעו מה-HTML
        const { sendToAll, guestIds } = req.body;
        
        // כאן נניח שאתה משתמש ב-req.user.id (אם יש לך אימות משתמשים)
        // אם אין עדיין אימות, נשתמש זמנית ב-1, אבל חשוב לסדר את זה!
        const userId = req.user ? req.user.id : 1; 

        let guestsToSend = [];

        // --- שלב א: הבאת האורחים מה-DB ---
        
        if (sendToAll) {
            // אם המשתמש בחר "שלח לכולם" - מביאים את כל האורחים של המשתמש שיש להם אימייל
            guestsToSend = await Guest.findAll({
                where: { 
                    userId: userId,
                    email: { [Op.ne]: null } // רק מי שיש לו אימייל
                }
            });
        } else {
            // אם המשתמש בחר ידנית - מביאים רק את מי שברשימה
            if (!guestIds || guestIds.length === 0) {
                return res.status(400).json({ error: "לא נבחרו אורחים לשליחה" });
            }
            guestsToSend = await Guest.findAll({
                where: {
                    id: { [Op.in]: guestIds },
                    userId: userId
                }
            });
        }

        console.log(`מתחיל שליחה ל-${guestsToSend.length} אורחים...`);

        // --- שלב ב: שליחת המיילים בפועל ---

        // אנחנו עוברים אורח-אורח ושולחים לו מייל
        const results = [];
        
        for (const guest of guestsToSend) {
            if (guest.email) {
                try {
                    // שימוש בשירות ה-SendGrid שלך
                    await sendMail({
                        to: guest.email,
                        subject: `הזמנה לחתונה של ${guest.firstName}!`, 
                        // כאן אתה יכול להכניס HTML מעוצב או להשתמש ב-template
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
                    console.error(`נכשל בשליחה ל-${guest.email}`);
                    results.push({ email: guest.email, status: 'failed' });
                }
            }
        }

        // החזרת תשובה ללקוח (ל-HTML) שהכל עבר בשלום
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