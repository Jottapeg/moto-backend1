const express = require('express');
const router = express.Router();

// @desc    Teste de rota de usuários
// @route   GET /api/v1/usuarios
// @access  Público
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Rota de usuários funcionando!' });
});

// @desc    Criar novo usuário
// @route   POST /api/v1/usuarios
// @access  Público
router.post('/', (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ success: false, error: 'Campos obrigatórios: nome, email, senha' });
  }

  // Aqui você pode salvar no banco de dados depois
  res.status(201).json({
    success: true,
    message: 'Usuário criado com sucesso!',
    data: { nome, email }
  });
});

module.exports = router;
