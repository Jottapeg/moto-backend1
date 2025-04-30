// moto-backend1/controllers/auth.js
const User = require('../models/Usuario');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');
const crypto = require('crypto');

// @desc    Registrar usuário
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, phone, cpf, password, userType } = req.body;

  const user = await User.create({ name, email, phone, cpf, password, userType });

  const emailVerificationToken = user.generateEmailVerificationToken();
  const phoneVerificationCode = user.generatePhoneVerificationCode();
  await user.save({ validateBeforeSave: false });

  const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${emailVerificationToken}`;
  const message = `Você se cadastrou na plataforma MotoMarket. Verifique seu email: \n\n ${verificationUrl}`;

  try {
    await sendEmail({ email: user.email, subject: 'Verificação de Email - MotoMarket', message });
    await sendSMS({ phone: user.phone, message: `Código de verificação MotoMarket: ${phoneVerificationCode}` });
    sendTokenResponse(user, 201, res);
  } catch (err) {
    console.error(err);
    user.verifications.emailVerificationToken = undefined;
    user.verifications.emailVerificationExpires = undefined;
    user.verifications.phoneVerificationCode = undefined;
    user.verifications.phoneVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorResponse('Erro ao enviar email ou SMS', 500));
  }
});

// @desc    Login de usuário
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new ErrorResponse('Informe email e senha', 400));

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return next(new ErrorResponse('Credenciais inválidas', 401));
  }

  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });
  sendTokenResponse(user, 200, res);
});

// @desc    Logout
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
  res.status(200).json({ success: true, data: {} });
});

// @desc    Obter usuário atual
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, data: user });
});

// @desc    Verificar email
// @route   GET /api/v1/auth/verify-email/:token
// @access  Public
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    'verifications.emailVerificationToken': tokenHash,
    'verifications.emailVerificationExpires': { $gt: Date.now() }
  });

  if (!user) return next(new ErrorResponse('Token inválido ou expirado', 400));

  user.verifications.emailVerified = true;
  user.verifications.emailVerificationToken = undefined;
  user.verifications.emailVerificationExpires = undefined;
  await user.save();

  res.status(200).json({ success: true, message: 'Email verificado' });
});

// @desc    Verificar telefone
// @route   POST /api/v1/auth/verify-phone
// @access  Private
exports.verifyPhone = asyncHandler(async (req, res, next) => {
  const { code } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) return next(new ErrorResponse('Usuário não encontrado', 404));

  if (!user.verifications.phoneVerificationCode || user.verifications.phoneVerificationCode !== code || user.verifications.phoneVerificationExpires < Date.now()) {
    return next(new ErrorResponse('Código inválido ou expirado', 400));
  }

  user.verifications.phoneVerified = true;
  user.verifications.phoneVerificationCode = undefined;
  user.verifications.phoneVerificationExpires = undefined;
  await user.save();

  res.status(200).json({ success: true, message: 'Telefone verificado' });
});

// @desc    Reenviar código de verificação de telefone
// @route   GET /api/v1/auth/resend-phone-verification
// @access  Private
exports.resendPhoneVerification = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) return next(new ErrorResponse('Usuário não encontrado', 404));

  const code = user.generatePhoneVerificationCode();
  await user.save({ validateBeforeSave: false });

  try {
    await sendSMS({ phone: user.phone, message: `Código de verificação MotoMarket: ${code}` });
    res.status(200).json({ success: true, message: 'Código reenviado' });
  } catch (err) {
    console.error(err);
    user.verifications.phoneVerificationCode = undefined;
    user.verifications.phoneVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorResponse('Erro ao enviar SMS', 500));
  }
});

// @desc    Esqueci minha senha
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new ErrorResponse('Email não encontrado', 404));

  const token = user.generateResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${token}`;
  const message = `Redefina sua senha aqui: \n\n ${resetUrl}`;

  try {
    await sendEmail({ email: user.email, subject: 'Redefinição de Senha - MotoMarket', message });
    res.status(200).json({ success: true, message: 'Email enviado' });
  } catch (err) {
    console.error(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorResponse('Erro ao enviar email', 500));
  }
});

// @desc    Redefinir senha
// @route   PUT /api/v1/auth/reset-password/:token
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ resetPasswordToken: tokenHash, resetPasswordExpires: { $gt: Date.now() } });

  if (!user) return next(new ErrorResponse('Token inválido ou expirado', 400));

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Atualizar dados do usuário
// @route   PUT /api/v1/auth/update-details
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const updates = {
    name: req.body.name,
    address: req.body.address,
    notifications: req.body.notifications
  };

  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: user });
});

// @desc    Atualizar senha
// @route   PUT /api/v1/auth/update-password
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Senha atual incorreta', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(statusCode).cookie('token', token, options).json({ success: true, token });
};
