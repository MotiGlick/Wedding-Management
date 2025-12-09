// --- 1. שומר הסף (Security Check) ---
// בודק אם המשתמש מחובר לפני שטוענים את הדף
(function checkLogin() {
    // login.js שמר את הטוקן ב-sessionStorage, אז נבדוק שם
    const token = sessionStorage.getItem('authToken');

    if (!token) {
        // אם אין טוקן, המשתמש לא מחובר -> זרוק אותו לדף הנחיתה
        window.location.href = 'landing.html'; 
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. ניהול כפתור התנתקות ---
    const logoutBtn = document.querySelector('.logout-btn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault(); // מניעת התנהגות ברירת מחדל
            performLogout();
        });
    }

});

/**
 * פונקציה לביצוע התנתקות מסודרת
 */
function performLogout() {
    // שלב א: מחיקת נתונים רגישים מהזיכרון המקומי
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    
    // שלב ב: לוג לצורך דיבוג (אופציונלי)
    console.log('User logged out, storage cleared.');

    // שלב ג: מעבר לדף הנחיתה ומחיקת ההיסטוריה (כדי למנוע חזרה עם כפתור Back)
    window.location.replace('landing.html');
}