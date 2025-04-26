const express = require('express');
const router = express.Router();
const Usuario = require('../models/usuario');

// Criar novo usuário
router.post('/', async (req, res) => {
  try {
    console.log('Body recebido:', req.body); // 👈 ADICIONA ESTE LOG

    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ success: false, error: 'Nome, email e senha são obrigatórios' });
    }

    const novoUsuario = new Usuario({ nome, email, senha });
    await novoUsuario.save();

    res.status(201).json({ success: true, usuario: novoUsuario });
  } catch (err) {
    console.error('Erro ao criar usuário:', err); // 👈 LOGA O ERRO COMPLETO
    res.status(500).json({ success: false, error: 'Erro interno ao criar usuário' });
  }
});

module.exports = router;

