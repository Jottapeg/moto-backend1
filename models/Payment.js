const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'O usuário é obrigatório']
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: [true, 'O anúncio é obrigatório']
  },
  amount: {
    type: Number,
    required: [true, 'O valor é obrigatório'],
    min: [1, 'O valor mínimo é R$ 1,00']
  },
  currency: {
    type: String,
    default: 'BRL'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'boleto', 'pix'],
    required: [true, 'O método de pagamento é obrigatório']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: String,
  paymentDetails: {
    cardLastFour: String,
    boleto: {
      code: String,
      pdf: String,
      expiresAt: Date
    },
    pix: {
      qrCode: String,
      copyPaste: String,
      expiresAt: Date
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date,
  completedAt: Date
});

// Middleware para atualizar o campo updatedAt antes de salvar
PaymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Se o status for alterado para 'completed', definir completedAt
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = Date.now();
  }
  
  next();
});

// Middleware para atualizar o anúncio quando o pagamento for concluído
PaymentSchema.post('save', async function() {
  if (this.status === 'completed' && this.isModified('status')) {
    try {
      const Listing = mongoose.model('Listing');
      
      // Atualizar o anúncio com as informações de pagamento
      await Listing.findByIdAndUpdate(this.listing, {
        'payment.paid': true,
        'payment.amount': this.amount,
        'payment.transactionId': this.transactionId,
        'payment.paidAt': this.completedAt,
        'payment.expiresAt': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Erro ao atualizar o anúncio após pagamento:', error);
    }
  }
});

// Índices para otimizar consultas
PaymentSchema.index({ user: 1 });
PaymentSchema.index({ listing: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', PaymentSchema);
