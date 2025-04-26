const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');  // Middleware de proteção para rotas que necessitam de autenticação
const { upload } = require('../middleware/upload');  // Middleware de upload de arquivos

// Importando os controladores para as ações de listagem
const {
  createListing,
  getListings,
  getListing,
  updateListing,
  deleteListing,
  favoriteListing,
  unfavoriteListing,
  markAsSold
} = require('../controllers/listings');

// Rota para obter todas as listagens e criar uma nova
router.route('/')
  .get(getListings)  // Pega todas as listagens
  .post(protect, upload.array('images', 10), createListing);  // Protege a rota, permitindo apenas usuários autenticados

// Rota para operações específicas de uma listagem com base no ID
router.route('/:id')
  .get(getListing)  // Pega uma listagem específica pelo ID
  .put(protect, upload.array('images', 10), updateListing)  // Atualiza uma listagem (autenticado)
  .delete(protect, deleteListing);  // Deleta uma listagem (autenticado)

// Rotas para favoritar, desfavoritar e marcar como vendida
router.put('/:id/favorite', protect, favoriteListing);  // Favorita a listagem
router.put('/:id/unfavorite', protect, unfavoriteListing);  // Desfavorita a listagem
router.put('/:id/sold', protect, markAsSold);  // Marca como vendida

module.exports = router;
