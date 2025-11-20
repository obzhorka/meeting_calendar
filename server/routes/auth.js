const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, getProfile } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Walidacje
const registerValidation = [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Nazwa użytkownika musi mieć 3-50 znaków'),
  body('email').isEmail().normalizeEmail().withMessage('Nieprawidłowy adres email'),
  body('password').isLength({ min: 6 }).withMessage('Hasło musi mieć minimum 6 znaków'),
  body('full_name').optional().trim().isLength({ max: 100 })
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Nieprawidłowy adres email'),
  body('password').notEmpty().withMessage('Hasło jest wymagane')
];

// Endpoints
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/profile', authMiddleware, getProfile);

module.exports = router;

