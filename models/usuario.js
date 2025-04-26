const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Por favor, adicione um nome']
  },
  email: {
    type: String,
    required: [true, 'Por favor, adicione um email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor, adicione um email válido'
    ]
  },
  senha: {
    type: String,
    required: [true, 'Por favor, adicione uma senha'],
    minlength: 6,
    select: false // não retorna a senha por padrão
  }
}, {
  timestamps: true // cria automaticamente createdAt e updatedAt
});

module.exports = mongoose.model('Usuario', UsuarioSchema);
