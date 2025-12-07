// auth.routes.js

const express = require('express');
const router = express.Router();
// ייבוא פונקציית ההרשמה מהבקר

//console.log("🚩 [ROUTES] Auth router loaded."); // הדגל החדש
// *** התיקון: אנו מייבאים את הבקר (auto.controller.js) ***
const authController = require('../controllers/auth.controller'); 

// מגדיר ראוט מסוג POST עבור ההרשמה.
// כאשר לקוח שולח בקשת POST לכתובת זו, הפונקציה register מופעלת.
router.post('/register', authController.register);

// ראוט התחברות חדש
router.post('/login', authController.login); // מוסיף ראוט POST חדש
router.post('/forgotpassword', authController.forgotPassword);
router.post('/resetpassword/:resetToken', authController.resetPassword);
module.exports = router;

// הערה: קובץ זה צריך להיות מחובר לאפליקציה הראשית שלך (server.js/app.js) באמצעות app.use('/api/auth', authRouter);