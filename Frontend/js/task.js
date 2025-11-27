// =======================================================
//   פונקציות עזר לאימות ו-Token
// =======================================================

function getToken() {
    return sessionStorage.getItem('authToken');
  //return localStorage.getItem('authToken'); 
}

function handleUnauthorized() {
    console.error("401: Unauthorized - נדרש להתחבר מחדש.");
    
    // 1. ניקוי הטוקן הפג תוקף
    sessionStorage.removeItem('authToken');
    //localStorage.removeItem('authToken'); 
    
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
    const res = await fetch("http://localhost:3000/api/tasks", { headers: getAuthHeaders() });
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
    const res = await fetch("http://localhost:3000/api/tasks", {
      method: "POST",
      headers: getAuthHeaders(),
      // **שליחת התיאור האופציונלי**
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
    const res = await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
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
    const res = await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
      method: "PUT", // יש להתאים לשיטת ה-Route שהגדרת בשרת
      headers: getAuthHeaders(),
      body: JSON.stringify({ description })
    });
    if (res.status === 401) { handleUnauthorized(); return; }
    if (!res.ok) throw new Error("Failed to update description");

    alert("התיאור נשמר בהצלחה!");
    location.reload(); // רענון הדף כדי לעדכן את נתוני המשימות
  } catch (error) {
     if (!error.message.includes("Missing Auth Token")) { console.error("Error updating description:", error); }
  }
}


// =======================================================
//   לוגיקת המודאל להוספת משימה (addTaskModal) - **מעודכן**
// =======================================================

function setupModalLogic() {
    const modal = document.getElementById('addTaskModal');
    const titleInput = document.getElementById('modal-task-title');
    // **אלמנט התיאור החדש**
    const descriptionInput = document.getElementById('modal-task-description-add'); 

    const dateInput = document.getElementById('modal-task-date');
    const saveBtn = document.getElementById('modal-save-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');

    if (!modal) return;

    window.openAddTaskModal = (dateStr) => {
        dateInput.value = dateStr;
        titleInput.value = ''; 
        descriptionInput.value = ''; // ניקוי שדה התיאור
        modal.classList.add('active');
        titleInput.focus();
    };

    const closeModal = () => {
        modal.classList.remove('active');
    };

    saveBtn.onclick = () => {
        const title = titleInput.value.trim();
        const date = dateInput.value;
        const description = descriptionInput.value.trim(); // איסוף התיאור

        if (title) {
            // **שליחת התיאור בבקשה**
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

        modal.classList.add('active'); // השתמש ב-classList.add
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
//   לוגיקת כרטיסיית התזכורת החדשה
// =======================================================

function sendReminder() {
    const reminderType = document.getElementById('reminder-type').value;
    const nextTask = document.getElementById("next-task").textContent;

    if (reminderType === 'none' || nextTask.includes("אין משימות")) {
        alert("אנא בחר/י אמצעי תזכורת וודא/י שקיימת משימה קרובה.");
        return;
    }

    const taskTitle = nextTask.split('—')[0].trim();
    
    if (reminderType === 'phone') {
        alert(`נשלחת תזכורת SMS עבור המשימה: "${taskTitle}"`);
        // לוגיקת שליחת SMS אמיתית תבוא כאן...
    } else if (reminderType === 'email') {
        alert(`נשלחת תזכורת אימייל עבור המשימה: "${taskTitle}"`);
        // לוגיקת שליחת אימייל אמיתית תבוא כאן...
    }
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

  // 1. לוגיקה לפתיחת סרגל הצד (מעודכן לביטול הזחת body)
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebar = document.getElementById('task-sidebar');
    const body = document.body;
    
    // **תיקון: הסרנו את body.classList.toggle('sidebar-offset');**
    // עכשיו רק מחליף את המחלקה 'open' בסרגל (מה שמשנה את הרוחב שלו ב-CSS).
    hamburgerBtn.addEventListener('click', function() {
        sidebar.classList.toggle('open'); 
    });


  // 2. טעינת נתונים ומיון
  const calendarEl = document.getElementById("calendar");
  const allTasks = await getTasks();
  allTasks.sort((a, b) => new Date(a.date) - new Date(b.date));

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
    
    // הגדרת שמות כפתורים מקצועיים
    buttonText: {
        day: 'יום',
        week: 'שבוע',
        month: 'חודש',
        // **3. ביטול כפתור "היום" - לא מופיע כאן**
    },

    headerToolbar: {
        // **3. ביטול כפתור "היום" - הסרנו את 'today' מכאן**
        right: 'prev,next', 
        center: 'title',
        left: 'dayGridMonth,timeGridWeek,timeGridDay' 
    },

    // קליק על תאריך פותח מודאל הוספה
    dateClick: function(info) {
        window.openAddTaskModal(info.dateStr); 
    },

    // קליק על אירוע פותח מודאל צפייה/עריכה
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
                // העברת התיאור האופציונלי למודאל הצפייה
                description: t.description 
            }
        })));
    }
  });

  calendar.render();

  // 6. הצגת המשימה הקרובה + רשימת משימות
  const nextTask = allTasks.find(t => new Date(t.date) >= new Date());
  const nextTaskDiv = document.getElementById("next-task");
  nextTaskDiv.textContent = nextTask ? `${nextTask.title} — ${nextTask.date}` : "אין משימות קרובות";

  const list = document.getElementById("task-list");
  list.innerHTML = ''; 

  allTasks.forEach(t => {
    const li = document.createElement("li");
    li.textContent = `${t.title} — ${t.date}`;
    list.appendChild(li);
  });

});