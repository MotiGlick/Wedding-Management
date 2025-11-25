// budget_script.js

// קבלת הפניות לאלמנטים ב-DOM
const expenseForm = document.getElementById('expenseForm');
const expensesTableBody = document.getElementById('expensesTableBody');

// אלמנטים חדשים לסיכום ולעדכון תקציב
const totalBudgetEl = document.getElementById('totalBudget');
const totalPaidEl = document.getElementById('totalPaid');
const totalPendingEl = document.getElementById('totalPending');
const remainingBudgetEl = document.getElementById('remainingBudget');
const progressTextEl = document.getElementById('progressText');
const progressBarEl = document.getElementById('progressBar');
const progressLabelEl = document.getElementById('progressLabel');

// אלמנטים לעדכון התקציב
const editBudgetBtn = document.getElementById('editBudgetBtn');
const saveBudgetBtn = document.getElementById('saveBudgetBtn');
const budgetInputArea = document.getElementById('budgetInputArea');
const newBudgetAmountInput = document.getElementById('newBudgetAmount');

// משתנים גלובליים לשמירת הנתונים הפיננסיים
let totalBudget = Number(localStorage.getItem('totalBudget')) || 250000;
let expenses = []; // מערך ריק, יאוכלס על ידי fetchExpenses()

// =======================================================
// פונקציות עזר
// =======================================================

/**
 * מחלץ את ה-JWT מ-localStorage.
 */
function getToken() {
    return localStorage.getItem('token'); 
}

/**
 * פונקציה לעיצוב מספר (סכום כסף).
 * @param {number} amount - הסכום.
 * @returns {string} - סכום מעוצב עם ₪.
 */
function formatCurrency(amount) {
    return `₪ ${Number(amount).toLocaleString('he-IL')}`;
}

/**
 * פונקציה לעיצוב תאריך לפורמט ישראלי (DD/MM/YYYY).
 * @param {string} dateString - תאריך בפורמט ISO (YYYY-MM-DD).
 * @returns {string} - תאריך מעוצב.
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000).toLocaleDateString('he-IL');
}

/**
 * מציגה את השורה בטבלה.
 * @param {Object} expense - אובייקט ההוצאה.
 */
function renderExpenseRow(expense) {
    // יצירת שורה חדשה (<tr>)
    const newRow = expensesTableBody.insertRow();
    
    // קטגוריה (תא 0)
    newRow.insertCell(0).innerHTML = expense.category;

    // סכום (תא 1)
    newRow.insertCell(1).innerHTML = formatCurrency(expense.amount);
    
    // תאריך (תא 2)
    newRow.insertCell(2).innerHTML = formatDate(expense.date); 
    
    // סטטוס (תא 3)
    let cell4 = newRow.insertCell(3);
    cell4.innerHTML = (expense.status === 'paid' ? 'שולם' : 'טרם שולם');
    cell4.classList.add(expense.status); // מוסיף קלאס לצבע ירוק/אדום
    
    // הערות (תא 4)
    newRow.insertCell(4).innerHTML = expense.notes || '-'; // מציג מקף אם אין הערות
}


// =======================================================
// לוגיקת עדכון תקציב
// =======================================================

/**
 * מעדכנת את כלל הסכומים המוצגים על המסך ואת פס ההתקדמות, 
 * על בסיס נתוני ההוצאות המעודכנים.
 * @param {Array<Object>} currentExpenses - מערך ההוצאות הנוכחי
 */
function updateAllSummaries(currentExpenses) {
    let totalPaid = 0;
    let totalPending = 0;

    // חישוב מחדש של הסיכומים מתוך נתוני השרת
    currentExpenses.forEach(exp => {
        if (exp.status === 'paid') {
            totalPaid += exp.amount;
        } else {
            totalPending += exp.amount;
        }
    });
    
    // שמירת סכומים מעודכנים ב-localStorage רק לצורך הצגה מיידית אם רוצים
    localStorage.setItem('totalPaid', totalPaid);
    localStorage.setItem('totalPending', totalPending);

    const totalSpent = totalPaid + totalPending;
    const remainingBudget = totalBudget - totalSpent;

    totalBudgetEl.textContent = formatCurrency(totalBudget);
    totalPaidEl.textContent = formatCurrency(totalPaid);
    totalPendingEl.textContent = formatCurrency(totalPending);
    remainingBudgetEl.textContent = formatCurrency(remainingBudget);
    
    remainingBudgetEl.parentElement.classList.remove('remaining', 'spent');
    remainingBudgetEl.parentElement.classList.add(remainingBudget >= 0 ? 'remaining' : 'spent');


    // חישוב אחוז ניצול
    const usagePercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const displayPercent = Math.min(100, usagePercent);
    
    progressTextEl.textContent = `% מהתקציב נוצל: ${usagePercent.toFixed(1)}%`;
    progressBarEl.style.width = `${displayPercent}%`;
    progressLabelEl.textContent = `${usagePercent.toFixed(1)}%`;

    progressBarEl.style.backgroundColor = usagePercent > 100 ? 'var(--error-color)' : 'var(--primary-color)';
}

