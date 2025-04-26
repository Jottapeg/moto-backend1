const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const usuario = require('../models/usuario');


// Proteger rotas
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Verificar se o token está no header Authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Extrair token do header
    token = req.headers.authorization.split(' ')[1];
  } 
  // Verificar se o token está nos cookies
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Verificar se o token existe
  if (!token) {
    return next(new ErrorResponse('Não autorizado a acessar esta rota', 401));
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_development');

    // Adicionar usuário à requisição
    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    return next(new ErrorResponse('Não autorizado a acessar esta rota', 401));
  }
});

// Conceder acesso a funções específicas
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.userType)) {
      return next(
        new ErrorResponse(
          `Usuário do tipo ${req.user.userType} não está autorizado a acessar esta rota`,
          403
        )
      );
    }
    next();
  };
};
