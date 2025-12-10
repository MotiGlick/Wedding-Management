const nodemailer = require('nodemailer');

// 1. שליפת המפתח של SendGrid מתוך Render
const sendgridApiKey = process.env.SENDGRID_API_KEY;

// 2. הגדרת ה-Transporter עבור SendGrid
const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 2525,              // <--- פורט 2525 (פורט הגיבוי של SendGrid)
    secure: false,           // <--- חובה לשנות ל-FALSE בפורט הזה
    auth: {
        user: 'apikey',
        pass: sendgridApiKey // שימוש במפתח ה-API
    },
    tls: {
        rejectUnauthorized: false
    }
});

// פונקציה לבדיקת חיבור (אופציונלי)
transporter.verify((error, success) => {
    if (error) {
        //
        console.error("❌ שגיאה בחיבור ל-SendGrid:", error.message);
    } else {
        //
        console.log("✅ מחובר ל-SendGrid בהצלחה (Port 465)");
    }
});

const sendMail = async (options) => {
    if (!sendgridApiKey) {
        //
        console.error("❌ שגיאה: חסר SENDGRID_API_KEY בהגדרות הסביבה (.env)");
        return;
    }

    const mailOptions = {
        // הכתובת הזו חייבת להיות תואמת לכתובת שאימתת ב-SendGrid
        from: 'wedmanageweb@gmail.com', 
        
        to: options.to,
        subject: options.subject,
        html: options.html
    };

    try {
        console.log(`⏳ שולח מייל דרך SendGrid ל-${options.to}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [MAIL] נשלח בהצלחה! ID: ${info.messageId}`);
        return info;
    } catch (error) {
        // --- שינוי 1: הדפסת השגיאה המלאה ל-Debugging ---
        console.error("❌ שגיאה בשליחת המייל (SendGrid):", error);
        
        //
        // טיפול בשגיאות נפוצות של SendGrid (אם יש response object)
        if (error.response && error.response.body && error.response.body.errors) {
             console.error("פרטי השגיאה מ-SendGrid:", error.response.body.errors);
        } else {
             // --- שינוי 2: לכידת שגיאות רשת או שגיאות אחרות (כמו ETIMEDOUT) ---
             console.error("שגיאה נוספת/רשת:", error.message);
        }
        // *הערה חשובה:* מכיוון שאנו נמצאים בפונקציה sendMail, כדי שה-Cron Job ידע שהמייל נכשל,
        // הפונקציה צריכה לזרוק את השגיאה הלאה.
        throw error; // זורק את השגיאה כדי שה-Cron Job (server.js) ילכוד אותה וימנע עדכון DB
    }
};

const sendNotification = async (recipientId, messageContent, channel) => {
    console.log(`[Notification] ${messageContent}`);
};

module.exports = { sendMail, sendNotification };