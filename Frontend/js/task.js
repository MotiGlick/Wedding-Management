// =======================================================
//   משתנים גלובליים
// =======================================================
let allTasks = []; 
let pendingReminder = null; // משתנה זמני לתזכורת שממתינה לשמירת המשימה
let currentOpenMode = null; // 'add' or 'view'

// =======================================================
//   פונקציות עזר לאימות ו-Token
// =======================================================
function getToken() { return sessionStorage.getItem('authToken'); }
function getAuthHeaders() {
    const token = getToken();
    if (!token) { throw new Error("Missing Auth Token"); }
    return { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
}

// =======================================================
//   פונקציות API
// =======================================================

async function getTasks() {
    try {
        const res = await fetch("/api/tasks", { headers: getAuthHeaders() });
        if (res.ok) return res.json();
    } catch (e) { console.error(e); }
    return [];
}

async function addTask(title, date, description = null) {
  try {
    const res = await fetch("/api/tasks", {
      method: "POST", headers: getAuthHeaders(),
      body: JSON.stringify({ title, date, description }) 
    });
    if (res.ok) {
        const newTask = await res.json();
        return newTask.id; // מחזיר את ה-ID קריטי עבור התזכורת
    }
  } catch (error) { console.error(error); }
  return null;
}

async function submitReminderData(taskId, triggerAt, type) {
    try {
        const res = await fetch("/api/reminders", {
            method: "POST", headers: getAuthHeaders(),
            body: JSON.stringify({ taskId, triggerAt: triggerAt.toISOString(), type })
        });
        return res.ok;
    } catch (error) { console.error(error); return false; }
}

async function deleteRemoteTask(taskId) {
    if (!confirm("למחוק את המשימה?")) return;
    try {
        await fetch(`/api/tasks/${taskId}`, { method: "DELETE", headers: getAuthHeaders() });
        location.reload();
    } catch (e) { console.error(e); }
}

async function updateTaskDescription(taskId, description) {
    try {
        await fetch(`/api/tasks/${taskId}`, { method: "PUT", headers: getAuthHeaders(), body: JSON.stringify({description}) });
        alert("התיאור עודכן בהצלחה");
        location.reload();
    } catch (e) { console.error(e); }
}

// =======================================================
//   לוגיקת החלונית הצפה (Popup Logic)
// =======================================================

function openPopup(mode) {
    currentOpenMode = mode;
    const popup = document.getElementById('reminderFloatingPopup');
    
    // איפוס שדות
    document.getElementById('popup-reminder-schedule').value = '';
    toggleTimeInputsLocal('');
    
    popup.classList.add('active');
}

function closePopup() {
    document.getElementById('reminderFloatingPopup').classList.remove('active');
}

function toggleTimeInputsLocal(val) {
    const rel = document.getElementById('popup-relative-container');
    const abs = document.getElementById('popup-absolute-container');
    rel.style.display = (val === 'custom_relative') ? 'flex' : 'none';
    abs.style.display = (val === 'custom_absolute') ? 'block' : 'none';
}

function handleConfirmPopup() {
    // 1. חישוב זמן התזכורת מתוך הפופ-אפ
    const scheduleType = document.getElementById('popup-reminder-schedule').value;
    let triggerAt = null;

    if (scheduleType === 'custom_absolute') {
        const val = document.getElementById('popup-absolute-time').value;
        if (val) triggerAt = new Date(val);
    } else if (scheduleType === 'custom_relative') {
        const amount = parseInt(document.getElementById('popup-relative-amount').value);
        const unit = document.getElementById('popup-relative-unit').value;
        
        // מציאת תאריך המשימה (תלוי אם אנחנו בהוספה או בצפייה)
        let taskDateStr = null;
        if (currentOpenMode === 'add') {
             const d = document.getElementById('modal-task-date').value;
             const t = document.getElementById('modal-task-time').value;
             taskDateStr = t ? `${d}T${t}:00` : `${d}T09:00:00`; 
        } else {
             taskDateStr = document.getElementById('view-task-date-iso').value;
        }

        if (taskDateStr && amount) {
            let taskTime = new Date(taskDateStr);
            switch (unit) {
                case 'minutes': taskTime.setMinutes(taskTime.getMinutes() - amount); break;
                case 'hours': taskTime.setHours(taskTime.getHours() - amount); break;
                case 'days': taskTime.setDate(taskTime.getDate() - amount); break;
            }
            triggerAt = taskTime;
        }
    }

    if (!triggerAt || isNaN(triggerAt.getTime())) {
        alert("אנא הגדר זמן תקין לתזכורת");
        return;
    }

    // 2. טיפול לפי מצב
    if (currentOpenMode === 'add') {
        // מצב הוספה: שומרים בצד ולא שולחים עדיין
        pendingReminder = { triggerAt: triggerAt, type: 'email' };
        
        // שינוי ויזואלי לכפתור במודאל הראשי
        const btn = document.getElementById('btn-open-reminder-popup');
        btn.innerHTML = `<i class="fas fa-check-circle"></i> תזכורת הוגדרה`;
        btn.classList.add('active-state');
        
        closePopup();

    } else if (currentOpenMode === 'view') {
        // מצב עריכה: המשימה קיימת, שולחים מיד
        const taskId = document.getElementById('view-task-id').value;
        
        submitReminderData(taskId, triggerAt, 'email').then(success => {
            if (success) {
                alert("התזכורת נקבעה בהצלחה!");
                closePopup();
                location.reload();
            } else {
                alert("שגיאה בשמירת התזכורת");
            }
        });
    }
}


// =======================================================
//   אתחול
// =======================================================

document.addEventListener("DOMContentLoaded", async () => {
    
    // המבורגר
    const hamburgerBtn = document.getElementById('hamburger-btn');
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => 
            document.getElementById('task-sidebar').classList.toggle('open'));
    }

    // טעינת נתונים
    const calendarEl = document.getElementById("calendar");
    allTasks = await getTasks();
    allTasks.sort((a, b) => new Date(a.date) - new Date(b.date));
    updateSidebar(allTasks);

    // חיבור כפתורי פופ-אפ
    document.getElementById('btn-open-reminder-popup').onclick = () => openPopup('add');
    document.getElementById('btn-view-reminder-popup').onclick = () => openPopup('view');
    document.getElementById('btn-cancel-popup').onclick = closePopup;
    document.getElementById('btn-confirm-popup').onclick = handleConfirmPopup;
    
    // חשיפת פונקציה ל-HTML
    window.toggleTimeInputsLocal = toggleTimeInputsLocal;

    // הגדרת FullCalendar
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        locale: "he",
        direction: 'rtl',
        buttonText: { today: 'היום', month: 'חודש', week: 'שבוע', day: 'יום' },
        headerToolbar: {
            right: 'prev,next', 
            center: 'title',
            left: 'dayGridMonth,timeGridWeek,timeGridDay' 
        },
        events: allTasks.map(t => ({ 
            id: t.id, title: t.title, date: t.date, 
            extendedProps: { description: t.description, hasReminder: t.hasReminder }
        })),
        dateClick: (info) => window.openAddTaskModal(info.dateStr),
        eventClick: (info) => window.openViewTaskModal(info.event),
        eventContent: function(arg) {
            let icon = arg.event.extendedProps.hasReminder ? '<i class="fas fa-bell" style="color:#e67e22; margin-left:5px;"></i>' : '';
            return { html: `<div>${icon} ${arg.event.title}</div>` };
        }
    });
    calendar.render();

    // --- לוגיקה למודאל הוספה ---
    const addModal = document.getElementById('addTaskModal');
    window.openAddTaskModal = (dateStr) => {
        document.getElementById('modal-task-title').value = '';
        document.getElementById('modal-task-description-add').value = '';
        document.getElementById('modal-task-date').value = dateStr;
        document.getElementById('modal-task-time').value = '';
        
        // איפוס מצב תזכורת
        pendingReminder = null;
        const btn = document.getElementById('btn-open-reminder-popup');
        btn.innerHTML = `<i class="fas fa-bell"></i> הוסף תזכורת`;
        btn.classList.remove('active-state');

        addModal.classList.add('active');
    };

    document.getElementById('modal-cancel-btn').onclick = () => addModal.classList.remove('active');
    
    // --- לוגיקת שמירת משימה (החלק הקריטי) ---
    document.getElementById('modal-save-btn').onclick = async () => {
        const title = document.getElementById('modal-task-title').value;
        const d = document.getElementById('modal-task-date').value;
        const t = document.getElementById('modal-task-time').value;
        const desc = document.getElementById('modal-task-description-add').value;
        
        let finalDate = t ? `${d}T${t}:00` : d;
        
        if (!title) return alert("חסר כותרת");

        const btn = document.getElementById('modal-save-btn');
        btn.innerText = "שומר...";
        btn.disabled = true;

        // 1. קודם כל יוצרים את המשימה ומקבלים ID
        const newId = await addTask(title, finalDate, desc);
        
        // 2. רק אם המשימה נוצרה בהצלחה + המשתמש הגדיר תזכורת (pendingReminder)
        if (newId && pendingReminder) {
            console.log("Saving reminder for new task:", newId);
            await submitReminderData(newId, pendingReminder.triggerAt, pendingReminder.type);
        }

        location.reload();
    };

    // --- לוגיקה למודאל צפייה ---
    const viewModal = document.getElementById('viewTaskModal');
    window.openViewTaskModal = (event) => {
        document.getElementById('view-task-title').textContent = event.title;
        document.getElementById('view-task-id').value = event.id;
        document.getElementById('view-task-description').value = event.extendedProps.description || '';
        
        const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
        document.getElementById('view-task-date').textContent = event.start.toLocaleDateString('he-IL', options);
        document.getElementById('view-task-date-iso').value = event.startStr || event.start.toISOString();
        
        viewModal.classList.add('active');
    };
    
    document.getElementById('modal-close-view-btn').onclick = () => viewModal.classList.remove('active');
    document.getElementById('modal-delete-btn').onclick = () => deleteRemoteTask(document.getElementById('view-task-id').value);
    document.getElementById('modal-save-description-btn').onclick = () => updateTaskDescription(document.getElementById('view-task-id').value, document.getElementById('view-task-description').value);
});

function updateSidebar(tasks) {
    const nextTask = tasks.find(t => new Date(t.date) >= new Date());
    const nextTaskDiv = document.getElementById("next-task");
    if (nextTaskDiv) {
        if (nextTask) {
            const d = new Date(nextTask.date);
            nextTaskDiv.textContent = `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${nextTask.title}`;
        } else {
            nextTaskDiv.textContent = "אין משימות קרובות";
        }
    }
    const list = document.getElementById("task-list-sidebar");
    if(list) {
        list.innerHTML = ''; 
        tasks.forEach(t => {
            const li = document.createElement("li");
            const d = new Date(t.date);
            li.textContent = `${d.toLocaleDateString()} - ${t.title}`;
            list.appendChild(li);
        });
    }
}