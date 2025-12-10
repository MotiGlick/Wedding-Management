const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

// ============================================================
// 🔧 הגדרת Gmail מותאמת ל-Render (Fix Timeout)
// ============================================================
const transporter = nodemailer.createTransport({
    service: 'gmail', // שימוש בשירות המובנה
    auth: {
        user: emailUser,
        pass: emailPass
    },
    // ⚠️ החלק הקריטי לתיקון הבעיה ב-Render:
    tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
    },
    // הגדרות רשת מתקדמות למניעת Timeout
    pool: true,              // שימוש ב-Connection Pooling
    maxConnections: 1,       // הגבלה לחיבור אחד (ג'ימייל אוהב את זה)
    rateLimit: 1,            // הגבלת קצב שליחה
    socketTimeout: 30000,    // זמן המתנה ארוך יותר (30 שניות)
    connectionTimeout: 30000,
    
    // 🔥 הטריק הכי חשוב: שימוש ב-IPv4 בלבד
    family: 4 
});

// בדיקת חיבור בטעינה
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ Gmail Error:", error.message);
    } else {
        console.log("✅ מחובר ל-Gmail בהצלחה (IPv4 Forced)");
    }
});

/**
 * שליחת מייל
 */
const sendMail = async (options) => {
    const mailOptions = {
        from: `"WedManage" <${emailUser}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || (options.html ? options.html.replace(/<[^>]*>?/gm, '') : '') 
    };

    try {
        console.log(`⏳ שולח ל-${options.to} (ניסיון דרך Gmail)...`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ המייל נשלח! ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error("❌ שגיאה בשליחה:", error.message);
        throw error;
    }
};

const sendNotification = async (recipientId, messageContent, channel) => {
    console.log(`[Notification] ${recipientId}: ${messageContent}`);
};

module.exports = { sendMail, sendNotification };