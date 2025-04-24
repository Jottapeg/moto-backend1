const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  verifyPhone,
  resendPhoneVerification,
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword
} = require('../controllers/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.get('/verify-email/:token', verifyEmail);
router.post('/verify-phone', protect, verifyPhone);
router.get('/resend-phone-verification', protect, resendPhoneVerification);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.put('/update-details', protect, updateDetails);
router.put('/update-password', protect, updatePassword);

module.exports = router;
