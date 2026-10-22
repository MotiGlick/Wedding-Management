// guest.js - טיפול בטופס הוספת אורח 

async function handleSubmit(e) { 
    e.preventDefault(); 

    const form = document.getElementById('guestForm'); 
    const data = Object.fromEntries(new FormData(form).entries()); 

    // בדיקת ולידציה בסיסית (רק שם חובה)
    if (!data.firstName || !data.lastName) { 
        alert('נא למלא שם פרטי ושם משפחה.'); 
        return; 
    } 

    try { 
        // שימוש נכון במשתנה האחסון של הטוקן כפי שמוגדר בשאר המערכת
        const token = sessionStorage.getItem('authToken'); 

        // שימוש בנתיב יחסי כדי שיעבוד גם בענן של Render וגם ב-Localhost
        const response = await fetch('/api/guests', { 
            method: 'POST', 
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': token ? `Bearer ${token}` : undefined 
            }, 
            body: JSON.stringify(data) 
        }); 

        if (!response.ok) {
            throw new Error('שגיאה בשמירת האורח'); 
        }

        const savedGuest = await response.json(); 
        alert(`האורח ${savedGuest.firstName} ${savedGuest.lastName} נוסף בהצלחה!`); 
        form.reset(); 

    } catch (err) { 
        console.error(err); 
        alert('שגיאה בשמירת האורח בשרת'); 
    } 
} 

document.addEventListener('DOMContentLoaded', () => { 
    const form = document.getElementById('guestForm'); 
    if (form) form.addEventListener('submit', handleSubmit); 
});