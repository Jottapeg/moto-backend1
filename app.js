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
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
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

// Importar rotas (ajustado com base nos arquivos que você enviou)
const usuarioRoutes = require('./routes/usuario');
const motoRoutes = require('./routes/motos');

// Usar as rotas
app.use('/api/v1/usuarios', usuarioRoutes);
app.use('/api/v1/motos', motoRoutes);

console.log("✅ Rotas principais registradas: /api/v1/usuarios e /api/v1/motos");

// Rota raiz
app.get('/', (req, res) => {
  res.send('Servidor está funcionando corretamente!');
});

// Rota ping
app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
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

    console.log('✅ MongoDB conectado');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Erro ao conectar ao MongoDB:', err.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
