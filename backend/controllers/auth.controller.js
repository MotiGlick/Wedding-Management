const User = require('../models/User'); 
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); // ⬅️ ייבוא ספריית JWT
const JWT_SECRET = process.env.JWT_SECRET; // ⬅️ טעינת המפתח הסודי

// ----------------------------------------------------
// פונקציה ליצירת Token
// ----------------------------------------------------
const generateToken = (id) => {
    // 💡 משתמשים ב-JWT_SECRET שנטען מהסביבה
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: '1d', // זמן תפוגה לדוגמה (יום)
    });
};

exports.register = async (req, res) => {
    try {
        const { email, password, name } = req.body; 

        if (!email || !password || !name) {
            return res.status(400).json({ msg: 'Please enter all fields (Name, Email, Password).' });
        }
        
        let userExists = await User.findOne({ where: { email } });

        if (userExists) {
            return res.status(400).json({ msg: 'User already exists with this email.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const savedUser = await User.create({
            username: name,
            email,
            password: hashedPassword
        });

        res.status(201).json({ 
            message: 'User registered successfully!',
            // ניתן לשלוח Token גם כאן, אך כרגע שולחים רק הודעה
        });

    } catch (error) {
        res.status(500).json({ error: 'Server error during registration process.' });
    }
};


// ----- פונקציית התחברות (LOGIN) - מתוקנת עם JWT -----
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ msg: 'נא להזין אימייל וסיסמה.' });
        }

        // 1. מציאת המשתמש
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(400).json({ msg: 'אימייל או סיסמה שגויים.' });
        }

        // 2. השוואת סיסמאות
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'אימייל או סיסמה שגויים.' });
        }

        // 3. הצלחה: יצירת הטוקן ושליחתו
        const token = generateToken(user.id); // יצירת הטוקן האישי

        res.status(200).json({ 
            token: token, // ⬅️ שליחת הטוקן שנדרש ל-localStorage
            message: 'התחברות בוצעה בהצלחה!',
            user: {
                id: user.id,
                email: user.email,
                username: user.username 
            }
        });
        
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: 'שגיאת שרת במהלך ההתחברות.' });
    }
};