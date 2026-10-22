const nodemailer = require('nodemailer');

// 1. שליפת פרטי ההתחברות לג'ימייל מתוך Render
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

// 2. הגדרת ה-Transporter עבור Gmail (הרבה יותר קצר ופשוט מ-SendGrid)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: emailUser,
        pass: emailPass
    }
});

// פונקציה לבדיקת חיבור - מופעלת פעם אחת כשהשרת עולה כדי לוודא שהסיסמה תקינה
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ שגיאה בחיבור לשרתי Gmail:", error.message);
        console.error("ודא שהשתמשת ב'סיסמת אפליקציה' (App Password) ולא בסיסמה הרגילה של המייל.");
    } else {
        console.log("✅ מחובר ל-Gmail בהצלחה! מוכן לשליחת מיילים.");
    }
});

const sendMail = async (options) => {
    if (!emailUser || !emailPass) {
        console.error("❌ שגיאה: חסרים EMAIL_USER או EMAIL_PASS בהגדרות הסביבה (.env)");
        return;
    }

    const mailOptions = {
        from: emailUser, 
        to: options.to,
        subject: options.subject,
        html: options.html
    };

    try {
        console.log(`⏳ שולח מייל דרך Gmail ל-${options.to}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [MAIL] נשלח בהצלחה! ID: ${info.messageId}`);
        return info;
    } catch (error) {
        // --- הדפסת השגיאה המלאה ל-Debugging ---
        console.error("❌ שגיאה בשליחת המייל (Gmail):", error.message);
        
        // *הערה חשובה:* מכיוון שאנו נמצאים בפונקציה sendMail, כדי שה-Cron Job ידע שהמייל נכשל,
        // הפונקציה צריכה לזרוק את השגיאה הלאה.
        throw error; // זורק את השגיאה כדי שה-Cron Job (server.js) או ה-Controller ילכדו אותה
    }
};

const sendNotification = async (recipientId, messageContent, channel) => {
    console.log(`[Notification] ${messageContent}`);
};

module.exports = { sendMail, sendNotification };