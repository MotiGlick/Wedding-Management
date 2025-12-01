// guest.js - טיפול בטופס הוספת אורח 

async function handleSubmit(e) { 
    e.preventDefault(); 

    const form = document.getElementById('guestForm'); 
    const data = Object.fromEntries(new FormData(form).entries()); 

    if (!data.firstName || !data.lastName || !data.rsvp) { 
        alert('נא למלא שם פרטי, שם משפחה וסטטוס אישור הגעה.'); 
        return; 
    } 

    try { 
        const token = localStorage.getItem('token'); // אם יש JWT מאומת

        const response = await fetch('http://localhost:3000/api/guests', { 
            method: 'POST', 
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': token ? `Bearer ${token}` : undefined 
            }, 
            body: JSON.stringify(data) 
        }); 

        if (!response.ok) throw new Error('שגיאה בשמירת האורח'); 

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
