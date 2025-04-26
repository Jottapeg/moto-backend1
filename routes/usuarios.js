const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');

// Criar novo usuário
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

module.exports = router;

