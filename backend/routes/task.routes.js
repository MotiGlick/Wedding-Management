const express = require('express');
const router = express.Router();
const controller = require('../controllers/task.controller');
const { protect } = require('../middleware/auth.middleware'); // ייבוא תקין


router.get('/', protect, controller.getTasks);
router.post('/', protect, controller.addTask);
router.delete('/:id', protect, controller.deleteTask);
router.put('/:id', protect, controller.updateTaskDescription);

module.exports = router;