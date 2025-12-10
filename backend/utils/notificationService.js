const nodemailer = require('nodemailer');

// 1. שליפת המפתח של SendGrid מתוך Render
const sendgridApiKey = process.env.SENDGRID_API_KEY;

// 2. הגדרת ה-Transporter עבור SendGrid
const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 465,               // פורט 465 (SSL) הוא הטוב ביותר לעקוף חסימות ב-Render
    secure: true,            // חובה בפורט 465
    auth: {
        user: 'apikey',      // *** חשוב! ב-SendGrid המשתמש הוא תמיד המילה 'apikey' ***
        pass: sendgridApiKey // המפתח הארוך (מתחיל ב-SG...)
    }
});

// פונקציה לבדיקת חיבור (אופציונלי)
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ שגיאה בחיבור ל-SendGrid:", error.message);
    } else {
        console.log("✅ מחובר ל-SendGrid בהצלחה (Port 465)");
    }
});

const sendMail = async (options) => {
    if (!sendgridApiKey) {
        console.error("❌ שגיאה: חסר SENDGRID_API_KEY בהגדרות הסביבה (.env)");
        return;
    }

    const mailOptions = {
        // *** חשוב מאוד ***
        // הכתובת הזו חייבת להיות תואמת לכתובת שאימתת ב-SendGrid (Single Sender Verification)
        // אחרת תקבל שגיאת "Forbidden"
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
        console.error("❌ שגיאה בשליחת המייל (SendGrid):", error);
        // טיפול בשגיאות נפוצות של SendGrid
        if (error.response && error.response.body && error.response.body.errors) {
             console.error("פרטי השגיאה מ-SendGrid:", error.response.body.errors);
        }
    }
};

const sendNotification = async (recipientId, messageContent, channel) => {
    console.log(`[Notification] ${messageContent}`);
};

module.exports = { sendMail, sendNotification };