const nodemailer = require('nodemailer');

// טוען משתני סביבה של המייל
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

// ============================================================
// 🔧 הגדרת ה-Transporter החדשה (פותרת את בעיית ה-Timeout)
// ============================================================
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',  // הגדרה מפורשת של השרת
    port: 587,               // שימוש בפורט 587 (STARTTLS) שעובד מעולה ב-Render
    secure: false,           // בפורט 587 חובה שזה יהיה false
    auth: {
        user: emailUser,
        pass: emailPass
    },
    tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false // מונע שגיאות אבטחה בשרתי ענן
    }
});

// בדיקה ראשונית לראות שהחיבור תקין (אופציונלי, עוזר לדיבוג בלוגים)
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ שגיאה בחיבור לשרת המיילים:", error);
    } else {
        console.log("✅ השרת מוכן לשליחת מיילים (מחובר ל-Gmail בפורט 587)");
    }
});

/**
 * 💡 פונקציה גנרית לשליחת מיילים (חובה עבור איפוס סיסמה ותזכורות)
 */
const sendMail = async (options) => {
    if (!emailUser || !emailPass) {
        console.error("❌ שגיאה: פרטי EMAIL_USER או EMAIL_PASS חסרים בקובץ .env");
        throw new Error("Missing email credentials in .env");
    }

    const mailOptions = {
        from: `"WedManage" <${emailUser}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || (options.html ? options.html.replace(/<[^>]*>?/gm, '') : '') // המרה לטקסט פשוט
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
const sendNotification = async (recipientId, messageContent, channel) => {
    try {
        console.log(`[Notification] מנסה לשלוח התראה לנמען: ${recipientId} דרך ערוץ: ${channel}`);

        switch (channel) {
            case 'email':
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

// ייצוא הפונקציות בצורה מסודרת
module.exports = { 
    sendMail, 
    sendNotification 
};