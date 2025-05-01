// controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');

// @desc    Registrar novo usuário
// @route   POST /api/v1/auth/register
// @access  Público
exports.register = asyncHandler(async (req, res, next) => {
  const { nome, email, senha } = req.body;

  // Verifica se o usuário já existe
  const usuarioExistente = await Usuario.findOne({ email });
  if (usuarioExistente) {
    return next(new ErrorResponse('Usuário já existe com este email', 400));
  }

  // Cria novo usuário
  const usuario = await Usuario.create({
    nome,
    email,
    senha
  });

  enviarTokenResposta(usuario, 200, res);
});

// @desc    Login do usuário
// @route   POST /api/v1/auth/login
// @access  Público
exports.login = asyncHandler(async (req, res, next) => {
  const { email, senha } = req.body;

  // Valida email e senha
  if (!email || !senha) {
    return next(new ErrorResponse('Por favor, forneça email e senha', 400));
  }

  // Verifica se o usuário existe
  const usuario = await Usuario.findOne({ email }).select('+senha');
  if (!usuario) {
    return next(new ErrorResponse('Credenciais inválidas', 401));
  }

  // Verifica se a senha está correta
  const senhaCorreta = await usuario.compararSenha(senha);
  if (!senhaCorreta) {
    return next(new ErrorResponse('Credenciais inválidas', 401));
  }

  enviarTokenResposta(usuario, 200, res);
});

// @desc    Logout do usuário
// @route   GET /api/v1/auth/logout
// @access  Público
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    sucesso: true,
    dados: {}
  });
});

// @desc    Obter dados do usuário logado
// @route   GET /api/v1/auth/me
// @access  Privado
exports.getMe = asyncHandler(async (req, res, next) => {
  const usuario = await Usuario.findById(req.user.id);

  res.status(200).json({
    sucesso: true,
    dados: usuario
  });
});

// @desc    Esqueci a senha
// @route   POST /api/v1/auth/forgot-password
// @access  Público
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const usuario = await Usuario.findOne({ email: req.body.email });

  if (!usuario) {
    return next(new ErrorResponse('Não há usuário com este email', 404));
  }

  // Gera token de redefinição de senha
  const resetToken = usuario.getResetPasswordToken();

  await usuario.save({ validateBeforeSave: false });

  // Cria URL de redefinição
  const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;

  const mensagem = `Você está recebendo este email porque solicitou a redefinição de senha. Por favor, faça uma requisição PUT para: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: usuario.email,
      subject: 'Token de redefinição de senha',
      message: mensagem
    });

    res.status(200).json({ sucesso: true, dados: 'Email enviado' });
  } catch (err) {
    console.error(err);
    usuario.resetPasswordToken = undefined;
    usuario.resetPasswordExpire = undefined;

    await usuario.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email não pôde ser enviado', 500));
  }
});

// @desc    Redefinir senha
// @route   PUT /api/v1/auth/reset-password/:resettoken
// @access  Público
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Obtem o token de redefinição
  const resetPasswordToken = req.params.resettoken;

  const usuario = await Usuario.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!usuario) {
    return next(new ErrorResponse('Token inválido ou expirado', 400));
  }

  // Define nova senha
  usuario.senha = req.body.senha;
  usuario.resetPasswordToken = undefined;
  usuario.resetPasswordExpire = undefined;
  await usuario.save();

  enviarTokenResposta(usuario, 200, res);
});

// @desc    Atualizar detalhes do usuário
// @route   PUT /api/v1/auth/update-details
// @access  Privado
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const camposParaAtualizar = {
    nome: req.body.nome,
    email: req.body.email
  };

  const usuario = await Usuario.findByIdAndUpdate(req.user.id, camposParaAtualizar, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    sucesso: true,
    dados: usuario
  });
});

// @desc    Atualizar senha
// @route   PUT /api/v1/auth/update-password
// @access  Privado
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const usuario = await Usuario.findById(req.user.id).select('+senha');

  // Verifica senha atual
  if (!(await usuario.compararSenha(req.body.senhaAtual))) {
    return next(new ErrorResponse('Senha atual incorreta', 401));
  }

  usuario.senha = req.body.novaSenha;
  await usuario.save();

  enviarTokenResposta(usuario, 200, res);
});

// Função auxiliar para gerar e enviar token
const enviarTokenResposta = (usuario, statusCode, res) => {
  const token = usuario.getSignedJwtToken();

  const opcoes = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true
  };

  res
    .status(statusCode)
    .cookie('token', token, opcoes)
    .json({
      sucesso: true,
      token
    });
};
