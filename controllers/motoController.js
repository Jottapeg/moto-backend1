// controllers/motoController.js

const Moto = require('../models/Moto');

// Criar moto
exports.criarMoto = async (req, res) => {
  try {
    const dados = { ...req.body };
    if (req.file) {
      dados.imagem = req.file.path;
    }
    dados.usuario = req.user.id;
    const moto = await Moto.create(dados);
    return res.status(201).json(moto);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao criar moto', detalhes: err.message });
  }
};

// Listar motos
exports.listarMotos = async (req, res) => {
  try {
    const motos = await Moto.find().populate('usuario', 'nome email');
    return res.json(motos);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao listar motos' });
  }
};

// Obter moto por ID
exports.obterMoto = async (req, res) => {
  try {
    const moto = await Moto.findById(req.params.id).populate('usuario', 'nome email');
    if (!moto) return res.status(404).json({ erro: 'Moto não encontrada' });
    return res.json(moto);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao buscar moto' });
  }
};

// Atualizar moto
exports.atualizarMoto = async (req, res) => {
  try {
    const atualizacoes = { ...req.body };
    if (req.file) {
      atualizacoes.imagem = req.file.path;
    }
    const moto = await Moto.findByIdAndUpdate(req.params.id, atualizacoes, {
      new: true,
      runValidators: true
    });
    if (!moto) return res.status(404).json({ erro: 'Moto não encontrada' });
    return res.json(moto);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao atualizar moto' });
  }
};

// Deletar moto
exports.deletarMoto = async (req, res) => {
  try {
    const moto = await Moto.findByIdAndDelete(req.params.id);
    if (!moto) return res.status(404).json({ erro: 'Moto não encontrada' });
    return res.json({ sucesso: true, mensagem: 'Moto removida com sucesso' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao deletar moto' });
  }
};

// Marcar como destaque
exports.marcarDestaque = async (req, res) => {
  try {
    const moto = await Moto.findByIdAndUpdate(req.params.id, { destaque: true }, { new: true });
    return res.json(moto);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao marcar destaque' });
  }
};

// Marcar como premium
exports.marcarPremium = async (req, res) => {
  try {
    const moto = await Moto.findByIdAndUpdate(req.params.id, { premium: true }, { new: true });
    return res.json(moto);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao marcar premium' });
  }
};

// Marcar como vendida
exports.marcarVendida = async (req, res) => {
  try {
    const moto = await Moto.findByIdAndUpdate(req.params.id, { vendida: true }, { new: true });
    return res.json(moto);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao marcar vendida' });
  }
};

// Favoritar moto
exports.favoritarMoto = async (req, res) => {
  try {
    const moto = await Moto.findById(req.params.id);
    if (!moto) return res.status(404).json({ erro: 'Moto não encontrada' });
    moto.favoritos = moto.favoritos || [];
    moto.favoritos.push(req.user.id);
    await moto.save();
    return res.json(moto);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao favoritar moto' });
  }
};

// Desfavoritar moto
exports.desfavoritarMoto = async (req, res) => {
  try {
    const moto = await Moto.findById(req.params.id);
    if (!moto) return res.status(404).json({ erro: 'Moto não encontrada' });
    moto.favoritos = (moto.favoritos || []).filter(id => id.toString() !== req.user.id);
    await moto.save();
    return res.json(moto);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao desfavoritar moto' });
  }
};
