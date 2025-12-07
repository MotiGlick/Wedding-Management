const nodemailer = require('nodemailer');

// טוען משתני סביבה של המייל
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

// הגדרת ה-Transporter של Nodemailer (שימוש ב-Gmail)
// וודא ש-EMAIL_USER ו-EMAIL_PASS מוגדרים בקובץ .env!
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: emailUser,
        pass: emailPass
    }
});

/**
 * 💡 פונקציה גנרית לשליחת מיילים (חובה עבור איפוס סיסמה)
 */
exports.sendMail = async (options) => {
    if (!emailUser || !emailPass) {
        console.error("❌ שגיאה: פרטי EMAIL_USER או EMAIL_PASS חסרים בקובץ .env");
        throw new Error("Missing email credentials in .env");
    }

    const mailOptions = {
        from: `"WedManage" <${emailUser}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>?/gm, '') // המרה לטקסט פשוט
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [MAIL] הודעה נשלחה בהצלחה: ${info.messageId} לכתובת: ${options.to}`);
        return info;
    } catch (error) {
        console.error("❌ שגיאה בשליחת המייל (Nodemailer):", error);
        throw error; // זורק את השגיאה כדי שהקונטרולר יתפוס אותה
    }
};

/**
 * פונקציה להתראות מערכת (עוטפת את sendMail עבור התראות במייל)
 */
exports.sendNotification = async (recipientId, messageContent, channel) => {
    try {
        console.log(`[Notification] מנסה לשלוח התראה לנמען: ${recipientId} דרך ערוץ: ${channel}`);

        // כאן היית אמור לשלוף את האימייל של המשתמש לפי ה-ID
        // לצורך הפשטות כרגע, נניח שהפונקציה מקבלת אימייל ישירות או מטפלת בזה בנפרד
        
        switch (channel) {
            case 'email':
                // במקרה הזה הפונקציה הזו תצטרך לקבל אימייל, לא ID. 
                // אם אתה משתמש בה ב-message.controller, וודא שאתה מעביר את האימייל.
                console.log(`[EMAIL] אנא השתמש ב-sendMail ישירות לשליחת מיילים.`);
                break;
            case 'in-app':
            default:
                console.log(`[IN-APP] נשמרה התראה פנימית עבור ${recipientId}: ${messageContent}`);
                break;
        }

    } catch (error) {
        console.error("❌ שגיאה בשליחת התראה:", error);
    }
};

// ייצוא שתי הפונקציות
module.exports = { 
    sendMail: exports.sendMail, 
    sendNotification: exports.sendNotification 
};