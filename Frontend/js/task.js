// =======================================================
//   פונקציות עזר לאימות ו-Token
// =======================================================

function getToken() {
    return sessionStorage.getItem('authToken');
}

function handleUnauthorized() {
    console.error("401: Unauthorized - נדרש להתחבר מחדש.");
    
    // 1. ניקוי הטוקן הפג תוקף
    sessionStorage.removeItem('authToken');
    
    // 2. הודעה למשתמש
    alert("החיבור פג תוקף או אינו מאומת. אנא התחבר מחדש.");
    
    // 3. הפניית המשתמש לדף ההתחברות
    window.location.href = './login.html'; 
}

function getAuthHeaders() {
    const token = getToken();
    
    if (!token) {
        handleUnauthorized();
        throw new Error("Missing Auth Token"); 
    }
    
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
    };
}

// =======================================================
//   פונקציות API - עם מחיקה ועדכון תיאור
// =======================================================

async function getTasks() {
  try {
    const res = await fetch("/api/tasks", { headers: getAuthHeaders() });
    if (res.status === 401) { handleUnauthorized(); return []; }
    if (!res.ok) { console.error(`API Error: ${res.status}`); return []; }
    return res.json(); 
  } catch (error) {
    if (error.message && error.message.includes("Missing Auth Token")) return [];
    console.error("Fetch Error:", error);
    return [];
  }
}

async function addTask(title, date, description = null) {
  try {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, date, description }) 
    });
    if (res.status === 401) { handleUnauthorized(); return; }
    location.reload();
  } catch (error) {
     if (!error.message.includes("Missing Auth Token")) { console.error("Error adding task:", error); }
  }
}

async function deleteRemoteTask(taskId) {
  try {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (res.status === 401) { handleUnauthorized(); return; }
    if (!res.ok) throw new Error("Failed to delete task");
    location.reload(); 
  } catch (error) {
     if (!error.message.includes("Missing Auth Token")) { console.error("Error deleting task:", error); }
  }
}

async function updateTaskDescription(taskId, description) {
  try {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT", 
      headers: getAuthHeaders(),
      body: JSON.stringify({ description })
    });
    if (res.status === 401) { handleUnauthorized(); return; }
    if (!res.ok) throw new Error("Failed to update description");

    alert("התיאור נשמר בהצלחה!");
    location.reload(); 
  } catch (error) {
     if (!error.message.includes("Missing Auth Token")) { console.error("Error updating description:", error); }
  }
}


// =======================================================
//   לוגיקת המודאל להוספת משימה (addTaskModal)
// =======================================================

function setupModalLogic() {
    const modal = document.getElementById('addTaskModal');
    const titleInput = document.getElementById('modal-task-title');
    const descriptionInput = document.getElementById('modal-task-description-add'); 
    const dateInput = document.getElementById('modal-task-date');
    const saveBtn = document.getElementById('modal-save-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');

    if (!modal) return;

    window.openAddTaskModal = (dateStr) => {
        dateInput.value = dateStr;
        titleInput.value = ''; 
        descriptionInput.value = ''; 
        modal.classList.add('active');
        titleInput.focus();
    };

    const closeModal = () => {
        modal.classList.remove('active');
    };

    saveBtn.onclick = () => {
        const title = titleInput.value.trim();
        const date = dateInput.value;
        const description = descriptionInput.value.trim(); 

        if (title) {
            addTask(title, date, description);
            closeModal();
        } else {
            alert("אנא הזן כותרת משימה.");
        }
    };

    cancelBtn.onclick = closeModal;
    modal.onclick = (event) => {
        if (event.target === modal) {
            closeModal();
        }
    };
}


// =======================================================
//   לוגיקת המודאל לצפייה/עריכה (viewTaskModal)
// =======================================================

function setupViewModalLogic() {
    const modal = document.getElementById('viewTaskModal');
    if (!modal) return; 
    
    const titleEl = document.getElementById('view-task-title');
    const dateEl = document.getElementById('view-task-date');
    const idInput = document.getElementById('view-task-id');
    const descriptionInput = document.getElementById('view-task-description');
    const saveBtn = document.getElementById('modal-save-description-btn');
    const deleteBtn = document.getElementById('modal-delete-btn');
    const closeBtn = document.getElementById('modal-close-view-btn');

    const closeModal = () => {
        modal.classList.remove('active');
    };

    // פותח את המודאל וממלא נתונים
    window.openViewTaskModal = (event) => {
        titleEl.textContent = event.title;
        dateEl.textContent = event.start ? event.start.toLocaleDateString('he-IL') : 'לא ידוע';
        idInput.value = event.id;
        
        // טעינת התיאור משדה extendedProps
        const currentDescription = event.extendedProps.description || ''; 
        descriptionInput.value = currentDescription;

        modal.classList.add('active'); 
    };

    // לוגיקת שמירת תיאור
    saveBtn.onclick = async () => {
        const taskId = idInput.value;
        const newDescription = descriptionInput.value;
        await updateTaskDescription(taskId, newDescription); 
        closeModal(); 
    };

    // לוגיקת מחיקת משימה
    deleteBtn.onclick = async () => {
        const taskId = idInput.value;
        if (confirm(`האם אתה בטוח שברצונך למחוק את המשימה "${titleEl.textContent}"?`)) {
            await deleteRemoteTask(taskId);
            closeModal();
        }
    };

    closeBtn.onclick = closeModal;
    modal.onclick = (event) => {
        if (event.target === modal) {
            closeModal();
        }
    };
}


// =======================================================
//   פונקציות עזר לטיפול ב-UI התזכורות החדשות
// =======================================================

