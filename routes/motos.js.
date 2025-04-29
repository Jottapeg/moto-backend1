const express = require('express');
const { criarMoto, listarMotos, deletarMoto } = require('../controllers/motoController');
const { proteger } = require('../middleware/auth');

const router = express.Router();

// Criar uma nova moto (rota protegida)
router.post('/', proteger, criarMoto);

// Listar todas as motos (rota pública)
router.get('/', listarMotos);

// Deletar uma moto por ID (rota protegida)
router.delete('/:id', proteger, deletarMoto);

module.exports = router;
