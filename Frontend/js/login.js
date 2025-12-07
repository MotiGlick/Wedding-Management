// Frontend/js/login.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink'); // ייבוא קישור "שכחתי סיסמה"
    
    // אלמנטים להצגת הודעות שגיאה
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    
    // קבועים ודפוסי אימות
    const MIN_PASSWORD_LENGTH = 6;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 

    // פונקציה כללית להצגת הודעות סטטוס או שגיאה גלובליות
    function setGlobalMessage(message, isError = false) {
        // משתמשים בשדה השגיאה של האימייל להצגת סטטוסים כלליים
        emailError.textContent = message;
        if (isError) {
            emailError.style.color = '#e74c3c'; // אדום לשגיאה
        } else if (message.includes('...')) {
            emailError.style.color = '#3498db'; // כחול לסטטוס (טוען)
        } else {
            emailError.style.color = '#2ecc71'; // ירוק להצלחה
        }
        // מנקים את שגיאות הסיסמה כדי לאפשר הצגת הודעה גלובלית
        if (passwordError) passwordError.textContent = '';
    }

    function validateForm() {
        let isValid = true;
        if (emailError) emailError.textContent = ''; 
        if (passwordError) passwordError.textContent = ''; 

        // אימות אימייל
        if (!emailPattern.test(emailInput.value.trim())) {
            if (emailError) emailError.textContent = 'אנא הזן כתובת אימייל חוקית.';
            isValid = false;
        }

        // אימות סיסמה
        if (passwordInput.value.length < MIN_PASSWORD_LENGTH) {
            if (passwordError) passwordError.textContent = `הסיסמה חייבת להיות באורך של ${MIN_PASSWORD_LENGTH} תווים לפחות.`;
            isValid = false;
        }

        return isValid;
    }
    
    // ----------------------------------------------------
    // 💡 פונקציה לטיפול ב"שכחתי סיסמה" (Forgot Password)
    // ----------------------------------------------------
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault(); // מניעת מעבר אוטומטי כדי להריץ בדיקות
            const email = emailInput.value.trim();

            // אם אין אימייל בשדה ההתחברות - נעבור מיד לדף שחזור הסיסמה
            if (!email || !emailPattern.test(email)) {
                window.location.href = 'email_password.html';
                return;
            }
            
            // אם יש אימייל, ננסה לשלוח את הבקשה מכאן
            setGlobalMessage('...שולח בקשה לאיפוס סיסמה. אנא המתן...');

            try {
                const response = await fetch('http://localhost:3000/api/auth/forgotpassword', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email })
                });

                const result = await response.json();

                if (response.ok) {
                    // הצלחה: מעבר לדף הבא
                    // אופציונלי: שמירת הודעה ל-sessionStorage כדי להציג אותה בדף הבא
                    sessionStorage.setItem('resetMessage', 'נשלח מייל לאיפוס סיסמה לכתובתך.');
                    window.location.href = 'email_password.html';
                } else {
                    // שגיאה מהשרת: נשארים כאן ומציגים הודעה
                    setGlobalMessage(`שגיאה: ${result.message || 'שגיאה בבקשת האיפוס.'}`, true);
                }
            } catch (error) {
                console.error('שגיאת רשת ב-forgotpassword:', error);
                setGlobalMessage('שגיאת רשת. ודא שהשרת פועל על פורט 3000.', true);
            }
        });
    }

    // ----------------------------------------------------
    // פונקציה אסינכרונית לשליחת הנתונים לשרת (Login)
    // ----------------------------------------------------
    async function submitLoginForm(email, password) {
        setGlobalMessage('...מתחבר לשרת...');

        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json().catch(() => ({})); 

            if (response.ok) { 
                if (data.token) {
                    // שמירת ה-Token
                    sessionStorage.setItem('authToken', data.token);
                    console.log('JWT Token successfully saved.');
                    
                    // ניתוב לדף הראשי
                    window.location.href = 'homePage.html'; 
                } else {
                    setGlobalMessage('התחברות הצליחה, אך השרת לא החזיר Token.', true);
                }
            } else {
                // כשלון אימות או שגיאת שרת
                const errorMessage = data.message || 'שם משתמש או סיסמה שגויים. נסה שוב.';
                setGlobalMessage(`Login failed: ${errorMessage}`, true);
            }
        } catch (error) {
            // שגיאות רשת
            console.error('Network or server error:', error);
            setGlobalMessage('אירעה שגיאה בחיבור לשרת. ודא שהשרת פועל.', true);
        }
    }

    form.addEventListener('submit', function(event) {
        event.preventDefault(); // מונע שליחת טופס רגילה

        if (validateForm()) {
            submitLoginForm(emailInput.value, passwordInput.value);
        }
    });
    
    // לוגיקה להצגת/הסתרת סיסמה
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