const express = require('express');
const router = express.Router();

// Rota de teste de usuários
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Rota de usuários funcionando!' });
});

module.exports = router;
