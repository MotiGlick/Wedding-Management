const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendMail } = require('../utils/notificationService');
const JWT_SECRET = process.env.JWT_SECRET;


// ----------------------------------------------------
// פונקציה ליצירת Token (JWT)
// ----------------------------------------------------
const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: '1d',
    });
};

// ----------------------------------------------------
// פונקציית עזר לוולידציה של סיסמה חזקה
// ----------------------------------------------------
const validatePassword = (password) => {
    // 1. אורך: לפחות 8 תווים
    if (password.length < 8) {
        return 'הסיסמה חייבת להיות באורך 8 תווים לפחות.';
    }

    // 2. אות גדולה אחת לפחות
    if (!/[A-Z]/.test(password)) {
        return 'הסיסמה חייבת להכיל אות גדולה אחת לפחות (A-Z).';
    }

    // 3. אות קטנה אחת לפחות
    if (!/[a-z]/.test(password)) {
        return 'הסיסמה חייבת להכיל אות קטנה אחת לפחות (a-z).';
    }

    // 4. ספרה אחת לפחות
    if (!/[0-9]/.test(password)) {
        return 'הסיסמה חייבת להכיל ספרה אחת לפחות (0-9).';
    }

    // 5. תו מיוחד אחד לפחות (כגון: !, @, #, $)
    if (!/[^A-Za-z0-9]/.test(password)) {
        return 'הסיסמה חייבת להכיל תו מיוחד אחד לפחות (כגון: !, @, #, $).';
    }

    return null; // אין שגיאה, הסיסמה תקינה
};

// ----------------------------------------------------
// [POST] /register - מעודכן עם יצירת טוקן
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

        const token = generateToken(savedUser.id);

        res.status(201).json({
            message: 'User registered successfully!',
            token: token,
            user: {
                id: savedUser.id,
                email: savedUser.email,
                username: savedUser.username
            }
        });

    } catch (error) {
        console.error("Registration Error:", error);
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


// ======================================================
// 🔑 פונקציה מעודכנת: [POST] /forgotpassword
// ======================================================
/**
 * מטפלת בבקשת איפוס סיסמה ע"י יצירת אסימון בטוח (Token) ושליחתו במייל.
 */
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'אנא ספק אימייל.' });
    }

    try {
        let user = await User.findOne({ where: { email } });

        // מניעת אימות אימייל (Email Enumeration)
        if (!user) {
            return res.status(200).json({ 
                message: 'אם האימייל קיים במערכת, נשלח אליך קישור לאיפוס סיסמה.' 
            });
        }

        // 1. יצירת אסימון גלוי (Reset Token) באורך 32 בתים (64 תווים ב-hex)
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        
        // 2. שמירת הגיבוב (Hash) של האסימון ב-DB
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex'); 
            
        // 3. הגדרת תאריך תפוגה (שעה אחת)
        user.resetPasswordExpire = new Date(Date.now() + 3600000); 
        await user.save();
        
        // יצירת קישור האיפוס המכיל את האסימון הגלוי
        const resetURL = `http://127.0.0.1:5500/Wedding-Management/Frontend/resetpassword.html?token=${resetToken}`;
        
        // הכנת תוכן המייל
        const message = `
            <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #4a90e2; text-align: center;">🔐 איפוס סיסמה - WedManage</h2>
                    <p>שלום <strong>${user.username}</strong>,</p>
                    <p>קיבלנו בקשה לאיפוס הסיסמה שלך. לחץ על הקישור למטה כדי להמשיך:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetURL}" 
                            style="background-color: #4a90e2; color: white; padding: 12px 30px; 
                                    text-decoration: none; border-radius: 5px; display: inline-block;">
                            אפס סיסמה עכשיו
                        </a>
                    </div>
                    <p style="text-align: center; color: #666;"><small>קישור זה תקף לשעה אחת בלבד.</small></p>
                    <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                        אם לא ביקשת לאפס את הסיסמה, אנא התעלם ממייל זה.
                    </p>
                </div>
            </div>
        `;

        await sendMail({
            to: user.email,
            subject: '🔗 קישור לאיפוס סיסמה - WedManage',
            html: message
        });

        res.status(200).json({
            success: true,
            message: 'נשלח קישור לאיפוס סיסמה למייל.'
        });

    } catch (error) {
        console.error("❌ שגיאה ב-forgotPassword:", error);
        // ניקוי השדות במקרה של כשל בשליחה (לצורך אבטחה)
        let user = await User.findOne({ where: { email } });
        if (user) {
            user.resetPasswordToken = null;
            user.resetPasswordExpire = null;
            await user.save();
        }
        res.status(500).json({ 
            message: 'שגיאה פנימית בשליחת קישור האיפוס.' 
        });
    }
};


// ======================================================
// 🔑 פונקציה מעודכנת: [POST] /resetpassword
// ======================================================
/**
 * מקבל את האסימון (Token) ואת הסיסמה החדשה, מאמת ומעדכן את הסיסמה ב-DB.
 */
exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ message: 'נא למלא את כל השדות (אסימון וסיסמה חדשה).' });
    }

    // 1. בדיקת ולידציה של הסיסמה החדשה
    const validationError = validatePassword(newPassword);
    if (validationError) {
        return res.status(400).json({ message: validationError });
    }

    try {
        // 2. חישוב הגיבוב (Hash) של האסימון הנכנס לצורך חיפוש ב-DB
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');
            
        // 3. חיפוש המשתמש לפי האסימון המוצפן (resetPasswordToken)
        const user = await User.findOne({ 
            where: { 
                resetPasswordToken: hashedToken 
            } 
        });

        if (!user) {
            return res.status(400).json({ message: 'אסימון איפוס שגוי או לא קיים.' });
        }

        // 4. בדיקה אם האסימון פג תוקף
        if (new Date() > user.resetPasswordExpire) {
            // ניקוי השדות כדי למנוע שימוש חוזר
            user.resetPasswordToken = null;
            user.resetPasswordExpire = null;
            await user.save();
            return res.status(400).json({ message: 'האסימון פג תוקף. אנא בקש קישור חדש.' });
        }

        // 5. הצפנת הסיסמה החדשה
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // 6. עדכון הסיסמה וניקוי השדות הזמניים (קריטי לאבטחה!)
        user.password = hashedNewPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpire = null;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'הסיסמה עודכנה בהצלחה! ניתן להתחבר עם הסיסמה החדשה.'
        });

    } catch (error) {
        console.error("❌ שגיאה ב-resetPassword:", error);
        res.status(500).json({ 
            message: 'שגיאה פנימית בשינוי הסיסמה.' 
        });
    }
};