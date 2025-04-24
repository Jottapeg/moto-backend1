const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

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

router.route('/')
  .get(getListings)
  .post(protect, upload.array('images', 10), createListing);

router.route('/:id')
  .get(getListing)
  .put(protect, upload.array('images', 10), updateListing)
  .delete(protect, deleteListing);

router.put('/:id/favorite', protect, favoriteListing);
router.put('/:id/unfavorite', protect, unfavoriteListing);
router.put('/:id/sold', protect, markAsSold);

module.exports = router;
