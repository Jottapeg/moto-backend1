const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  createPayment,
  getPayments,
  getPayment,
  webhookHandler,
  renewListing
} = require('../controllers/payments');

router.route('/')
  .get(protect, getPayments)
  .post(protect, createPayment);

router.get('/:id', protect, getPayment);
router.post('/webhook', webhookHandler);
router.post('/renew/:listingId', protect, renewListing);

module.exports = router;
