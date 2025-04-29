const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const Usuario = require('../models/Usuario'); // Corrigido nome do modelo

// Proteger rotas
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new ErrorResponse('Não autorizado a acessar esta rota', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_development');
    req.user = await Usuario.findById(decoded.id); // Corrigido para buscar o usuário correto
    next();
  } catch (err) {
    return next(new ErrorResponse('Token inválido', 401));
  }
});

// Autorizar tipos de usuários
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.userType)) {
      return next(
        new ErrorResponse(
          `Usuário do tipo ${req.user.userType} não está autorizado`,
          403
        )
      );
    }
    next();
  };
};
