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

    return `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
            
            <div style="background-color: #4CAF50; color: white; padding: 15px; text-align: center;">
                <h2 style="margin: 0;">🔔 תזכורת ממערכת WedManage</h2>
            </div>

            <div style="padding: 20px;">
                <h3 style="color: #333;">שלום רב,</h3>
                <p style="font-size: 16px; color: #555;">
                    זוהי תזכורת אוטומטית לגבי המשימה שלך:
                </p>
                
                <div style="background-color: #e8f5e9; border-right: 4px solid #4CAF50; padding: 15px; margin: 15px 0;">
                    <strong style="font-size: 18px; color: #2e7d32;">${title}</strong>
                    <br>
                    <span style="color: #666; font-size: 14px;">תאריך יעד: ${formattedDate}</span>
                </div>

                <p style="font-size: 14px; color: #777;">
                    אנא הכנס למערכת כדי לעדכן סטטוס או לבצע שינויים.
                </p>
                
                <div style="text-align: center; margin-top: 25px;">
                    <a href="https://your-project-url.onrender.com" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        כנס למערכת
                    </a>
                </div>
            </div>

            <div style="background-color: #333; color: #aaa; padding: 10px; text-align: center; font-size: 12px;">
                &copy; 2025 WedManage System. כל הזכויות שמורות.
            </div>
        </div>
    </div>
    `;
};

module.exports = { getReminderTemplate };