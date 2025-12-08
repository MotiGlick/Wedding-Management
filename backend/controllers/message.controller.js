// backend/controllers/message.controller.js

// ייבוא המודלים User ו-Message מתוך קובץ הקישורים (associations.js)
// משתמשים ב-User כדי לאחזר את האימייל של הנמען ושם המשתמש של השולח
const { Message, User } = require('../models/associations');
// ייבוא שירות ההתראות (הכולל את לוגיקת Nodemailer)
const { sendNotification } = require('../utils/notificationService'); 

/**
 * [POST] /api/messages/send
 * Endpoint לשליחת הודעה חדשה.
 * 1. שומר את ההודעה ב-DB.
 * 2. מאחזר את פרטי הנמען (Email).
 * 3. מפעיל את שירות שליחת ההתראות.
 * * נתיב זה מוגן על ידי ה-auth.middleware, המבטיח ש-req.user.id תקין.
 */
exports.sendMessage = async (req, res) => {
    try {
        const { recipientId, content, notificationChannel } = req.body;
        // מזהה השולח מחולץ אוטומטית מה-JWT על ידי ה-auth.middleware
        const senderId = req.user.id; 

        if (!recipientId || !content) {
            return res.status(400).json({ msg: 'חסרים נמען ותוכן הודעה.' });
        }
        
        // 1. שמירת ההודעה במסד הנתונים (Sequelize)
        const newMessage = await Message.create({
            senderId: senderId,
            recipientId: recipientId,
            content: content,
            notificationChannel: notificationChannel 
        });

        console.log(`✅ הודעה נשמרה ב-DB עם ID: ${newMessage.id}`);

        // 2. אחזור פרטי הנמען והשולח לצורך שליחת המייל/התראה
        // אחזור אימייל הנמען (חובה לשליחת מייל) ואת שם המשתמש של השולח
        const recipient = await User.findByPk(recipientId, { attributes: ['email'] });
        const sender = await User.findByPk(senderId, { attributes: ['username'] }); 

        if (!recipient || !recipient.email) {
            console.warn(`⚠️ הודעה נשמרה, אך לא ניתן לשלוח התראה: נמען עם ID ${recipientId} לא נמצא או חסר אימייל.`);
            // ממשיך ומחזיר הצלחה כי ההודעה נשמרה, רק ההתראה נכשלה
            return res.status(201).json({ message: 'הודעה נשמרה. לא נשלחה התראה.', data: newMessage });
        }
        
        const senderName = sender?.username || 'משתמש אנונימי';
        
        // 3. הפעלת מנגנון שליחת התראה
        await sendNotification(
            recipient.email, // כתובת המייל של הנמען
            senderName,      // שם השולח שישמש בכותרת המייל
            content,         // תוכן ההודעה
            notificationChannel || newMessage.notificationChannel // ערוץ השליחה
        );

        res.status(201).json({
            message: 'הודעה נשלחה בהצלחה!',
            data: newMessage
        });

    } catch (error) {
        console.error("❌ שגיאה בשליחת הודעה:", error);
        res.status(500).json({ error: 'שגיאת שרת פנימית בשליחת הודעה.' });
    }
};