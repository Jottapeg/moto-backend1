const express = require('express');
const router = express.Router();
const usuario = require('../models/usuario');

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

