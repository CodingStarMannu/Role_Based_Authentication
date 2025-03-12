const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUsers,
  getUserById,
  updateUserStatus
} = require('../controllers/userController');
const { authenticate, canManageUser } = require('../middleware/auth');

// Public route for login
router.post('/login', loginUser);

// Protected routes
router.post('/register', authenticate, registerUser);
router.get('/', authenticate, getUsers);
router.get('/:userId', authenticate, canManageUser, getUserById);
router.patch('/:userId/status', authenticate, canManageUser, updateUserStatus);

module.exports = router;