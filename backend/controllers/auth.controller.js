const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendMail } = require('../utils/notificationService');
const JWT_SECRET = process.env.JWT_SECRET;


// ----------------------------------------------------
// פונקציה ליצירת Token
// ----------------------------------------------------
const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: '1d',
    });
};

// ----------------------------------------------------
// [POST] /register
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
// [POST] /login
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
// 💡 [POST] /forgotpassword - שליחת סיסמה זמנית במייל
// ----------------------------------------------------
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'אנא ספק אימייל.' });
    }

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(200).json({ 
                message: 'אם האימייל קיים במערכת, תישלח סיסמה זמנית.' 
            });
        }

        // יצירת סיסמה זמנית (8 תווים רנדומליים)
        const tempPassword = crypto.randomBytes(4).toString('hex');
        
        // שמירת הסיסמה הזמנית המוצפנת בשדה זמני (לא בשדה password הרגיל!)
        const salt = await bcrypt.genSalt(10);
        const hashedTempPassword = await bcrypt.hash(tempPassword, salt);
        
        user.resetPasswordToken = hashedTempPassword; // שומרים את הסיסמה הזמנית כאן
        user.resetPasswordExpire = new Date(Date.now() + 3600000); // תוקף שעה
        await user.save();

        // הכנת תוכן המייל
        const message = `
            <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #4a90e2; text-align: center;">🔐 איפוס סיסמה - WedManage</h2>
                    <p>שלום <strong>${user.username}</strong>,</p>
                    <p>קיבלנו בקשה לאיפוס הסיסמה שלך.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                        <p style="margin: 0; color: #666;">הסיסמה הזמנית שלך היא:</p>
                        <h1 style="color: #4a90e2; font-size: 32px; letter-spacing: 3px; margin: 10px 0;">${tempPassword}</h1>
                    </div>
                    
                    <p style="color: #d9534f; font-weight: bold;">⚠️ חשוב:</p>
                    <ul style="color: #666;">
                        <li>השתמש בסיסמה זו כדי לאפס את הסיסמה שלך</li>
                        <li>הסיסמה הזמנית תקפה לשעה אחת בלבד</li>
                        <li>אל תשתף סיסמה זו עם אף אחד</li>
                    </ul>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="http://127.0.0.1:5500/Wedding-Management/Frontend/resetpassword.html" 
                           style="background-color: #4a90e2; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            אפס סיסמה עכשיו
                        </a>
                    </div>
                    
                    <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                        אם לא ביקשת לאפס את הסיסמה, אנא התעלם ממייל זה.
                    </p>
                </div>
            </div>
        `;

        await sendMail({
            to: user.email,
            subject: '🔐 סיסמה זמנית - WedManage',
            html: message
        });

        res.status(200).json({
            success: true,
            message: 'נשלחה סיסמה זמנית למייל.'
        });

    } catch (error) {
        console.error("❌ שגיאה ב-forgotPassword:", error);
        res.status(500).json({ 
            message: 'שגיאה פנימית בשליחת הסיסמה הזמנית.' 
        });
    }
};


// ----------------------------------------------------
// 💡 [POST] /resetpassword - איפוס סיסמה עם סיסמה זמנית
// ----------------------------------------------------
exports.resetPassword = async (req, res) => {
    const { email, tempPassword, newPassword } = req.body;

    if (!email || !tempPassword || !newPassword) {
        return res.status(400).json({ message: 'נא למלא את כל השדות.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'הסיסמה החדשה חייבת להכיל לפחות 6 תווים.' });
    }

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: 'משתמש לא נמצא.' });
        }

        // בדיקה שיש סיסמה זמנית ושהיא לא פגה
        if (!user.resetPasswordToken || !user.resetPasswordExpire) {
            return res.status(400).json({ message: 'לא נמצאה בקשת איפוס סיסמה פעילה.' });
        }

        if (new Date() > user.resetPasswordExpire) {
            return res.status(400).json({ message: 'הסיסמה הזמנית פגה תוקף. אנא בקש סיסמה חדשה.' });
        }

        // בדיקה שהסיסמה הזמנית נכונה
        const isMatch = await bcrypt.compare(tempPassword, user.resetPasswordToken);

        if (!isMatch) {
            return res.status(400).json({ message: 'הסיסמה הזמנית שגויה.' });
        }

        // הצפנת הסיסמה החדשה
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // עדכון הסיסמה וניקוי השדות הזמניים
        user.password = hashedNewPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpire = null;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'הסיסמה עודכנה בהצלחה!'
        });

    } catch (error) {
        console.error("❌ שגיאה ב-resetPassword:", error);
        res.status(500).json({ 
            message: 'שגיאה פנימית בשינוי הסיסמה.' 
        });
    }
};