const Task = require('../models/Task');


// ✅ שליפת משימות: סינון לפי המשתמש המחובר
exports.getTasks = async (req, res) => {
    // ה-Middleware מחלץ את המזהה מה-Token
    const userId = req.user.id; 

    try {
        const tasks = await Task.findAll({
            where: {
                userId: userId //  רק המשימות של המשתמש המחובר
            }
        });
        
        // ... (המשך המיפוי)
        res.json(tasks.map(t => ({ id: t.id, title: t.title, date: t.date, completed: t.completed,description: t.description })));
    } catch (error) {
         res.status(500).json({ error: 'שגיאה בשליפת משימות.' });
    }
};

//  יצירת משימה: שיוך למשתמש המחובר
exports.addTask = async (req, res) => {
    const userId = req.user.id; //  חיוני לשמירה
    const { title, date , description } = req.body;
    
    try {
        const task = await Task.create({ 
            title: title, 
            date: date,
            description: description,
            userId: userId //  שיוך המשימה למשתמש
        });
        res.json(task);
    } catch (error) {
         res.status(500).json({ error: 'שגיאה בהוספת משימה.' });
    }
};

//  מחיקת משימה: ודא שהמשתמש מוחק רק את שלו
exports.deleteTask = async (req, res) => {
    const userId = req.user.id;
    
    await Task.destroy({ 
        where: { 
            id: req.params.id,
            userId: userId //  מחיקה מותרת רק אם ה-userId תואם
        } 
    });
    res.json({ msg: 'Task deleted' });
};


//  עדכון תיאור משימה (נדרש עבור 'שמור תיאור' ב-JS)
exports.updateTaskDescription = async (req, res) => {
    const userId = req.user.id;
    const taskId = req.params.id; // מזהה המשימה מגיע מה-URL
    const { description } = req.body;
    
    try {
        const [updated] = await Task.update(
            { description: description },
            {
                where: {
                    id: taskId,
                    userId: userId // ודא שהמשתמש יכול לעדכן רק את המשימות שלו
                }
            }
        );

        if (updated) {
            return res.json({ message: 'התיאור עודכן בהצלחה.' });
        }
        
        return res.status(404).json({ message: 'משימה לא נמצאה או שאין הרשאה לעדכן.' });
        
    } catch (error) {
         res.status(500).json({ error: 'שגיאה בעדכון התיאור.' });
    }
};
