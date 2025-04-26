const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Definir o esquema de usuário
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor, informe seu nome'],
    trim: true,
    minlength: [3, 'Nome deve ter pelo menos 3 caracteres']
  },
  email: {
    type: String,
    required: [true, 'Por favor, informe seu email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor, informe um email válido'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Por favor, informe seu telefone'],
    unique: true,
    trim: true,
    match: [
      /^\(\d{2}\) \d{5}-\d{4}$/,
      'Por favor, informe um telefone válido no formato (99) 99999-9999'
    ]
  },
  cpf: {
    type: String,
    required: [true, 'Por favor, informe seu CPF'],
    unique: true,
    trim: true,
    match: [
      /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
      'Por favor, informe um CPF válido no formato 999.999.999-99'
    ]
  },
  password: {
    type: String,
    required: [true, 'Por favor, informe uma senha'],
    minlength: [6, 'Senha deve ter pelo menos 6 caracteres'],
    select: false
  },
  userType: {
    type: String,
    enum: ['buyer', 'seller', 'both'],
    required: [true, 'Por favor, informe o tipo de usuário']
  },
  accountType: {
    type: String,
    enum: ['individual', 'dealership'],
    default: 'individual'
  },
  address: {
    street: String,
    number: String,
    complement: String,
    neighborhood: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  verifications: {
    emailVerified: {
      type: Boolean,
      default: false
    },
    phoneVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: String,
    phoneVerificationCode: String,
    emailVerificationExpires: Date,
    phoneVerificationExpires: Date
  },
  profilePicture: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date,
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing'
    }
  ],
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    }
  }
});

// Criptografar senha antes de salvar
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  // Atualizar o campo updatedAt
  this.updatedAt = Date.now();
});

// Método para verificar senha
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Método para gerar token JWT
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET || 'secret_key_development',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Método para gerar token de verificação de email
UserSchema.methods.generateEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(20).toString('hex');
  this.verifications.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  this.verifications.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  return verificationToken;
};

// Método para gerar código de verificação de telefone
UserSchema.methods.generatePhoneVerificationCode = function() {
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  this.verifications.phoneVerificationCode = verificationCode;
  this.verifications.phoneVerificationExpires = Date.now() + 10 * 60 * 1000;
  return verificationCode;
};

// Método para gerar token de redefinição de senha
UserSchema.methods.generateResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.model('User', UserSchema);
