const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Listing = require('../models/Listing');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Iniciar uma nova conversa
// @route   POST /api/v1/conversations
// @access  Private
exports.createConversation = asyncHandler(async (req, res, next) => {
  const { listingId, message } = req.body;
  
  // Verificar se o anúncio existe
  const listing = await Listing.findById(listingId);
  
  if (!listing) {
    return next(
      new ErrorResponse(`Anúncio não encontrado com id ${listingId}`, 404)
    );
  }
  
  // Verificar se o usuário não está tentando conversar consigo mesmo
  if (listing.seller.toString() === req.user.id) {
    return next(
      new ErrorResponse('Não é possível iniciar uma conversa com seu próprio anúncio', 400)
    );
  }
  
  // Verificar se já existe uma conversa entre o usuário e o vendedor para este anúncio
  let conversation = await Conversation.findOne({
    listing: listingId,
    participants: { $all: [req.user.id, listing.seller] }
  });
  
  // Se não existir, criar uma nova conversa
  if (!conversation) {
    conversation = await Conversation.create({
      listing: listingId,
      participants: [req.user.id, listing.seller]
    });
  }
  
  // Criar a mensagem inicial
  if (message) {
    await Message.create({
      conversation: conversation._id,
      sender: req.user.id,
      receiver: listing.seller,
      content: message
    });
    
    // Incrementar contador de consultas no anúncio
    listing.statistics.inquiries += 1;
    await listing.save();
  }
  
  // Retornar a conversa com a última mensagem
  const populatedConversation = await Conversation.findById(conversation._id)
    .populate({
      path: 'participants',
      select: 'name profilePicture'
    })
    .populate({
      path: 'listing',
      select: 'title price motorcycle.brand motorcycle.model images'
    });
  
  res.status(201).json({
    success: true,
    data: populatedConversation
  });
});

// @desc    Obter todas as conversas do usuário
// @route   GET /api/v1/conversations
// @access  Private
exports.getConversations = asyncHandler(async (req, res, next) => {
  const conversations = await Conversation.find({
    participants: req.user.id,
    isActive: true
  })
    .populate({
      path: 'participants',
      select: 'name profilePicture'
    })
    .populate({
      path: 'listing',
      select: 'title price motorcycle.brand motorcycle.model images'
    })
    .sort('-updatedAt');
  
  res.status(200).json({
    success: true,
    count: conversations.length,
    data: conversations
  });
});

// @desc    Obter uma conversa específica
// @route   GET /api/v1/conversations/:id
// @access  Private
exports.getConversation = asyncHandler(async (req, res, next) => {
  const conversation = await Conversation.findById(req.params.id)
    .populate({
      path: 'participants',
      select: 'name profilePicture'
    })
    .populate({
      path: 'listing',
      select: 'title price motorcycle.brand motorcycle.model images'
    });
  
  if (!conversation) {
    return next(
      new ErrorResponse(`Conversa não encontrada com id ${req.params.id}`, 404)
    );
  }
  
  // Verificar se o usuário é participante da conversa
  if (!conversation.participants.some(p => p._id.toString() === req.user.id)) {
    return next(
      new ErrorResponse('Não autorizado a acessar esta conversa', 401)
    );
  }
  
  res.status(200).json({
    success: true,
    data: conversation
  });
});

// @desc    Arquivar uma conversa
// @route   PUT /api/v1/conversations/:id/archive
// @access  Private
exports.archiveConversation = asyncHandler(async (req, res, next) => {
  let conversation = await Conversation.findById(req.params.id);
  
  if (!conversation) {
    return next(
      new ErrorResponse(`Conversa não encontrada com id ${req.params.id}`, 404)
    );
  }
  
  // Verificar se o usuário é participante da conversa
  if (!conversation.participants.includes(req.user.id)) {
    return next(
      new ErrorResponse('Não autorizado a arquivar esta conversa', 401)
    );
  }
  
  // Atualizar para inativa
  conversation = await Conversation.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  
  res.status(200).json({
    success: true,
    data: conversation
  });
});

