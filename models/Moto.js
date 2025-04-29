const mongoose = require('mongoose');

const MotoSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    titulo: {
      type: String,
      required: [true, 'Por favor, adicione um título para o anúncio'],
      trim: true,
      maxlength: 100,
    },
    descricao: {
      type: String,
      required: [true, 'Por favor, adicione uma descrição'],
      maxlength: 1000,
    },
    preco: {
      type: Number,
      required: [true, 'Por favor, adicione o preço da moto'],
    },
    marca: {
      type: String,
      required: [true, 'Por favor, adicione a marca da moto'],
    },
    modelo: {
      type: String,
      required: [true, 'Por favor, adicione o modelo da moto'],
    },
    ano: {
      type: Number,
      required: [true, 'Por favor, adicione o ano de fabricação'],
    },
    quilometragem: {
      type: Number,
      required: [true, 'Por favor, adicione a quilometragem da moto'],
    },
    imagem: {
      type: String,
      default: 'no-photo.jpg',
    },
    destaque: {
      type: Boolean,
      default: false,
    },
    premium: {
      type: Boolean,
      default: false,
    },
    vendida: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Moto', MotoSchema);
