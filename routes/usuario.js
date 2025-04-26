const express = require('express');
const router = express.Router();
const Usuario = require('../models/usuario'); // Corrigido: importação com letra maiúscula igual no uso abaixo

// Criar novo usuário
router.post('/', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    const novoUsuario = new Usuario({ nome, email, senha });
    await novoUsuario.save();

    res.status(201).json({ success: true, usuario: novoUsuario });
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    res.status(500).json({ success: false, error: 'Erro ao criar usuário' });
  }
});

// (opcional) Listar usuários - para testar se rota está funcionando
router.get('/', async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    res.status(500).json({ success: false, error: 'Erro ao listar usuários' });
  }
});

module.exports = router;
