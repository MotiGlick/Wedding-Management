document.addEventListener('DOMContentLoaded', () => {
    // 1. בדיקת אבטחה
    const token = sessionStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'landing.html';
        return;
    }

    // הפעלת טעינת הנתונים
    loadDashboardData(token);
});

async function loadDashboardData(token) {
    try {
        const headers = { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // 2. ביצוע כל קריאות השרת במקביל
        const [guestsRes, tasksRes, expensesRes] = await Promise.all([
            fetch('/api/guests', { headers }),
            fetch('/api/tasks', { headers }),
            fetch('/api/expenses', { headers })
        ]);

        const guests = await guestsRes.json();
        const tasks = await tasksRes.json();
        const expenses = await expensesRes.json();

        // 3. עדכון הממשק
        updateGuestStats(guests);
        updateTaskStats(tasks);
        updateBudgetStats(expenses); // הפונקציה המעודכנת לגרף עגול

    } catch (error) {
        console.error('Error loading report data:', error);
        // אופציונלי: להציג הודעה למשתמש, או להשאיר את המצב הריק
    }
}

// --- לוגיקה: אורחים ---
function updateGuestStats(guests) {
    if (!Array.isArray(guests)) return;

    const totalInvited = guests.length;
    const confirmed = guests.filter(g => g.rsvp === 'yes').length;
    const declined = guests.filter(g => g.rsvp === 'no').length;
    const pending = totalInvited - confirmed - declined;

    // עדכון כרטיס KPI
    const kpiConfirmed = document.querySelector('.kpi-card .fa-check-circle').closest('.kpi-card').querySelector('.value');
    if (kpiConfirmed) kpiConfirmed.textContent = confirmed;

    // עדכון העיגולים הצבעוניים
    updateElementText('.rsvp-circle.confirmed .number', confirmed);
    updateElementText('.rsvp-circle.pending .number', pending);
    updateElementText('.rsvp-circle.declined .number', declined);

    // עדכון פס התקדמות
    const container = document.querySelector('.progress-bar-container');
    if (container && totalInvited > 0) {
        const percent = Math.round((confirmed / totalInvited) * 100);
        const fillBar = container.querySelector('.progress-fill');
        if (fillBar) {
            fillBar.style.width = `${percent}%`;
            fillBar.textContent = `${percent}%`;
        }
    }
}

// --- לוגיקה: משימות ---
function updateTaskStats(tasks) {
    if (!Array.isArray(tasks)) return;

    const openTasksCount = tasks.filter(t => !t.completed).length;

    const kpiTasks = document.querySelector('.kpi-card .fa-tasks').closest('.kpi-card').querySelector('.value');
    if (kpiTasks) kpiTasks.textContent = openTasksCount;
}

// --- לוגיקה מעודכנת: תקציב והוצאות (גרף עגול) ---
function updateBudgetStats(expenses) {
    if (!Array.isArray(expenses)) expenses = [];

    // סכימת ההוצאות
    const totalSpent = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
    
    // עדכון KPI עליון
    const kpiBudget = document.querySelector('.kpi-card .fa-wallet').closest('.kpi-card').querySelector('.value');
    if (kpiBudget) kpiBudget.textContent = formatCurrency(totalSpent);

    // עדכון הסכום במרכז הגרף העגול
    const pieTotalEl = document.getElementById('pieTotalAmount');
    if (pieTotalEl) pieTotalEl.textContent = formatCurrency(totalSpent);

    // --- בניית הגרף העגול ---
    const pieChartEl = document.getElementById('categoryPieChart');
    const legendEl = document.getElementById('categoryLegend');
    
    if (!pieChartEl || !legendEl) return;

    // 1. טיפול במצב ריק (אין הוצאות)
    if (totalSpent === 0 || expenses.length === 0) {
        pieChartEl.style.background = '#f1f3f5'; 
        legendEl.innerHTML = '<p style="text-align:center; color:#999; margin-top:10px;">לא נמצאו נתונים להצגה</p>';
        return;
    }

    // 2. קיבוץ הוצאות לפי קטגוריה
    const categoryMap = {};
    expenses.forEach(exp => {
        const cat = exp.category || 'כללי';
        if (!categoryMap[cat]) categoryMap[cat] = 0;
        categoryMap[cat] += Number(exp.amount || 0);
    });

    // 3. הגדרת פלטת צבעים יוקרתית
    const elegantColors = [
        '#C5A059', // זהב ראשי
        '#2C3E50', // כחול כהה
        '#B08D45', // זהב כהה
        '#4F6D8F', // כחול בינוני
        '#D4AF37', // זהב בהיר
        '#1A2C46', // נייבי עמוק
        '#E3C886', // שמפניה
        '#6c757d'  // אפור
    ];

    // 4. הכנת הנתונים לגרף
    // מיון מהגדול לקטן למראה אסתטי
    const sortedCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

    let gradientString = 'conic-gradient(';
    let currentPercentage = 0;
    let legendHTML = '';
    let colorIndex = 0;

    sortedCategories.forEach(([category, amount]) => {
        // חישוב אחוזים
        const percent = (amount / totalSpent) * 100;
        const endPercentage = currentPercentage + percent;
        
        // בחירת צבע
        const color = elegantColors[colorIndex % elegantColors.length];
        
        // הוספה למחרוזת הגרדיאנט (בניית פרוסת העוגה ב-CSS)
        gradientString += `${color} ${currentPercentage}% ${endPercentage}%, `;
        
        // בניית השורה במקרא
        legendHTML += `
            <div class="legend-item">
                <div class="legend-label-container">
                    <div class="legend-color-dot" style="background-color: ${color};"></div>
                    <span class="legend-name">${category}</span>
                </div>
                <div>
                    <span class="legend-percent">${Math.round(percent)}%</span>
                    <span class="legend-value">${formatCurrency(amount)}</span>
                </div>
            </div>
        `;

        // הכנה לאיטרציה הבאה
        currentPercentage = endPercentage;
        colorIndex++;
    });

    // הסרת הפסיק האחרון וסגירת הסוגריים
    gradientString = gradientString.slice(0, -2) + ')';

    // 5. החלת השינויים על ה-DOM
    pieChartEl.style.background = gradientString;
    legendEl.innerHTML = legendHTML;
}

// פונקציית עזר לעדכון טקסט באלמנט בטוח
function updateElementText(selector, text) {
    const el = document.querySelector(selector);
    if (el) el.textContent = text;
}

// פונקציית עזר לפרמוט כסף
function formatCurrency(num) {
    return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(num);
}