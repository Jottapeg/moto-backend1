const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'O vendedor é obrigatório']
  },
  title: {
    type: String,
    required: [true, 'O título do anúncio é obrigatório'],
    trim: true,
    maxlength: [100, 'O título não pode ter mais de 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'A descrição é obrigatória'],
    trim: true,
    minlength: [50, 'A descrição deve ter pelo menos 50 caracteres']
  },
  price: {
    type: Number,
    required: [true, 'O preço é obrigatório'],
    min: [500, 'O preço mínimo é R$ 500']
  },
  priceNegotiable: {
    type: Boolean,
    default: false
  },
  motorcycle: {
    brand: {
      type: String,
      required: [true, 'A marca é obrigatória'],
      trim: true
    },
    model: {
      type: String,
      required: [true, 'O modelo é obrigatório'],
      trim: true
    },
    year: {
      type: Number,
      required: [true, 'O ano é obrigatório'],
      min: [1950, 'Ano inválido'],
      max: [new Date().getFullYear() + 1, 'Ano inválido']
    },
    mileage: {
      type: Number,
      required: [true, 'A quilometragem é obrigatória'],
      min: [0, 'A quilometragem não pode ser negativa']
    },
    engineSize: {
      type: Number,
      required: [true, 'A cilindrada é obrigatória'],
      min: [50, 'A cilindrada mínima é 50cc']
    },
    color: {
      type: String,
      required: [true, 'A cor é obrigatória'],
      trim: true
    },
    type: {
      type: String,
      required: [true, 'O tipo de moto é obrigatório'],
      enum: ['street', 'custom', 'sport', 'trail', 'scooter', 'touring', 'naked', 'off-road']
    },
    condition: {
      type: String,
      required: [true, 'O estado da moto é obrigatório'],
      enum: ['new', 'used']
    },
    features: [String],
    documents: {
      type: String,
      enum: ['regular', 'pending', 'other'],
      default: 'regular'
    },
    licensePlate: {
      type: String,
      trim: true
    }
  },
  images: [
    {
      url: {
        type: String,
        required: true
      },
      order: {
        type: Number,
        default: 0
      },
      isMain: {
        type: Boolean,
        default: false
      }
    }
  ],
  location: {
    city: {
      type: String,
      required: [true, 'A cidade é obrigatória'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'O estado é obrigatório'],
      trim: true,
      enum: ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
    },
    zipCode: {
      type: String,
      trim: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  paymentMethods: [String],
  status: {
    type: String,
    enum: ['active', 'pending', 'sold', 'expired', 'paused'],
    default: 'pending'
  },
  featured: {
    isFeatured: {
      type: Boolean,
      default: false
    },
    featuredUntil: Date,
    featuredType: {
      type: String,
      enum: ['basic', 'premium', 'spotlight'],
      default: 'basic'
    }
  },
  payment: {
    paid: {
      type: Boolean,
      default: false
    },
    amount: {
      type: Number,
      default: 0
    },
    transactionId: String,
    paidAt: Date,
    expiresAt: Date,
    renewalEnabled: {
      type: Boolean,
      default: false
    }
  },
  statistics: {
    views: {
      type: Number,
      default: 0
    },
    favorites: {
      type: Number,
      default: 0
    },
    inquiries: {
      type: Number,
      default: 0
    },
    lastViewed: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date,
  expiresAt: Date
});

// Middleware para atualizar o campo updatedAt antes de salvar
ListingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Se o status for alterado para 'active' e não houver data de expiração, definir para 30 dias
  if (this.isModified('status') && this.status === 'active' && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  
  next();
});

// Índices para otimizar consultas
ListingSchema.index({ 'motorcycle.brand': 1, 'motorcycle.model': 1 });
ListingSchema.index({ price: 1 });
ListingSchema.index({ 'location.city': 1, 'location.state': 1 });
ListingSchema.index({ status: 1 });
ListingSchema.index({ 'featured.isFeatured': 1 });
ListingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Listing', ListingSchema);
