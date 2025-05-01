// app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const usuarioRoutes = require('./routes/usuario');
const motoRoutes = require('./routes/motos');

// Carregar variáveis de ambiente
dotenv.config();

// Conectar ao banco de dados
connectDB();

const app = express();

// Middlewares
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

// Servir arquivos estáticos da pasta 'uploads'
app.use('/uploads', express.static('uploads'));

// Rota raiz para evitar erro 404
app.get('/', (req, res) => {
  res.send('API do Marketplace de Motos rodando...');
});

// Rotas da API
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/usuarios', usuarioRoutes);
app.use('/api/v1/motos', motoRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;
