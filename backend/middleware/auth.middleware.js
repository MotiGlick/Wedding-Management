const jwt = require('jsonwebtoken');

// ⚠️ חשוב: המפתח הסודי חייב להיות זהה למפתח ששימש ליצירת ה-Token (בדרך כלל בקובץ ה-auth controller שלך)
// מומלץ לאחסן את המפתח בקובץ .env
const JWT_SECRET = process.env.JWT_SECRET;

const protect = (req, res, next) => {
    let token;

    // 1. בדיקה אם יש כותרת Authorization בפורמט 'Bearer Token'
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // הפרדת ה-Token מ-'Bearer'
            token = req.headers.authorization.split(' ')[1];

            // 2. אימות ופענוח ה-Token
            const decoded = jwt.verify(token, JWT_SECRET);

            // 3. הטמעת מזהה המשתמש לתוך אובייקט הבקשה (req)
            // הנחה: המזהה נשמר ב-payload של ה-JWT תחת המפתח 'id'.
            req.user = { id: decoded.id }; 
            
            // 4. העברת הבקשה לבקר (Controller) הבא בשרשרת
            next();
            
        } catch (error) {
            console.error("JWT Verification Error:", error.message);
            // אם ה-Token לא תקף, נשלח שגיאה 401
            return res.status(401).json({ message: "לא מאומת, Token נכשל או פג תוקף." });
        }
    }

    // אם ה-Token חסר בכותרת
    if (!token) {
        return res.status(401).json({ message: "לא מאומת, חובה לשלוח Token." });
    }
};

module.exports = { protect };