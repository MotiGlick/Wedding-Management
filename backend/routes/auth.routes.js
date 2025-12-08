// auth.routes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller'); 

// ראוט הרשמה
router.post('/register', authController.register);

// ראוט התחברות
router.post('/login', authController.login);

// ראוט שכחתי סיסמה - שליחת סיסמה זמנית במייל
router.post('/forgotpassword', authController.forgotPassword);

module.exports = router;

// הערה: קובץ זה צריך להיות מחובר לאפליקציה הראשית שלך (server.js/app.js) באמצעות app.use('/api/auth', authRouter);