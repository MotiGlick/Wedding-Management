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
            // תגובה כללית למניעת חשיפת מידע על קיום משתמשים
            return res.status(200).json({ 
                message: 'אם האימייל קיים במערכת, תישלח סיסמה זמנית.' 
            });
        }

        // יצירת סיסמה זמנית (8 תווים רנדומליים)
        const tempPassword = crypto.randomBytes(4).toString('hex'); // תיצור סיסמה כמו: a3f5d2e1
        
        // הצפנת הסיסמה הזמנית ושמירה במסד הנתונים
        const salt = await bcrypt.genSalt(10);
        const hashedTempPassword = await bcrypt.hash(tempPassword, salt);
        
        user.password = hashedTempPassword;
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
                        <li>השתמש בסיסמה זו כדי להתחבר למערכת</li>
                        <li>מומלץ מאוד לשנות את הסיסמה מיד לאחר ההתחברות</li>
                        <li>אל תשתף סיסמה זו עם אף אחד</li>
                    </ul>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="http://127.0.0.1:5500/Wedding-Management/Frontend/login.html" 
                           style="background-color: #4a90e2; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            התחבר עכשיו
                        </a>
                    </div>
                    
                    <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                        אם לא ביקשת לאפס את הסיסמה, אנא התעלם ממייל זה והסיסמה הקודמת שלך תישאר בתוקף.
                    </p>
                </div>
            </div>
        `;

        // שליחת המייל
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