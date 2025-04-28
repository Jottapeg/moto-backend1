const express = require('express');
const bcryptjs = require('bcryptjs'); // Para comparar a senha
const jwt = require('jsonwebtoken');  // Para gerar o token JWT
const router = express.Router();
const Usuario = require('../models/usuario');

// Rota para criar um novo usuário
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

// Rota para login (usuário)
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    // Verificar se o usuário existe
    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
      return res.status(400).json({ success: false, error: 'Usuário não encontrado' });
    }

    // Verificar se a senha está correta
    const isMatch = await bcryptjs.compare(senha, usuario.senha);

    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Senha incorreta' });
    }

    // Gerar o token JWT
    const token = jwt.sign(
      { id: usuario._id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }  // Token expira conforme a configuração no .env
    );

    res.status(200).json({ success: true, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao tentar fazer login' });
  }
});

// Rota para listar todos os usuários
router.get('/', async (req, res) => {
  try {
    const usuarios = await Usuario.find(); // Busca todos os usuários
    res.status(200).json({ success: true, usuarios });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao listar usuários' });
  }
});

module.exports = router;
