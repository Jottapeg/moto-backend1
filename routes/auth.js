const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const { proteger } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.get('/me', proteger, authController.getMe);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/verify-phone', proteger, authController.verifyPhone);
router.get('/resend-phone-verification', proteger, authController.resendPhoneVerification);
router.post('/forgot-password', authController.forgotPassword);
router.put('/reset-password/:token', authController.resetPassword);
router.put('/update-details', proteger, authController.updateDetails);
router.put('/update-password', proteger, authController.updatePassword);

module.exports = router;
