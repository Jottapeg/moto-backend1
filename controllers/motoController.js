const Moto = require('../models/Moto');

// Criar moto
exports.criarMoto = async (req, res) => {
  try {
    const novaMoto = new Moto(req.body);
    if (req.file) {
      novaMoto.imagem = req.file.path;
    }
    await novaMoto.save();
    res.status(201).json(novaMoto);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao criar moto' });
  }
};

// Listar motos
exports.listarMotos = async (req, res) => {
  try {
    const motos = await Moto.find();
    res.json(motos);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar motos' });
  }
};

// Obter moto por ID
exports.obterMoto = async (req, res) => {
  try {
    const moto = await Moto.findById(req.params.id);
    if (!moto) return res.status(404).json({ erro: 'Moto não encontrada' });
    res.json(moto);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar moto' });
  }
};

// Atualizar moto
exports.atualizarMoto = async (req, res) => {
  try {
    const atualizacoes = req.body;
    if (req.file) {
      atualizacoes.imagem = req.file.path;
    }
    const moto = await Moto.findByIdAndUpdate(req.params.id, atualizacoes, { new: true });
    if (!moto) return res.status(404).json({ erro: 'Moto não encontrada' });
    res.json(moto);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar moto' });
  }
};

// Deletar moto
exports.deletarMoto = async (req, res) => {
  try {
    const moto = await Moto.findByIdAndDelete(req.params.id);
    if (!moto) return res.status(404).json({ erro: 'Moto não encontrada' });
    res.json({ mensagem: 'Moto deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao deletar moto' });
  }
};

// Marcar como destaque
exports.marcarDestaque = async (req, res) => {
  try {
    const moto = await Moto.findByIdAndUpdate(req.params.id, { destaque: true }, { new: true });
    res.json(moto);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao marcar como destaque' });
  }
};

// Marcar como premium
exports.marcarPremium = async (req, res) => {
  try {
    const moto = await Moto.findByIdAndUpdate(req.params.id, { premium: true }, { new: true });
    res.json(moto);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao marcar como premium' });
  }
};

// Marcar como vendida
exports.marcarVendida = async (req, res) => {
  try {
    const moto = await Moto.findByIdAndUpdate(req.params.id, { vendida: true }, { new: true });
    res.json(moto);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao marcar como vendida' });
  }
};

// Favoritar moto
exports.favoritarMoto = async (req, res) => {
  try {
    const moto = await Moto.findById(req.params.id);
    if (!moto) return res.status(404).json({ erro: 'Moto não encontrada' });
    if (!moto.favoritos) moto.favoritos = [];
    moto.favoritos.push(req.usuario.id);
    await moto.save();
    res.json(moto);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao favoritar moto' });
  }
};

// Desfavoritar moto
exports.desfavoritarMoto = async (req, res) => {
  try {
    const moto = await Moto.findById(req.params.id);
    if (!moto) return res.status(404).json({ erro: 'Moto não encontrada' });
    moto.favoritos = moto.favoritos.filter(id => id.toString() !== req.usuario.id);
    await moto.save();
    res.json(moto);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao desfavoritar moto' });
  }
};
