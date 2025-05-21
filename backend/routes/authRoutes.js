const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfile,
  updateUserNick,     
  deleteUserAccount   
} = require('../controllers/authController');

const { registerValidation, loginValidation, validate } = require('../helpers/validator');
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', registerValidation, validate, registerUser);
router.post('/login', loginValidation, validate, loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile/nick', protect, updateUserNick); 
router.delete('/profile', protect, deleteUserAccount);

module.exports = router;