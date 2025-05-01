const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');

dotenv.config();

// Conectar ao banco de dados
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

// Rota raiz para evitar erro 404 ao acessar "/"
app.get('/', (req, res) => {
  res.send('API do Marketplace de Motos rodando...');
});

// Rotas da API
app.use('/api/v1/auth', authRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