// @desc    Obter mensagens de uma conversa
// @route   GET /api/v1/conversations/:id/messages
// @access  Private
exports.getMessages = asyncHandler(async (req, res, next) => {
  const conversation = await Conversation.findById(req.params.id);
  
  if (!conversation) {
    return next(
      new ErrorResponse(`Conversa não encontrada com id ${req.params.id}`, 404)
    );
  }
  
  // Verificar se o usuário é participante da conversa
  if (!conversation.participants.includes(req.user.id)) {
    return next(
      new ErrorResponse('Não autorizado a acessar mensagens desta conversa', 401)
    );
  }
  
  // Paginação
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Message.countDocuments({ conversation: req.params.id });
  
  // Obter mensagens ordenadas da mais recente para a mais antiga
  const messages = await Message.find({ conversation: req.params.id })
    .sort('-createdAt')
    .skip(startIndex)
    .limit(limit)
    .populate({
      path: 'sender',
      select: 'name profilePicture'
    });
  
  // Marcar mensagens como lidas
  await Message.updateMany(
    {
      conversation: req.params.id,
      receiver: req.user.id,
      isRead: false
    },
    {
      isRead: true,
      readAt: Date.now()
    }
  );
  
  // Objeto de resposta com paginação
  const pagination = {};
  
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }
  
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }
  
  res.status(200).json({
    success: true,
    count: messages.length,
    pagination,
    data: messages
  });
});

// @desc    Enviar uma mensagem
// @route   POST /api/v1/conversations/:id/messages
// @access  Private
exports.sendMessage = asyncHandler(async (req, res, next) => {
  const { content, isOffer, offerAmount } = req.body;
  
  const conversation = await Conversation.findById(req.params.id);
  
  if (!conversation) {
    return next(
      new ErrorResponse(`Conversa não encontrada com id ${req.params.id}`, 404)
    );
  }
  
  // Verificar se o usuário é participante da conversa
  if (!conversation.participants.includes(req.user.id)) {
    return next(
      new ErrorResponse('Não autorizado a enviar mensagens nesta conversa', 401)
    );
  }
  
  // Determinar o destinatário (o outro participante)
  const receiver = conversation.participants.find(
    p => p.toString() !== req.user.id
  );
  
  // Criar a mensagem
  const messageData = {
    conversation: req.params.id,
    sender: req.user.id,
    receiver,
    content
  };
  
  // Se for uma oferta, adicionar os detalhes
  if (isOffer && offerAmount) {
    messageData.isOffer = true;
    messageData.offer = {
      amount: offerAmount,
      status: 'pending'
    };
  }
  
  // Processar anexos se existirem
  if (req.files && req.files.length > 0) {
    const attachments = [];
    
    for (let i = 0; i < req.files.length; i++) {
      const result = await cloudinary.uploader.upload(req.files[i].path, {
        folder: 'moto_marketplace/messages',
        use_filename: true
      });
      
      attachments.push({
        type: req.files[i].mimetype.startsWith('image/') ? 'image' : 'document',
        url: result.secure_url,
        name: req.files[i].originalname
      });
    }
    
    messageData.attachments = attachments;
  }
  
  const message = await Message.create(messageData);
  
  // Atualizar a conversa como ativa
  await Conversation.findByIdAndUpdate(req.params.id, {
    isActive: true,
    updatedAt: Date.now()
  });
  
  // Retornar a mensagem com o remetente populado
  const populatedMessage = await Message.findById(message._id).populate({
    path: 'sender',
    select: 'name profilePicture'
  });
  
  res.status(201).json({
    success: true,
    data: populatedMessage
  });
});

// @desc    Responder a uma oferta
// @route   PUT /api/v1/messages/:id/respond-offer
// @access  Private
exports.respondToOffer = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  
  if (!['accepted', 'rejected'].includes(status)) {
    return next(
      new ErrorResponse('Status inválido. Use "accepted" ou "rejected"', 400)
    );
  }
  
  const message = await Message.findById(req.params.id);
  
  if (!message) {
    return next(
      new ErrorResponse(`Mensagem não encontrada com id ${req.params.id}`, 404)
    );
  }
  
  // Verificar se é uma oferta
  if (!message.isOffer) {
    return next(
      new ErrorResponse('Esta mensagem não é uma oferta', 400)
    );
  }
  
  // Verificar se o usuário é o destinatário da oferta
  if (message.receiver.toString() !== req.user.id) {
    return next(
      new ErrorResponse('Não autorizado a responder a esta oferta', 401)
    );
  }
  
  // Atualizar o status da oferta
  message.offer.status = status;
  await message.save();
  
  // Se a oferta for aceita, enviar uma mensagem automática
  if (status === 'accepted') {
    await Message.create({
      conversation: message.conversation,
      sender: req.user.id,
      receiver: message.sender,
      content: `Oferta de ${message.offer.amount.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })} aceita! Entre em contato para combinar os detalhes.`
    });
  }
  
  res.status(200).json({
    success: true,
    data: message
  });
});
