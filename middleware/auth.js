// middleware/auth.js
// ---------------------------------------------------------
const jwt = require('jsonwebtoken');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Usuario = require('../models/Usuario');

// Proteger rotas
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1) Tenta extrair do header Authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2) Ou dos cookies (se estiver usando cookies)
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Se não encontrou token
  if (!token) {
    return next(new ErrorResponse('Não autorizado', 401));
  }

  try {
    // Verifica e decodifica
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Anexa usuário na req
    req.user = await Usuario.findById(decoded.id);
    next();
  } catch (err) {
    return next(new ErrorResponse('Token inválido', 401));
  }
});
