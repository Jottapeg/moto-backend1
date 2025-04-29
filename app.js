// app.js

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const fileUpload = require('express-fileupload');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Carregar variáveis de ambiente
dotenv.config();

// Inicializar app
const app = express();

// Configurações iniciais
app.set('trust proxy', 1);

// Middlewares de segurança
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());
app.use(hpp());

// Limitar requisições
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: 'http://localhost:3000', // ajuste conforme necessário
  methods: ['GET', 'POST'],
}));

// Parsing
app.use(express.json());
app.use(cookieParser());

// Uploads
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 10 * 1024 * 1024 },
  abortOnLimit: true
}));

// Importar rotas
const authRoutes = require('./routes/auth');
const listingRoutes = require('./routes/listings');
const conversationRoutes = require('./routes/conversations');
const paymentRoutes = require('./routes/payments');
const subscriptionRoutes = require('./routes/subscriptions');
const usuarioRoutes = require('./routes/usuario'); // <- corrigido
const motoRoutes = require('./routes/motoRoutes');

// Rotas públicas
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/listings', listingRoutes);
app.use('/api/v1/conversations', conversationRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/usuarios', usuarioRoutes);
app.use('/api/v1/motos', motoRoutes);

console.log("Rotas principais registradas!");

// Rota raiz
app.get('/', (req, res) => {
  res.send('Servidor está funcionando corretamente!');
});

// Rota ping
app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

// Middleware para verificar o token
const autenticarUsuario = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuarioId = decoded.id;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Token inválido ou expirado' });
  }
};

// Rota protegida
app.get('/api/v1/usuarios/protegido', autenticarUsuario, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Acesso permitido',
    usuarioId: req.usuarioId,
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('Erro interno:', err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';

  res.status(statusCode).json({
    success: false,
    error: message
  });
});

// Conectar ao MongoDB e iniciar servidor
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('MongoDB conectado');

    app.listen(process.env.PORT || 5000, '0.0.0.0', () => {
      console.log(`Servidor rodando na porta ${process.env.PORT || 5000}`);
    });
  } catch (err) {
    console.error('Erro ao conectar ao MongoDB:', err.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
