const express = require('express');
const {
  criarMoto,
  listarMotos,
  obterMoto,
  atualizarMoto,
  deletarMoto,
  marcarDestaque,
  marcarPremium,
  marcarVendida,
  favoritarMoto,
  desfavoritarMoto
} = require('../controllers/motoController');

const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Criar e listar motos
// GET público, POST protegido
router
  .route('/')
  .get(listarMotos)
  .post(protect, upload.single('imagem'), criarMoto);

// Operações em uma moto específica
// GET público, PUT/DELETE protegidos
router
  .route('/:id')
  .get(obterMoto)
  .put(protect, upload.single('imagem'), atualizarMoto)
  .delete(protect, deletarMoto);

// Rotas suplementares (todas protegidas)
router.put('/:id/destaque', protect, marcarDestaque);
router.put('/:id/premium', protect, marcarPremium);
router.put('/:id/vendida', protect, marcarVendida);

router.put('/:id/favoritar', protect, favoritarMoto);
router.put('/:id/desfavoritar', protect, desfavoritarMoto);

module.exports = router;
