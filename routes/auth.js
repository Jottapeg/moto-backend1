// routes/auth.js
// -----------------------------------------
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const { protect } = require('../middleware/auth'); // chama 'protect', não 'proteger'

// Registro e login (públicos)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Logout (limpa cookie) — privado se usar cookie, mas deixamos público aqui
router.get('/logout', authController.logout);

// Rotas que exigem login
router.get('/me', protect, authController.getMe);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/verify-phone', protect, authController.verifyPhone);
router.get('/resend-phone-verification', protect, authController.resendPhoneVerification);
router.post('/forgot-password', authController.forgotPassword);
router.put('/reset-password/:token', authController.resetPassword);
router.put('/update-details', protect, authController.updateDetails);
router.put('/update-password', protect, authController.updatePassword);

module.exports = router;
