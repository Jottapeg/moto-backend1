const express = require('express');
const bcrypt = require('bcryptjs'); // Importando bcryptjs para criptografar senhas
const router = express.Router();
const Usuario = require('../models/usuario');

// Rota para criar um novo usuário
router.post('/', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    // Criptografar a senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(senha, salt);

    // Criar um novo usuário
    const novoUsuario = new Usuario({ nome, email, senha: hashedPassword });

    // Salvar o usuário no banco de dados
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
