exports.proteger = (req, res, next) => {
  // Exemplo simples de autenticação falsa (mock)
  // Substitua por verificação real de token/jwt/sessão
  req.usuario = { id: 'usuario123' }; 
  next();
};
