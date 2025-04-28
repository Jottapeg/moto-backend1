const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const Usuario = require('../models/usuario');

// Rota para criar um novo usuário
router.post('/', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    // Verificar se já existe um usuário com o mesmo e-mail
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ success: false, error: 'Email já está em uso' });
    }

    // Criptografar a senha
    const salt = await bcrypt.genSalt(10);
    const senhaCriptografada = await bcrypt.hash(senha, salt);

    const novoUsuario = new Usuario({
      nome,
      email,
      senha: senhaCriptografada
    });

    // Salvar no banco de dados
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
    const usuarios = await Usuario.find();
    res.status(200).json({ success: true, usuarios });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao listar usuários' });
  }
});

module.exports = router;
