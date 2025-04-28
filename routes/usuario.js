const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Usuario = require('../models/usuario');

// Cadastro de usuário
router.post('/', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    const novoUsuario = new Usuario({ nome, email, senha });
    await novoUsuario.save();
    res.status(201).json({ success: true, usuario: novoUsuario });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao criar usuário' });
  }
});

// Login do usuário
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
      return res.status(400).json({ success: false, error: 'Usuário não encontrado' });
    }

    const isMatch = await bcryptjs.compare(senha, usuario.senha);

    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Senha incorreta' });
    }

    const token = jwt.sign(
      { id: usuario._id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(200).json({ success: true, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao tentar fazer login' });
  }
});

// Listar todos usuários
router.get('/', async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.status(200).json({ success: true, usuarios });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao listar usuários' });
  }
});

module.exports = router;
