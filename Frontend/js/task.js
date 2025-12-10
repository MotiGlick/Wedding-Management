// =======================================================
//   משתנים גלובליים
// =======================================================
let allTasks = []; 

// =======================================================
//   פונקציות עזר לאימות ו-Token
// =======================================================
function getToken() {
    return sessionStorage.getItem('authToken');
}

function handleUnauthorized() {
    console.error("401: Unauthorized");
    sessionStorage.removeItem('authToken');
    alert("החיבור פג תוקף או אינו מאומת. אנא התחבר מחדש.");
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
//   פונקציות API
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
    // date מגיע כ-ISO string מלא שכולל כבר שעה אם נבחרה
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
//   לוגיקת המודאל להוספת משימה (כולל שעה)
// =======================================================

function setupModalLogic() {
    const modal = document.getElementById('addTaskModal');
    const titleInput = document.getElementById('modal-task-title');
    const descriptionInput = document.getElementById('modal-task-description-add'); 
    const dateInput = document.getElementById('modal-task-date');
    const timeInput = document.getElementById('modal-task-time'); // שדה השעה החדש
    const saveBtn = document.getElementById('modal-save-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');

    if (!modal) return;

    window.openAddTaskModal = (dateStr) => {
        dateInput.value = dateStr;
        timeInput.value = ''; // איפוס השעה
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
        const datePart = dateInput.value; // YYYY-MM-DD
        const timePart = timeInput.value; // HH:MM
        const description = descriptionInput.value.trim(); 

        if (title) {
            let finalDate = datePart;
            // אם המשתמש בחר שעה, נחבר אותה לתאריך
            if (timePart) {
                finalDate = `${datePart}T${timePart}:00`;
            }

            addTask(title, finalDate, description);
            closeModal();
        } else {
            alert("אנא הזן כותרת משימה.");
        }
    };

    cancelBtn.onclick = closeModal;
    modal.onclick = (event) => {
        if (event.target === modal) closeModal();
    };
}

// =======================================================
//   לוגיקת המודאל לצפייה/עריכה
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

    const closeModal = () => { modal.classList.remove('active'); };

    window.openViewTaskModal = (event) => {
        titleEl.textContent = event.title;
        
        // הצגת תאריך ושעה בצורה יפה
        const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
        dateEl.textContent = event.start ? event.start.toLocaleDateString('he-IL', options) : 'לא ידוע';
        
        idInput.value = event.id;
        descriptionInput.value = event.extendedProps.description || ''; 
        modal.classList.add('active'); 
    };

    saveBtn.onclick = async () => {
        await updateTaskDescription(idInput.value, descriptionInput.value); 
        closeModal(); 
    };

    deleteBtn.onclick = async () => {
        if (confirm(`למחוק את המשימה "${titleEl.textContent}"?`)) {
            await deleteRemoteTask(idInput.value);
            closeModal();
        }
    };

    closeBtn.onclick = closeModal;
    modal.onclick = (event) => { if (event.target === modal) closeModal(); };
}

// =======================================================
//   לוגיקת UI לתזכורות (תיקון הבאג)
// =======================================================

function toggleReminderInputs(selectedOption) {
    const relativeContainer = document.getElementById('custom-relative-container');
    const absoluteContainer = document.getElementById('custom-absolute-container');
    
    if (relativeContainer) relativeContainer.style.display = 'none';
    if (absoluteContainer) absoluteContainer.style.display = 'none';

    if (selectedOption === 'custom_relative') {
        if (relativeContainer) relativeContainer.style.display = 'flex';
    } else if (selectedOption === 'custom_absolute') {
        if (absoluteContainer) absoluteContainer.style.display = 'block';
    }
}

function populateTaskSelect(tasks) {
    const select = document.getElementById('reminder-task-select');
    if (!select) return;

    select.innerHTML = '<option value="">בחר משימה...</option>';
    tasks.forEach(task => {
        const option = document.createElement('option');
        option.value = task.id; 
        const d = new Date(task.date);
        option.textContent = `${d.toLocaleDateString('he-IL')} - ${task.title}`;
        select.appendChild(option);
    });
}

// =======================================================
//   שליחת תזכורת (Send Reminder) - מתוקן
// =======================================================

