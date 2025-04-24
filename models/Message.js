const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: [true, 'A conversa é obrigatória']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'O remetente é obrigatório']
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'O destinatário é obrigatório']
  },
  content: {
    type: String,
    required: [true, 'O conteúdo da mensagem é obrigatório'],
    trim: true
  },
  attachments: [
    {
      type: {
        type: String,
        enum: ['image', 'document'],
        default: 'image'
      },
      url: {
        type: String,
        required: true
      },
      name: String
    }
  ],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  isOffer: {
    type: Boolean,
    default: false
  },
  offer: {
    amount: Number,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired'],
      default: 'pending'
    }
  }
});

// Middleware para atualizar a última mensagem na conversa
MessageSchema.post('save', async function() {
  try {
    const Conversation = mongoose.model('Conversation');
    
    await Conversation.findByIdAndUpdate(this.conversation, {
      lastMessage: {
        content: this.content,
        sender: this.sender,
        createdAt: this.createdAt,
        isRead: this.isRead
      },
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Erro ao atualizar a última mensagem na conversa:', error);
  }
});

// Índices para otimizar consultas
MessageSchema.index({ conversation: 1, createdAt: 1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ receiver: 1 });
MessageSchema.index({ isRead: 1 });

module.exports = mongoose.model('Message', MessageSchema);
