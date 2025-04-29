const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Cadastrar usuário
exports.cadastrarUsuario = async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    const salt = await bcrypt.genSalt(10);
    const senhaCriptografada = await bcrypt.hash(senha, salt);
    const novoUsuario = new Usuario({ nome, email, senha: senhaCriptografada });

    await novoUsuario.save();

    const token = jwt.sign({ id: novoUsuario._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({ success: true, token });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao cadastrar usuário' });
  }
};

// Login
exports.loginUsuario = async (req, res) => {
  const { email, senha } = req.body;

  const usuario = await Usuario.findOne({ email }).select('+senha');
  if (!usuario) return res.status(401).json({ success: false, message: 'Credenciais inválidas' });

  const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
  if (!senhaCorreta) return res.status(401).json({ success: false, message: 'Credenciais inválidas' });

  const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.status(200).json({ success: true, token });
};
