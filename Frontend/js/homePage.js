// פונקציה מדומה (Mock) שמדמה שליפת נתונים רלוונטיים מה-DB
// ביישום אמיתי, פונקציה זו תשתמש ב-fetch() או Axios כדי לקרוא ל-API
async function fetchDashboardData() {
    // נתונים קבועים לדוגמה:
    const data = {
        weddingDate: '2026-01-20', 
        budget: {
            total: 60000, 
            spent: 45000  
        },
        rsvp: {
            confirmed: 185, 
            totalInvited: 250  
        },
        tasks: {
            open: 8 
        }
    };
    return data;
}

// פונקציה לחישוב ימים עד תאריך נתון
function calculateDaysRemaining(dateString) {
    const today = new Date();
    // יצירת תאריך החתונה בתחילת היום כדי למנוע בעיות אזורי זמן
    const weddingDate = new Date(dateString);
    weddingDate.setHours(0, 0, 0, 0); 
    
    // יצירת תאריך היום בתחילת היום
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);

    const timeDiff = weddingDate.getTime() - todayStart.getTime();
    
    if (timeDiff <= 0) return 0;
    
    // המרה ממילישניות לימים
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
}

// פונקציה לעדכון ה-KPI ב-DOM
async function updateKPIs() {
    // משיכת הנתונים המדומים
    const data = await fetchDashboardData();
    
    // 1. ימים לחתונה
    const daysRemaining = calculateDaysRemaining(data.weddingDate);
    document.getElementById('daysToWedding').textContent = daysRemaining;
    
    // 2. יתרת תקציב
    const remaining = data.budget.total - data.budget.spent;
    // פורמט כסף לשקלים (ILS) לדוגמה, או USD כפי שהיה מקודם
    const formattedRemaining = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(remaining); 
    document.getElementById('budgetRemaining').textContent = formattedRemaining;
    
    // הדגשה קריטית (אם נשאר פחות מ-20% מהתקציב הכולל)
    const budgetCard = document.getElementById('budgetCard');
    if (remaining < data.budget.total * 0.20) {
        budgetCard.classList.add('is-critical');
    }
    
    // 3. אישורי הגעה
    document.getElementById('rsvpHits').textContent = `${data.rsvp.confirmed}/${data.rsvp.totalInvited}`;
    
    // 4. מטלות פתוחות
    document.getElementById('openTasks').textContent = data.tasks.open;
}


document.addEventListener('DOMContentLoaded', () => {
    // קריאה לפונקציית עדכון הנתונים ברגע שה-DOM נטען
    updateKPIs(); 

    // --- לוגיקה של ניתובים ו-Alerts ---

    // 1. כפתור התנתקות
    const logoutBtn = document.getElementById('logoutButton');
    const LOGIN_PAGE_PATH = 'login.html'; 

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // ניקוי טוקן וניתוב
            localStorage.removeItem('authToken'); 
            console.log('Token removed from localStorage. User logged out.');
            window.location.href = LOGIN_PAGE_PATH; 
        });
    }

    // 2. מודול אורחים ואישורי הגעה
    const guestsModule = document.getElementById('guestsModule');
    if (guestsModule) {
        guestsModule.addEventListener('click', () => {
            alert('מעבר לרשימת מוזמנים');
        });
    }

    // 3. מודול דוחות וסטטיסטיקה
    const reportsModule = document.getElementById('reportsModule');
    if (reportsModule) {
        reportsModule.addEventListener('click', () => {
            alert('מעבר לדוחות וסטטיסטיקה');
        });
    }
});