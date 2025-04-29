// routes/usuario.js

const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Usuario = require('../models/usuario');

// Middleware para verificar o token
const autenticarUsuario = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuarioId = decoded.id;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Token inválido ou expirado' });
  }
};

// 🔥 🔥 🔥 AQUI: Rota protegida movida para cá!
router.get('/protegido', autenticarUsuario, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Acesso permitido',
    usuarioId: req.usuarioId,
  });
});

// Rota para cadastrar novo usuário
router.post('/', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ success: false, error: 'Nome, email e senha são obrigatórios' });
    }

    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ success: false, error: 'Email já cadastrado' });
    }

    const salt = await bcryptjs.genSalt(10);
    const senhaCriptografada = await bcryptjs.hash(senha, salt);

    const novoUsuario = new Usuario({ nome, email, senha: senhaCriptografada });
    await novoUsuario.save();

    res.status(201).json({ success: true, usuario: novoUsuario });
  } catch (err) {
    console.error('Erro no cadastro:', err);
    res.status(500).json({ success: false, error: 'Erro ao criar usuário' });
  }
});

// Rota para login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ success: false, error: 'Email e senha são obrigatórios' });
    }

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(400).json({ success: false, error: 'Usuário não encontrado' });
    }

    const senhaCorreta = await bcryptjs.compare(senha, usuario.senha);
    if (!senhaCorreta) {
      return res.status(400).json({ success: false, error: 'Senha incorreta' });
    }

    const token = jwt.sign(
      { id: usuario._id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(200).json({ success: true, token });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ success: false, error: 'Erro ao tentar fazer login' });
  }
});

// Rota para listar usuários
router.get('/', async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.status(200).json({ success: true, usuarios });
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    res.status(500).json({ success: false, error: 'Erro ao listar usuários' });
  }
});

module.exports = router;
