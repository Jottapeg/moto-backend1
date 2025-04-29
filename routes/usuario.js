const express = require('express');
const { cadastrarUsuario, loginUsuario } = require('../controllers/usuarioController');
const jwt = require('jsonwebtoken');
const router = express.Router();

const autenticarUsuario = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuarioId = decoded.id;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Token inválido ou expirado' });
  }
};

router.post('/', cadastrarUsuario);
router.post('/login', loginUsuario);

router.get('/protegido', autenticarUsuario, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Acesso permitido',
    usuarioId: req.usuarioId,
  });
});

module.exports = router;
