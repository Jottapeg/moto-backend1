const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Payment = require('../models/Payment');

// @desc    Obter todas as assinaturas do usuário
// @route   GET /api/v1/subscriptions
// @access  Private
exports.getSubscriptions = asyncHandler(async (req, res, next) => {
  const subscriptions = await Subscription.find({ user: req.user.id });

  res.status(200).json({
    success: true,
    count: subscriptions.length,
    data: subscriptions
  });
});

// @desc    Obter uma assinatura específica
// @route   GET /api/v1/subscriptions/:id
// @access  Private
exports.getSubscription = asyncHandler(async (req, res, next) => {
  const subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    return next(new ErrorResponse(`Assinatura não encontrada com id ${req.params.id}`, 404));
  }

  // Verificar se a assinatura pertence ao usuário
  if (subscription.user.toString() !== req.user.id) {
    return next(new ErrorResponse(`Usuário não autorizado a acessar esta assinatura`, 401));
  }

  res.status(200).json({
    success: true,
    data: subscription
  });
});

// @desc    Criar nova assinatura
// @route   POST /api/v1/subscriptions
// @access  Private
exports.createSubscription = asyncHandler(async (req, res, next) => {
  // Adicionar usuário ao corpo da requisição
  req.body.user = req.user.id;

  // Verificar se o usuário já tem uma assinatura ativa
  const existingSubscription = await Subscription.findOne({ 
    user: req.user.id,
    status: 'active'
  });

  if (existingSubscription) {
    return next(new ErrorResponse(`Usuário já possui uma assinatura ativa`, 400));
  }

  // Definir preço e data de término com base no plano
  let price = 0;
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1); // Assinatura de 1 mês

  switch (req.body.plan) {
    case 'basic':
      price = 49.90;
      break;
    case 'standard':
      price = 89.90;
      break;
    case 'premium':
      price = 149.90;
      break;
    case 'unlimited':
      price = 199.90;
      break;
    default:
      return next(new ErrorResponse(`Plano inválido`, 400));
  }

  // Criar assinatura
  const subscription = await Subscription.create({
    ...req.body,
    price,
    startDate,
    endDate
  });

  // Criar registro de pagamento
  await Payment.create({
    user: req.user.id,
    type: 'subscription',
    amount: price,
    status: 'completed',
    method: req.body.paymentMethod,
    details: {
      subscriptionId: subscription._id,
      plan: req.body.plan
    }
  });

  // Atualizar status de assinatura do usuário
  await User.findByIdAndUpdate(req.user.id, {
    subscription: {
      active: true,
      plan: req.body.plan,
      expiresAt: endDate
    }
  });

  res.status(201).json({
    success: true,
    data: subscription
  });
});

// @desc    Atualizar assinatura
// @route   PUT /api/v1/subscriptions/:id
// @access  Private
exports.updateSubscription = asyncHandler(async (req, res, next) => {
  let subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    return next(new ErrorResponse(`Assinatura não encontrada com id ${req.params.id}`, 404));
  }

  // Verificar se a assinatura pertence ao usuário
  if (subscription.user.toString() !== req.user.id) {
    return next(new ErrorResponse(`Usuário não autorizado a atualizar esta assinatura`, 401));
  }

  // Campos permitidos para atualização
  const allowedUpdates = ['autoRenew', 'paymentMethod', 'paymentDetails'];
  
  // Filtrar apenas campos permitidos
  const updates = Object.keys(req.body)
    .filter(key => allowedUpdates.includes(key))
    .reduce((obj, key) => {
      obj[key] = req.body[key];
      return obj;
    }, {});

  subscription = await Subscription.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: subscription
  });
});

// @desc    Cancelar assinatura
// @route   PUT /api/v1/subscriptions/:id/cancel
// @access  Private
exports.cancelSubscription = asyncHandler(async (req, res, next) => {
  let subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    return next(new ErrorResponse(`Assinatura não encontrada com id ${req.params.id}`, 404));
  }

  // Verificar se a assinatura pertence ao usuário
  if (subscription.user.toString() !== req.user.id) {
    return next(new ErrorResponse(`Usuário não autorizado a cancelar esta assinatura`, 401));
  }

  // Verificar se a assinatura já está cancelada
  if (subscription.status === 'canceled') {
    return next(new ErrorResponse(`Esta assinatura já está cancelada`, 400));
  }

  // Atualizar status da assinatura
  subscription = await Subscription.findByIdAndUpdate(req.params.id, {
    status: 'canceled',
    autoRenew: false
  }, {
    new: true,
    runValidators: true
  });

  // Atualizar status de assinatura do usuário
  // A assinatura continua ativa até o final do período pago
  await User.findByIdAndUpdate(req.user.id, {
    'subscription.autoRenew': false
  });

  res.status(200).json({
    success: true,
    data: subscription
  });
});

// @desc    Renovar assinatura
// @route   PUT /api/v1/subscriptions/:id/renew
// @access  Private
exports.renewSubscription = asyncHandler(async (req, res, next) => {
  let subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    return next(new ErrorResponse(`Assinatura não encontrada com id ${req.params.id}`, 404));
  }

  // Verificar se a assinatura pertence ao usuário
  if (subscription.user.toString() !== req.user.id) {
    return next(new ErrorResponse(`Usuário não autorizado a renovar esta assinatura`, 401));
  }

  // Verificar se a assinatura está expirada ou cancelada
  if (subscription.status === 'active') {
    return next(new ErrorResponse(`Esta assinatura já está ativa`, 400));
  }

  // Calcular nova data de término
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1); // Assinatura de 1 mês

  // Atualizar assinatura
  subscription = await Subscription.findByIdAndUpdate(req.params.id, {
    status: 'active',
    startDate,
    endDate,
    autoRenew: true
  }, {
    new: true,
    runValidators: true
  });

  // Criar registro de pagamento
  await Payment.create({
    user: req.user.id,
    type: 'subscription',
    amount: subscription.price,
    status: 'completed',
    method: subscription.paymentMethod,
    details: {
      subscriptionId: subscription._id,
      plan: subscription.plan
    }
  });

  // Atualizar status de assinatura do usuário
  await User.findByIdAndUpdate(req.user.id, {
    subscription: {
      active: true,
      plan: subscription.plan,
      expiresAt: endDate,
      autoRenew: true
    }
  });

  res.status(200).json({
    success: true,
    data: subscription
  });
});
