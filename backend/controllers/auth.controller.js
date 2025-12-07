const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // 💡 נדרש ליצירת טוקני איפוס
const { Sequelize } = require('sequelize'); // נדרש לשאילתת תאריך
const { sendMail } = require('../utils/notificationService'); // 💡 נדרש לשליחת מיילים
const JWT_SECRET = process.env.JWT_SECRET; // ⬅️ טעינת המפתח הסודי

// ----------------------------------------------------
// פונקציה ליצירת Token
// ----------------------------------------------------
const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: '1d', // זמן תפוגה לדוגמה (יום)
    });
};

// ----------------------------------------------------
// [POST] /register (קיים)
// ----------------------------------------------------
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
        });

    } catch (error) {
        res.status(500).json({ error: 'Server error during registration process.' });
    }
};

// ----------------------------------------------------
// [POST] /login (קיים)
// ----------------------------------------------------
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ msg: 'נא להזין אימייל וסיסמה.' });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(400).json({ msg: 'אימייל או סיסמה שגויים.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'אימייל או סיסמה שגויים.' });
        }

        const token = generateToken(user.id);

        res.status(200).json({
            token: token,
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


// ----------------------------------------------------
// 💡 [POST] /forgotpassword (פונקציה חדשה לטיפול בשליחת המייל)
// ----------------------------------------------------
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'אנא ספק אימייל.' });
    }

    let user; // <<< חובה! הגדרה מחוץ ל-try

    try {
        user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(200).json({ message: 'אם האימייל קיים, יישלח קישור לאיפוס סיסמה.' });
        }

        const resetToken = user.getResetPasswordToken();
        await user.save();

       const resetURL = `${req.protocol}://127.0.0.1:5500/resetpassword.html?token=${resetToken}`;


        const message = `
            <h1>איפוס סיסמה לחשבון WedManage</h1>
            <p>לחץ על הקישור הבא כדי לאפס את הסיסמה שלך (בתוקף ל-10 דקות):</p>
            <a href="${resetURL}" target="_blank">${resetURL}</a>
        `;

        await sendMail({
            to: user.email,
            subject: 'בקשת איפוס סיסמה',
            html: message
        });

        res.status(200).json({
            success: true,
            message: 'נשלח מייל לאיפוס סיסמה.'
        });

    } catch (error) {
        // אם יצירת טוקן נכשלה — צריך לנקות את השדות
        if (user) {
            user.resetPasswordToken = null;
            user.resetPasswordExpire = null;
            await user.save();
        }

        console.error("שגיאה ב-forgotPassword:", error);
        res.status(500).json({ message: 'שגיאה פנימית בשליחת מייל האיפוס.' });
    }
};


// ----------------------------------------------------
// 💡 [POST] /resetpassword/:resetToken (פונקציה חדשה לאיפוס בפועל)
// ----------------------------------------------------
exports.resetPassword = async (req, res) => {
    const { resetToken } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'הסיסמה החדשה חייבת להיות באורך של 6 תווים לפחות.' });
    }

    const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    let user; // אפשרי – לא חובה

    try {
        user = await User.findOne({
            where: {
                resetPasswordToken: hashedToken,
                resetPasswordExpire: { [Sequelize.Op.gt]: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'טוקן האיפוס לא תקף או שפג תוקפו.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        user.resetPasswordToken = null;
        user.resetPasswordExpire = null;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'הסיסמה עודכנה בהצלחה! ניתן להתחבר.'
        });

    } catch (error) {
        console.error("❌ שגיאה ב-resetPassword:", error);
        res.status(500).json({ message: 'שגיאה פנימית בשרת בעת איפוס הסיסמה.' });
    }
};
