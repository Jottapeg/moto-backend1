const express = require('express');
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

