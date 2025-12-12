// backend/utils/emailTemplates.js

/**
 * פונקציה שמחזירה HTML מעוצב עבור תזכורת
 * @param {string} title - כותרת המשימה
 * @param {Date} date - תאריך המשימה
 * @returns {string} - מחרוזת HTML
 */
const getReminderTemplate = (title, date) => {
    // המרת התאריך לפורמט ישראלי קריא
    const formattedDate = new Date(date).toLocaleDateString('he-IL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    // אם התאריך כולל שעה, נציג גם אותה
    const dateObj = new Date(date);
    const timePart = dateObj.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    const formattedTime = timePart !== '00:00' ? ` בשעה: ${timePart}` : '';

    return `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; background-color: #c3448eff; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 6px rgba(34, 141, 212, 0.3); overflow: hidden;">
            
            <div style="background-color: #f7f7f7; color: #1d20e1ff; padding: 15px; border-bottom: 2px solid #ffcc00; text-align: right;">
                <h2 style="margin: 0; font-size: 20px;"><span style="color: #0de735ff; font-size: 1.2em;">⭐</span> תזכורת ממערכת WedManage</h2>
            </div>

            <div style="padding: 25px;">
                <h3 style="color: #333; margin-top: 0;">היי,</h3>
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                    זמן לבדוק את אחת המשימות החשובות שלך לקראת האירוע הגדול! 
                    <br>
                    זוהי תזכורת אוטומטית לגבי המשימה הבאה:
                </p>
                
                <div style="background-color: #fffde7; border-right: 4px solid #ffcc00; padding: 18px; margin: 20px 0; border-radius: 4px;">
                    <strong style="font-size: 18px; color: #333;">כותרת המשימה: ${title}</strong>
                    <br>
                    <span style="color: #777; font-size: 14px; margin-top: 5px; display: inline-block;">
                        תאריך יעד: ${formattedDate}${formattedTime}
                    </span>
                </div>

                <p style="font-size: 14px; color: #777;">
                    אנא הכנס למערכת כדי לעדכן סטטוס, להוסיף הערות או לבצע שינויים.
                </p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://your-project-url.onrender.com" style="background-color: #ffcc00; color: #333; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
                        מעבר לניהול משימות
                    </a>
                </div>
            </div>

            <div style="background-color: #f7f7f7; color: #999; padding: 10px; text-align: center; font-size: 11px; border-top: 1px solid #eee;">
                &copy; 2025 WedManage System. כל הזכויות שמורות.
                <br>
                מייל זה נשלח כשירות עבורך.
            </div>
        </div>
    </div>
    `;
};

module.exports = { getReminderTemplate };