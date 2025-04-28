const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true }
}, { timestamps: true });

// Antes de salvar, vamos criptografar a senha
usuarioSchema.pre('save', async function(next) {
  if (!this.isModified('senha')) return next();

  const salt = await bcryptjs.genSalt(10);
  this.senha = await bcryptjs.hash(this.senha, salt);
  next();
});

module.exports = mongoose.model('Usuario', usuarioSchema);
