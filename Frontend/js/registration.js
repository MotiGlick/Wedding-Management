const form = document.getElementById('regForm');
const fullName = document.getElementById('fullName');
const email = document.getElementById('email');
const pw = document.getElementById('password');
const conf = document.getElementById('confirm');
const terms = document.getElementById('terms');
const submitBtn = document.getElementById('submitBtn');
const formMessage = document.getElementById('formMessage');


const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const confirmError = document.getElementById('confirmError');
const fullNameError = document.getElementById('fullNameError');


const reqLength = document.getElementById('req-length');
const reqLower = document.getElementById('req-lower');
const reqUpper = document.getElementById('req-upper');
const reqDigit = document.getElementById('req-digit');
const reqSpecial = document.getElementById('req-special');


const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function checkPasswordRequirements(value) {
  return {
    length: value.length >= 8,
    lower: /[a-zא-ת]/.test(value),
    upper: /[A-Z]/.test(value),
    digit: /\d/.test(value),
    special: /[!@#$%^&*(),.?":{}|<>_\-+=~`\\\/\[\];']/.test(value)
  };
}

function updatePwUI(reqs) {
  reqLength.classList.toggle('ok', reqs.length);
  reqLower.classList.toggle('ok', reqs.lower);
  reqUpper.classList.toggle('ok', reqs.upper);
  reqDigit.classList.toggle('ok', reqs.digit);
  reqSpecial.classList.toggle('ok', reqs.special);
}

function validateFullName() {
  if (!fullName.value.trim()) {
    fullNameError.hidden = false;
    return false;
  }
  fullNameError.hidden = true;
  return true;
}

function validateEmail() {
  if (!emailRegex.test(email.value.trim())) {
    emailError.hidden = false;
    return false;
  }
  emailError.hidden = true;
  return true;
}

function validatePassword() {
  const reqs = checkPasswordRequirements(pw.value);
  updatePwUI(reqs);
  const ok = Object.values(reqs).every(Boolean);
  passwordError.hidden = ok;
  return ok;
}

function validateConfirm() {
  const ok = pw.value === conf.value;
  confirmError.hidden = ok;
  return ok;
}

function updateSubmitState() {
  const ok = validateFullName() && validateEmail() && validatePassword() && validateConfirm() && terms.checked;
  submitBtn.disabled = !ok;
}

email.addEventListener('input', () => { validateEmail(); updateSubmitState(); });
pw.addEventListener('input', () => { validatePassword(); validateConfirm(); updateSubmitState(); });
conf.addEventListener('input', () => { validateConfirm(); updateSubmitState(); });
fullName.addEventListener('input', () => { validateFullName(); updateSubmitState(); });
terms.addEventListener('change', updateSubmitState);


document.getElementById('togglePw').addEventListener('click', () => {
  const isHidden = pw.type === 'password';
  pw.type = conf.type = isHidden ? 'text' : 'password';
});


form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // [--- קוד אימות נשאר זהה ---]
    if (!validateFullName() || !validateEmail() || !validatePassword() || !validateConfirm() || !terms.checked) {
        formMessage.textContent = 'יש לתקן שגיאות לפני השליחה.';
        formMessage.className = 'msg error';
        return;
    }
    
    formMessage.textContent = 'שולח...';
    formMessage.className = 'msg hint';
    submitBtn.disabled = true;

    // *** תיקון 1: שינוי fullName ל-name ***
    const userData = {
        name: fullName.value, 
        email: email.value,
        password: pw.value,
        phone: document.getElementById('phone').value 
    };

    try {
        // ************************************************************
        // 🚩 התיקון: הוספת הכתובת המלאה 'http://localhost:3000'
        // ************************************************************
        const response = await fetch('http://localhost:3000/api/auth/register', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (response.ok) { 
            if (data.token) {
                sessionStorage.setItem('authToken', data.token);
            }
            formMessage.textContent = 'ההרשמה הצליחה! מנתב לדף הבית...';
            formMessage.className = 'msg success';
            window.location.href = 'homePage.html'; 
        } else {
            // *** תיקון 2: ציפייה ל-'msg' ושימוש ב-errorData.msg ***
            const errorData = await response.json().catch(() => ({ msg: 'כשלון הרשמה כללי.' }));
            
            formMessage.textContent = errorData.msg || 'ההרשמה נכשלה עקב שגיאת שרת.';
            formMessage.className = 'msg error';
            submitBtn.disabled = false;
        }
    } catch (error) {
        // כשלון רשת (נשאר זהה)
        console.error('Network error during registration:', error);
        formMessage.textContent = 'שגיאת רשת. נסה שוב מאוחר יותר.';
        formMessage.className = 'msg error';
        submitBtn.disabled = false; 
    }
});

updateSubmitState(); 