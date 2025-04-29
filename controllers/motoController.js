const Moto = require('../models/Moto');

// Criar uma nova moto
exports.criarMoto = async (req, res) => {
  try {
    const novaMoto = new Moto({
      ...req.body,
      usuario: req.usuario.id,
      imagem: req.file ? req.file.filename : 'no-photo.jpg',
    });
    const motoSalva = await novaMoto.save();
    res.status(201).json(motoSalva);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar moto', detalhes: err.message });
  }
};

// Listar todas as motos
exports.listarMotos = async (req, res) => {
  try {
    const motos = await Moto.find().populate('usuario', 'nome email');
    res.json(motos);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar motos' });
  }
};

// Obter uma moto específica
exports.obterMoto = async (req, res) => {
  try {
    const moto = await Moto.findById(req.params.id).populate('usuario', 'nome email');
    if (!moto) return res.status(404).json({ error: 'Moto não encontrada' });
    res.json(moto);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar moto' });
  }
};

// Atualizar moto
exports.atualizarMoto = async (req, res) => {
  try {
    const dadosAtualizados = {
      ...req.body,
      imagem: req.file ? req.file.filename : undefined,
    };
    const motoAtualizada = await Moto.findByIdAndUpdate(req.params.id, dadosAtualizados, {
      new: true,
      runValidators: true,
    });
    if (!motoAtualizada) return res.status(404).json({ error: 'Moto não encontrada' });
    res.json(motoAtualizada);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar moto' });
  }
};

// Deletar moto
exports.deletarMoto = async (req, res) => {
  try {
    const moto = await Moto.findByIdAndDelete(req.params.id);
    if (!moto) return res.status(404).json({ error: 'Moto não encontrada' });
    res.json({ sucesso: true, mensagem: 'Moto removida com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar moto' });
  }
};

// Marcar como destaque
exports.marcarDestaque = async (req, res) => {
  try {
    const moto = await Moto.findByIdAndUpdate(req.params.id, { destaque: true }, { new: true });
    res.json(moto);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao destacar moto' });
  }
};

// Marcar como premium
exports.marcarPremium = async (req, res) => {
  try {
    const moto = await Moto.findByIdAndUpdate(req.params.id, { premium: true }, { new: true });
    res.json(moto);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao marcar como premium' });
  }
};

// Marcar como vendida
exports.marcarVendida = async (req, res) => {
  try {
    const moto = await Moto.findByIdAndUpdate(req.params.id, { vendida: true }, { new: true });
    res.json(moto);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao marcar como vendida' });
  }
};

// Favoritar moto
exports.favoritarMoto = async (req, res) => {
  try {
    // lógica simplificada: você pode adaptar para salvar no usuário depois
    res.json({ sucesso: true, mensagem: 'Favoritada com sucesso (placeholder)' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao favoritar' });
  }
};

// Desfavoritar moto
exports.desfavoritarMoto = async (req, res) => {
  try {
    // lógica simplificada: você pode adaptar para remover do usuário depois
    res.json({ sucesso: true, mensagem: 'Desfavoritada com sucesso (placeholder)' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao desfavoritar' });
  }
};