/**
 *  שולף את רשימת ההוצאות של המשתמש מהשרת.
 */
async function fetchExpenses() {
    const token = getToken();
    if (!token) {
        // אם אין טוקן, נקה את הטבלה
        expensesTableBody.innerHTML = '';
        updateAllSummaries([]);
        return console.error("Authentication token missing. Cannot fetch expenses.");
    }
    
    try {
        //  נניח שקיים ראוט GET /api/tasks/expenses לשליפה
        const response = await fetch(`${API_BASE_URL}/expenses`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            const data = await response.json();
            expenses = data.expenses || []; // נניח שהשרת מחזיר { expenses: [...] }
            
            // רינדור הטבלה
            expensesTableBody.innerHTML = ''; // ניקוי הטבלה
            expenses.forEach(renderExpenseRow);
            
            // עדכון סכומי הסיכום
            updateAllSummaries(expenses);
        } else if (response.status === 401) {
            alert('פג תוקף האימות. נא להתחבר מחדש.');
            // ייתכן שצריך להפנות לדף התחברות
        } else {
            console.error('שגיאה בשליפת הוצאות:', response.status, await response.text());
        }
    } catch (error) {
        console.error('שגיאת רשת בעת שליפת הוצאות:', error);
    }
}

// לוגיקה לעדכון סכום התקציב
editBudgetBtn.addEventListener('click', () => {
    budgetInputArea.style.display = 'block';
    newBudgetAmountInput.value = totalBudget;
    newBudgetAmountInput.focus();
});

saveBudgetBtn.addEventListener('click', () => {
    const newAmount = Number(newBudgetAmountInput.value);
    
    if (newAmount > 0) {
        totalBudget = newAmount;
        localStorage.setItem('totalBudget', totalBudget); // שמירת התקציב החדש
        
        // נדרש לשלוף שוב כדי לחשב את הסיכומים על בסיס התקציב החדש
        fetchExpenses(); 
        
        budgetInputArea.style.display = 'none';
        alert('התקציב הכולל עודכן בהצלחה!');
    } else {
        alert('אנא הזן סכום תקציב חוקי.');
    }
});


// =======================================================
// לוגיקת טופס ההוצאות
// =======================================================

/**
 * מטפלת בשליחת הטופס, אוספת נתונים ומוסיפה שורה לטבלה.
 * @param {Event} e - אובייקט האירוע.
 */
async function handleFormSubmit(e) {
    e.preventDefault(); 
    
    const token = getToken();
    if (!token) {
        alert('אין אימות. נא להתחבר מחדש.');
        return;
    }

    // 1. קבלת הערכים ואימות בסיסי
    const category = document.getElementById('expenseCategory').value;
    const amount = Number(document.getElementById('expenseAmount').value);
    const date = document.getElementById('expenseDate').value;
    const notes = document.getElementById('expenseNotes').value;
    const status = document.getElementById('expenseStatus').value;

    if (!category || amount <= 0 || !date || !status) {
        alert('נא למלא את כל השדות הנדרשים בסכום חיובי.');
        return;
    }
    
    const expenseData = { category, amount, date, status, notes };

    // 2. שליחת נתונים ל-Backend
    try {
        const response = await fetch(`${API_BASE_URL}/expenses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // חובה לשלוח את הטוקן!
            },
            body: JSON.stringify(expenseData)
        });

        const result = await response.json();

        if (response.ok) {
            alert(`✅ ${result.message || 'הוצאה נשמרה בהצלחה!'}`);
            expenseForm.reset();
            
            // 3. הצלחה: שליפה מחדש של כל הנתונים המעודכנים
            fetchExpenses(); 

        } else {
            // שגיאה מהשרת (400, 401, 500)
            const errorMessage = result.msg || result.error || 'שגיאה כללית בשמירת ההוצאה.';
            alert(`❌ שגיאה: ${errorMessage}`);
            console.error('Server error:', result);
        }

    } catch (error) {
        console.error('שגיאת רשת בעת שליחת ההוצאה:', error);
        alert('שגיאת רשת: לא ניתן להתחבר לשרת.');
    }
}

// =======================================================
// אתחול האפליקציה (כאשר הדף נטען)
// =======================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. קריאה ראשונה לטעינת הנתונים מהשרת
    fetchExpenses();
    
    // 2. האזנה לאירוע שליחת הטופס
    expenseForm.addEventListener('submit', handleFormSubmit);
});