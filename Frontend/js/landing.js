document.addEventListener('DOMContentLoaded', () => {
    
    // פונקציה למעבר לדף ההתחברות
    function redirectToLogin() {
        // הנתיב לקובץ ה-Login שהעלית
        window.location.href = 'login.html';
    }

    // תפיסת כפתור ההתחברות ב-Header
    const navLoginBtn = document.getElementById('loginBtn');
    if (navLoginBtn) {
        navLoginBtn.addEventListener('click', redirectToLogin);
    }

    // תפיסת כפתור הכניסה הראשי (Hero)
    const heroLoginBtn = document.getElementById('heroLoginBtn');
    if (heroLoginBtn) {
        heroLoginBtn.addEventListener('click', redirectToLogin);
    }

    // אופציונלי: גלילה חלקה ללחיצה על "גלה עוד"
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});