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
app.set('trust proxy', 1); // Colocado no início, onde é o correto

// Middleware de segurança
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());
app.use(hpp());

// Limitar requisições
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 100 // 100 requisições por IP
});
app.use('/api/', limiter);

// Middleware para CORS
app.use(cors());

// Middleware para parsing
app.use(express.json());
app.use(cookieParser());

// Middleware para upload de arquivos
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  abortOnLimit: true
}));

// Importar rotas
const authRoutes = require('./routes/auth');
const listingRoutes = require('./routes/listings');
const conversationRoutes = require('./routes/conversations');
const paymentRoutes = require('./routes/payments');
const subscriptionRoutes = require('./routes/subscriptions');
const usuarioRoutes = require('./routes/usuario'); // Rota de usuários

// Definir rotas da API
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/listings', listingRoutes);
app.use('/api/v1/conversations', conversationRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/usuarios', usuarioRoutes);

console.log("Rotas principais registradas!");

// Rota raiz
app.get('/', (req, res) => {
  res.send('Servidor está funcionando corretamente!');
});

// Rota ping
app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

// Middleware para tratamento de erros
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

