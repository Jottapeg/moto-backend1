const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: [true, 'O anúncio é obrigatório']
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Os participantes são obrigatórios']
  }],
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: Date,
    isRead: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Middleware para atualizar o campo updatedAt antes de salvar
ConversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Índices para otimizar consultas
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ listing: 1 });
ConversationSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
