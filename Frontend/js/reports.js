document.addEventListener('DOMContentLoaded', () => {
    // 1. בדיקת אבטחה (כמו בדף הבית)
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
        // הגדרת כותרות לבקשות (כולל הטוקן)
        const headers = { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // 2. ביצוע כל קריאות השרת במקביל לביצועים מהירים
        const [guestsRes, tasksRes, expensesRes] = await Promise.all([
            fetch('/api/guests', { headers }),  // שים לב: בראוט שלך אין כרגע protect, אבל כדאי לשלוח
            fetch('/api/tasks', { headers }),
            fetch('/api/expenses', { headers })
        ]);

        // המרת התשובות ל-JSON
        const guests = await guestsRes.json();
        const tasks = await tasksRes.json();
        const expenses = await expensesRes.json();

        // 3. חישוב ועדכון הממשק
        updateGuestStats(guests);
        updateTaskStats(tasks);
        updateBudgetStats(expenses);

    } catch (error) {
        console.error('Error loading report data:', error);
        alert('שגיאה בטעינת הנתונים. נא לנסות שוב מאוחר יותר.');
    }
}

// --- לוגיקה: אורחים ---
function updateGuestStats(guests) {
    if (!Array.isArray(guests)) return;

    // חישובים
    const totalInvited = guests.length;
    const confirmed = guests.filter(g => g.rsvp === 'yes').length;
    const declined = guests.filter(g => g.rsvp === 'no').length;
    // כל מה שהוא לא 'yes' ולא 'no' נחשב 'אולי' או 'טרם ענו'
    const pending = totalInvited - confirmed - declined;

    // עדכון כרטיס עליון (KPI)
    const kpiConfirmed = document.querySelector('.kpi-card .fa-check-circle').closest('.kpi-card').querySelector('.value');
    if (kpiConfirmed) kpiConfirmed.textContent = confirmed;

    // עדכון העיגולים הצבעוניים
    document.querySelector('.rsvp-circle.confirmed .number').textContent = confirmed;
    document.querySelector('.rsvp-circle.pending .number').textContent = pending;
    document.querySelector('.rsvp-circle.declined .number').textContent = declined;

    // עדכון פס התקדמות (אחוז תפוסה)
    const container = document.querySelector('.progress-bar-container');
    if (container && totalInvited > 0) {
        const percent = Math.round((confirmed / totalInvited) * 100);
        const fillBar = container.querySelector('.progress-fill');
        
        fillBar.style.width = `${percent}%`;
        fillBar.textContent = `${percent}%`;
    }
}

// --- לוגיקה: משימות ---
function updateTaskStats(tasks) {
    if (!Array.isArray(tasks)) return;

    // ספירת משימות שאינן מושלמות
    const openTasksCount = tasks.filter(t => !t.completed).length;

    // עדכון כרטיס KPI
    const kpiTasks = document.querySelector('.kpi-card .fa-tasks').closest('.kpi-card').querySelector('.value');
    if (kpiTasks) kpiTasks.textContent = openTasksCount;
}

// --- לוגיקה: תקציב והוצאות ---
function updateBudgetStats(expenses) {
    if (!Array.isArray(expenses)) return;

    // הגדרת תקציב ידני (כי אין כרגע ב-DB שדה לתקציב כולל)
    // אם תרצה בעתיד לשמור את זה בשרת, תצטרך להוסיף שדה ב-User או טבלה נפרדת
    const TOTAL_BUDGET = 120000; 

    // סכימת ההוצאות
    // הנחה: לכל הוצאה יש שדה 'amount' ושדה 'category'
    const totalSpent = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
    
    // עדכון KPI תקציב (מראה כמה נשאר או כמה בוזבז - לבחירתך)
    // כאן נציג את הסכום הכולל שתוכנן, או את היתרה
    const kpiBudget = document.querySelector('.kpi-card .fa-wallet').closest('.kpi-card').querySelector('.value');
    if (kpiBudget) {
        // מציג סה"כ הוצאות
        kpiBudget.textContent = formatCurrency(totalSpent);
        // או אם תרצה להציג יתרה: formatCurrency(TOTAL_BUDGET - totalSpent)
    }

    // --- בניית גרף הקטגוריות דינמית ---
    
    // 1. קיבוץ הוצאות לפי קטגוריה
    const categoryMap = {};
    expenses.forEach(exp => {
        const cat = exp.category || 'כללי';
        if (!categoryMap[cat]) categoryMap[cat] = 0;
        categoryMap[cat] += Number(exp.amount || 0);
    });

    // 2. מציאת אלמנט הגרף ב-DOM
    const barChartContainer = document.querySelector('.bar-chart');
    if (barChartContainer) {
        barChartContainer.innerHTML = ''; // ניקוי הנתונים הסטטיים (הדוגמה)

        // 3. יצירת שורות הגרף
        for (const [category, amount] of Object.entries(categoryMap)) {
            // חישוב אחוז מסך ההוצאות (ולא מהתקציב הכללי, כדי שהגרף יראה יחסי הוצאות)
            // או: אחוז מהתקציב הכללי. נלך על אחוז מסך ההוצאות:
            let percent = 0;
            if (totalSpent > 0) {
                percent = Math.round((amount / totalSpent) * 100);
            }

            // יצירת ה-HTML
            const row = document.createElement('div');
            row.className = 'bar-row';
            row.innerHTML = `
                <span class="label">${category}</span>
                <div class="bar-track">
                    <div class="bar-fill" style="width: ${percent}%;">${percent}%</div>
                </div>
                <span style="font-size:12px; margin-right:10px;">${formatCurrency(amount)}</span>
            `;
            barChartContainer.appendChild(row);
        }
        
        // אם אין הוצאות בכלל
        if (expenses.length === 0) {
            barChartContainer.innerHTML = '<p style="text-align:center; color:#999;">עדיין לא הוזנו הוצאות</p>';
        }
    }
}

// פונקציית עזר לפרמוט כסף
function formatCurrency(num) {
    return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(num);
}