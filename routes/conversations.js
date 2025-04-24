const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const {
  createConversation,
  getConversations,
  getConversation,
  archiveConversation,
  getMessages,
  sendMessage,
  respondToOffer
} = require('../controllers/messages');

router.route('/')
  .get(protect, getConversations)
  .post(protect, createConversation);

router.route('/:id')
  .get(protect, getConversation);

router.put('/:id/archive', protect, archiveConversation);

router.route('/:id/messages')
  .get(protect, getMessages)
  .post(protect, upload.array('attachments', 5), sendMessage);

router.put('/messages/:id/respond-offer', protect, respondToOffer);

module.exports = router;
