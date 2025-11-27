// login.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    
    const MIN_PASSWORD_LENGTH = 6;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 

    function validateForm() {
        let isValid = true;

        // אימות אימייל
        if (!emailPattern.test(emailInput.value)) {
            emailError.textContent = 'אנא הזן כתובת אימייל חוקית.';
            isValid = false;
        } else {
            emailError.textContent = ''; 
        }

        // אימות סיסמה
        if (passwordInput.value.length < MIN_PASSWORD_LENGTH) {
            passwordError.textContent = `הסיסמה חייבת להיות באורך של ${MIN_PASSWORD_LENGTH} תווים לפחות.`;
            isValid = false;
        } else {
            passwordError.textContent = ''; 
        }

        return isValid;
    }
    
    // פונקציה אסינכרונית לשליחת הנתונים לשרת
    async function submitLoginForm(email, password) {
        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            // 1. קריאת גוף התגובה - חיוני כדי לקבל את ה-Token
            const data = await response.json().catch(() => ({})); 

            if (response.ok) { 
                // ⬇️ 2. שמירת ה-Token באחסון המקומי - התיקון הקריטי
                if (data.token) {
                    sessionStorage.setItem('authToken', data.token);
                    //localStorage.setItem('authToken', data.token); 
                    console.log('JWT Token successfully saved.');
                    
                    // 3. ניתוב לדף המשימות (task.html)
                    window.location.href = 'homePage.html'; // ⬅️ הנתיב ללוח השנה
                } else {
                    alert('התחברות הצליחה, אך השרת לא החזיר Token.');
                }
            } else {
                // כשלון אימות (401) או שגיאת שרת (500)
                const errorMessage = data.message || 'שם משתמש או סיסמה שגויים. נסה שוב.';
                alert(`Login failed: ${errorMessage}`);
            }
        } catch (error) {
            // שגיאות רשת
            console.error('Network or server error:', error);
            alert('אירעה שגיאה בחיבור לשרת. נסה שוב מאוחר יותר.');
        }
    }

    form.addEventListener('submit', function(event) {
        event.preventDefault(); // מונע שליחת טופס רגילה

        if (validateForm()) {
            submitLoginForm(emailInput.value, passwordInput.value);
        }
    });
    
    // לוגיקה נוספת להצגת/הסתרת סיסמה
    const passwordField = document.getElementById('password');
    const toggleButton = document.getElementById('togglePassword');

    if (toggleButton && passwordField) {
        toggleButton.addEventListener('click', function() {
            const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordField.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }
});