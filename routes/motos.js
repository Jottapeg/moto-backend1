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

const { proteger } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Criar e listar motos
router.route('/')
  .get(listarMotos)
  .post(proteger, upload.single('imagem'), criarMoto); // Função de callback 'criarMoto' correta

// Operações com uma moto específica
router.route('/:id')
  .get(obterMoto)
  .put(proteger, upload.single('imagem'), atualizarMoto)
  .delete(proteger, deletarMoto);

// Destaque, Premium e Vendida
router.put('/:id/destaque', proteger, marcarDestaque);
router.put('/:id/premium', proteger, marcarPremium);
router.put('/:id/vendida', proteger, marcarVendida);

// Favoritar e desfavoritar
router.put('/:id/favoritar', proteger, favoritarMoto);
router.put('/:id/desfavoritar', proteger, desfavoritarMoto);

module.exports = router;
