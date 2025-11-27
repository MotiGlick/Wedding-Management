const express = require('express');
const router = express.Router();

const expenseController = require('../controllers/expense.controller');
const { protect } = require('../middleware/auth.middleware');

// שליפת כל ההוצאות של המשתמש
router.get('/', protect, expenseController.getExpenses);

// יצירת הוצאה חדשה
router.post('/', protect, expenseController.createExpense);

// מחיקת הוצאה
router.delete('/:id', protect, expenseController.deleteExpense);

// עדכון הוצאה
router.put('/:id', protect, expenseController.updateExpense);

module.exports = router;
