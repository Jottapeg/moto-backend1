const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  nome: String,
  email: String,
  senha: String,
  // adicione mais campos se quiser
});

module.exports = mongoose.model('Usuario', UsuarioSchema);
