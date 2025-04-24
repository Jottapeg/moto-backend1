const express = require('express');
const {
  getSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  renewSubscription
} = require('../controllers/subscriptions');

const router = express.Router();

const { protect } = require('../middleware/auth');

router
  .route('/')
  .get(protect, getSubscriptions)
  .post(protect, createSubscription);

router
  .route('/:id')
  .get(protect, getSubscription)
  .put(protect, updateSubscription);

router
  .route('/:id/cancel')
  .put(protect, cancelSubscription);

router
  .route('/:id/renew')
  .put(protect, renewSubscription);

module.exports = router;
