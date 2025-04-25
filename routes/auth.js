// Rota de registro
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Verificar se o usuário já existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'O email já está em uso',
      });
    }

    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar o novo usuário
    const newUser = new User({
      email,
      password: hashedPassword,
    });

    // Salvar no banco de dados
    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor',
    });
  }
});

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Rota de login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Verificar se o usuário existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Credenciais inválidas',
      });
    }

    // Comparar a senha fornecida com a senha armazenada no banco de dados
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Credenciais inválidas',
      });
    }

    // Gerar o token JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });

    res.status(200).json({
      success: true,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor',
    });
  }
});

module.exports = router;

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
