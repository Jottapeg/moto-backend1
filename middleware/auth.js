exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new ErrorResponse('Não autorizado, token ausente', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Usuario.findById(decoded.id);

    if (!user) {
      return next(new ErrorResponse('Usuário não encontrado', 404));
    }

    req.user = user;
    next();
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro ao verificar token:', err);
    }
    return next(new ErrorResponse('Token inválido', 401));
  }
});

