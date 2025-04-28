const Moto = require('../models/Moto');

// @desc    Criar nova moto
// @route   POST /api/v1/motos
// @access  Privado
exports.criarMoto = async (req, res) => {
  try {
    const moto = await Moto.create({
      ...req.body,
      usuario: req.usuario.id,
    });

    res.status(201).json({
      success: true,
      moto,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar a moto',
    });
  }
};

// @desc    Listar todas as motos
// @route   GET /api/v1/motos
// @access  Público
exports.listarMotos = async (req, res) => {
  try {
    const motos = await Moto.find().populate('usuario', 'nome email');

    res.status(200).json({
      success: true,
      count: motos.length,
      motos,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar as motos',
    });
  }
};

// @desc    Deletar uma moto
// @route   DELETE /api/v1/motos/:id
// @access  Privado
exports.deletarMoto = async (req, res) => {
  try {
    const moto = await Moto.findById(req.params.id);

    if (!moto) {
      return res.status(404).json({
        success: false,
        error: 'Moto não encontrada',
      });
    }

    // Opcional: checar se a moto pertence ao usuário que está deletando

    await moto.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
      message: 'Moto removida com sucesso',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar a moto',
    });
  }
};
