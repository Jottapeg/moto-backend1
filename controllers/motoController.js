// controllers/motoController.js

const Moto = require('../models/Moto');

// Criar moto
async function criarMoto(req, res) {
  try {
    const dados = { ...req.body };
    if (req.file) {
      dados.imagem = req.file.path; // ou req.file.filename, conforme seu upload
    }
    dados.usuario = req.user.id;
    const moto = await Moto.create(dados);
    return res.status(201).json(moto);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao criar moto', detalhes: err.message });
  }
}

// Listar motos
async function listarMotos(req, res) {
  try {
    const motos = await Moto.find().populate('usuario', 'nome email');
    return res.json(motos);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao listar motos' });
  }
}

// Obter moto por ID
async function obterMoto(req, res) {
  try {
    const moto = await Moto.findById(req.params.id).populate('usuario', 'nome email');
    if (!moto) return res.status(404).json({ erro: 'Moto não encontrada' });
    return res.json(moto);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao buscar moto' });
  }
}

// Atualizar moto
async function atualizarMoto(req, res) {
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
}

// Deletar moto
async function deletarMoto(req, res) {
  try {
    const moto = await Moto.findByIdAndDelete(req.params.id);
    if (!moto) return res.status(404).json({ erro: 'Moto não encontrada' });
    return res.json({ sucesso: true, mensagem: 'Moto removida com sucesso' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao deletar moto' });
  }
}

// Marcar como destaque
async function marcarDestaque(req, res) {
  try {
    const moto = await Moto.findByIdAndUpdate(req.params.id, { destaque: true }, { new: true });
    return res.json(moto);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao marcar destaque' });
  }
}

// Marcar como premium
async function marcarPremium(req, res) {
  try {
    const moto = await Moto.findByIdAndUpdate(req.params.id, { premium: true }, { new: true });
    return res.json(moto);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao marcar premium' });
  }
}

// Marcar como vendida
async function marcarVendida(req, res) {
  try {
    const moto = await Moto.findByIdAndUpdate(req.params.id, { vendida: true }, { new: true });
    return res.json(moto);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao marcar vendida' });
  }
}

// Favoritar motocicleta
async function favoritarMoto(req, res) {
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
}

// Desfavoritar motocicleta
async function desfavoritarMoto(req, res) {
  try {
    const moto = await Moto.findById(req.params.id);
    if (!moto) return res.status(404).json({ erro: 'Moto não encontrada' });
    moto.favoritos = (moto.favoritos || []).filter(
      uid => uid.toString() !== req.user.id
    );
    await moto.save();
    return res.json(moto);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao desfavoritar moto' });
  }
}

module.exports = {
  criarMoto,
  listarMotos,
  obterMoto,
  atualizarMoto,
  deletarMoto,
  marcarDestaque,
  marcarPremium,
  marcarVendida,
  favoritarMoto,
  desfavoritarMoto
};