async function sendReminder() {
    const selectedTaskId = document.getElementById('reminder-task-select').value;
    const reminderType = document.querySelector('input[name="reminder-type"]:checked')?.value;
    // כאן התיקון: קריאה מתוך ה-Select החדש במקום Radio שלא היה קיים
    const reminderSchedule = document.getElementById('reminder-schedule-select').value;

    if (!selectedTaskId) return alert("אנא בחר משימה לשליחת תזכורת.");
    if (!reminderSchedule) return alert("אנא בחר מתי לשלוח את התזכורת.");

    const task = allTasks.find(t => t.id == selectedTaskId);
    if (!task) return alert("שגיאה: המשימה לא נמצאה.");

    let triggerAt = new Date();

    if (reminderSchedule === 'custom_absolute') {
        const absoluteInput = document.getElementById('custom-reminder-datetime').value;
        if (!absoluteInput) return alert("אנא בחר תאריך ושעה לתזכורת.");
        triggerAt = new Date(absoluteInput);
    
    } else if (reminderSchedule === 'custom_relative') {
        const amount = parseInt(document.getElementById('relative-amount-input').value);
        const unit = document.getElementById('relative-unit-select').value; 

        if (!amount) return alert("אנא הזן כמות זמן.");

        let taskTime = new Date(task.date); 
        switch (unit) {
            case 'minutes': taskTime.setMinutes(taskTime.getMinutes() - amount); break;
            case 'hours': taskTime.setHours(taskTime.getHours() - amount); break;
            case 'days': taskTime.setDate(taskTime.getDate() - amount); break;
        }
        triggerAt = taskTime;
    }

    if (triggerAt < new Date()) {
        if (!confirm("זמן התזכורת הוא בעבר. לשלוח בכל זאת?")) return;
    }

    try {
        const res = await fetch("/api/reminders", {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                taskId: selectedTaskId,
                triggerAt: triggerAt.toISOString(),
                type: reminderType
            })
        });

        if (res.ok) {
            alert(`תזכורת נקבעה בהצלחה ל-${triggerAt.toLocaleString()}`);
            
            // עדכון ויזואלי מקומי (פעמון) עד לריענון הבא
            // הערה: כדי שזה ישמר קבוע, השרת צריך לתמוך בזה
            const calendarApi = document.querySelector('#calendar')._fullCalendarApi; // גישה לא רשמית ל-API
            const event = calendarApi.getEventById(selectedTaskId);
            if(event) {
                event.setExtendedProp('hasReminder', true);
            }

        } else {
            const data = await res.json();
            alert("שגיאה: " + (data.error || "לא ידועה"));
        }
    } catch (error) {
        console.error(error);
        alert("שגיאת תקשורת");
    }
}

// =======================================================
//   אתחול לוח השנה (כולל הצגת פעמון)
// =======================================================

document.addEventListener("DOMContentLoaded", async () => {

    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebar = document.getElementById('task-sidebar');
    hamburgerBtn.addEventListener('click', () => sidebar.classList.toggle('open'));

    const calendarEl = document.getElementById("calendar");
    allTasks = await getTasks();
    allTasks.sort((a, b) => new Date(a.date) - new Date(b.date));

    populateTaskSelect(allTasks);
    setupModalLogic(); 
    setupViewModalLogic(); 

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        locale: "he",
        direction: 'rtl',
        buttonText: {
            today: 'היום',
            month: 'חודש',
            week: 'שבוע',
            day: 'יום'
        },
        headerToolbar: {
            right: 'prev,next', 
            center: 'title',
            left: 'dayGridMonth,timeGridWeek,timeGridDay' 
        },
        
        // כאן הוספנו את הלוגיקה להצגת פעמון
        eventContent: function(arg) {
            let titleHtml = `<div class="fc-event-title">${arg.event.title}</div>`;
            let timeHtml = arg.timeText ? `<div class="fc-event-time">${arg.timeText}</div>` : '';
            
            // בדיקה אם יש תזכורת (דורש תמיכה מהשרת כדי שיהיה קבוע)
            let iconHtml = '';
            if (arg.event.extendedProps.hasReminder) {
                 iconHtml = `<i class="fas fa-bell" style="margin-left:5px; color:#e67e22; font-size:0.8em;"></i>`;
            }

            return { html: `<div class="fc-content-wrapper">${iconHtml} ${timeHtml} ${titleHtml}</div>` };
        },

        dateClick: function(info) { window.openAddTaskModal(info.dateStr); },
        eventClick: function(info) { 
            window.openViewTaskModal(info.event);
            info.jsEvent.preventDefault(); 
        },
        
        events: allTasks.map(t => ({ 
            id: t.id, 
            title: t.title, 
            date: t.date, // אם ה-date כולל שעה, הלוח יציג זאת אוטומטית
            extendedProps: {
                description: t.description,
                hasReminder: t.hasReminder || false // הנחה: השרת מחזיר שדה כזה
            }
        }))
    });

    calendar.render();
    // שמירת ה-API באלמנט לצורך גישה מבחוץ (לא חובה אך עוזר לעדכון מיידי)
    calendarEl._fullCalendarApi = calendar;

    // עדכון משימה קרובה
    const nextTask = allTasks.find(t => new Date(t.date) >= new Date());
    const nextTaskDiv = document.getElementById("next-task");
    if (nextTask) {
        const d = new Date(nextTask.date);
        nextTaskDiv.textContent = `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${nextTask.title}`;
    } else {
        nextTaskDiv.textContent = "אין משימות קרובות";
    }

    const list = document.getElementById("task-list-sidebar");
    if(list) {
        list.innerHTML = ''; 
        allTasks.forEach(t => {
            const li = document.createElement("li");
            const d = new Date(t.date);
            li.textContent = `${d.toLocaleDateString()} - ${t.title}`;
            list.appendChild(li);
        });
    }
});