// פונקציה להצגה/הסתרה של שדות הקלט המותנים (זמן יחסי/אבסולוטי)
function toggleReminderInputs(selectedOption) {
    const relativeContainer = document.getElementById('custom-relative-container'); // X יחידות לפני
    const absoluteContainer = document.getElementById('custom-absolute-container'); // תאריך ספציפי
    
    if (relativeContainer) relativeContainer.style.display = 'none';
    if (absoluteContainer) absoluteContainer.style.display = 'none';

    if (selectedOption === 'custom_relative') {
        if (relativeContainer) relativeContainer.style.display = 'flex';
    } else if (selectedOption === 'custom_absolute') {
        if (absoluteContainer) absoluteContainer.style.display = 'block';
    }
}

// פונקציה למילוי רשימת המשימות בבלוק התזכורות
function populateTaskSelect(tasks) {
    const select = document.getElementById('reminder-task-select');
    if (!select) return;

    select.innerHTML = '<option value="">בחר משימה...</option>';
    
    tasks.forEach(task => {
        const option = document.createElement('option');
        option.value = task.id; 
        option.textContent = `${new Date(task.date).toLocaleDateString('he-IL')} - ${task.title}`;
        select.appendChild(option);
    });
}


// =======================================================
//   לוגיקת כרטיסיית התזכורת - מעודכנת
// =======================================================

function sendReminder() {
    const selectedTaskId = document.getElementById('reminder-task-select').value;
    
    // איסוף נתוני שליחה (ה-radio buttons)
    const reminderType = document.querySelector('input[name="reminder-type"]:checked')?.value;
    const reminderRecipient = document.querySelector('input[name="reminder-recipient"]:checked')?.value;
    const reminderSchedule = document.querySelector('input[name="reminder-schedule"]:checked')?.value;
    
    // איסוף נתוני זמן מותאמים אישית (אם נבחרו)
    let customTimeData = {};
    if (reminderSchedule === 'custom_absolute') {
        customTimeData.absoluteTime = document.getElementById('custom-reminder-datetime').value;
    } else if (reminderSchedule === 'custom_relative') {
        customTimeData.amount = document.getElementById('relative-amount-input').value;
        customTimeData.unit = document.getElementById('relative-unit-select').value;
    }

    // בדיקות תקינות
    if (!selectedTaskId) {
        alert("אנא בחר משימה לשליחת תזכורת.");
        return;
    }
    if (!reminderType) {
        alert("אנא בחר אמצעי לשליחת תזכורת (אימייל או SMS).");
        return;
    }

    // כאן תבוא לוגיקת ה-fetch לשרת לשמירת התזכורת החדשה
    console.log({
        taskId: selectedTaskId,
        type: reminderType,
        recipient: reminderRecipient,
        schedule: reminderSchedule,
        customData: customTimeData
    });

    alert(`בקשת תזכורת נשלחה עבור משימה ${selectedTaskId}, נמען: ${reminderRecipient}, שיטה: ${reminderType}.`);
}


// =======================================================
//   פונקציה לטיפול בלחיצה על אירוע קיים (EVENT CLICK)
// =======================================================

function handleEventClick(info) {
    // פותח את מודאל הצפייה/עריכה המעוצב
    window.openViewTaskModal(info.event);
    
    // מונע את פעולת ברירת המחדל של FullCalendar
    info.jsEvent.preventDefault(); 
}


// =======================================================
//   יצירת לוח שנה וטעינת נתונים - **הפונקציה העיקרית**
// =======================================================

document.addEventListener("DOMContentLoaded", async () => {

  // 1. לוגיקה לפתיחת סרגל הצד
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebar = document.getElementById('task-sidebar');
    
    hamburgerBtn.addEventListener('click', function() {
        sidebar.classList.toggle('open'); 
    });


  // 2. טעינת נתונים ומיון
  const calendarEl = document.getElementById("calendar");
  const allTasks = await getTasks();
  allTasks.sort((a, b) => new Date(a.date) - new Date(b.date));

 // 🚩 קריאה לפונקציה החדשה למילוי הדרופדאון של התזכורות
 populateTaskSelect(allTasks);

 // 3. הגדרת לוגיקת המודאל להוספת משימה
 setupModalLogic(); 
  
 // 4. הגדרת לוגיקת מודאל הצפייה/עריכה
 setupViewModalLogic(); 

  // 5. אתחול לוח השנה
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    initialDate: new Date(),
    locale: "he",
    direction: 'rtl', 
    
    buttonText: {
        day: 'יום',
        week: 'שבוע',
        month: 'חודש',
    },

    headerToolbar: {
        right: 'prev,next', 
        center: 'title',
        left: 'dayGridMonth,timeGridWeek,timeGridDay' 
    },

    dateClick: function(info) {
        window.openAddTaskModal(info.dateStr); 
    },

    eventClick: function(info) {
        handleEventClick(info);
    },

    events: function(fetchInfo, successCallback) {
        successCallback(allTasks.map(t => ({ 
            id: t.id, 
            title: t.title, 
            date: t.date, 
            start: t.date, 
            extendedProps: {
                description: t.description 
            }
        })));
    }
  });

  calendar.render();

  // 6. הצגת המשימה הקרובה + רשימת משימות
  const nextTask = allTasks.find(t => new Date(t.date) >= new Date());
  const nextTaskDiv = document.getElementById("next-task");
  nextTaskDiv.textContent = nextTask ? `${nextTask.date} - ${nextTask.title}` : "אין משימות קרובות";

  const list = document.getElementById("task-list");
  list.innerHTML = ''; 

  allTasks.forEach(t => {
    const li = document.createElement("li");
    li.textContent = `${t.date} - ${t.title}`;
    list.appendChild(li);
  });

});