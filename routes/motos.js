// routes/motos.js
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

// CRUD principal
router
  .route('/')
  .get(listarMotos)                                   // público
  .post(protect, upload.single('imagem'), criarMoto); // protegido

router
  .route('/:id')
  .get(obterMoto)                                     // público
  .put(protect, upload.single('imagem'), atualizarMoto) // protegido
  .delete(protect, deletarMoto);                      // protegido

// Endpoints extras (todos protegidos)
router.put('/:id/destaque', protect, marcarDestaque);
router.put('/:id/premium', protect, marcarPremium);
router.put('/:id/vendida', protect, marcarVendida);
router.put('/:id/favoritar', protect, favoritarMoto);
router.put('/:id/desfavoritar', protect, desfavoritarMoto);

module.exports = router;
