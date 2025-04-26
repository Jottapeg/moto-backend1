const Payment = require('../models/Payment');
const Listing = require('../models/Listing');
const usuario = require('../models/usuario');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// @desc    Criar um pagamento para anúncio
// @route   POST /api/v1/payments
// @access  Private
exports.createPayment = asyncHandler(async (req, res, next) => {
  const { listingId, paymentMethod, planType } = req.body;
  
  // Verificar se o anúncio existe
  const listing = await Listing.findById(listingId);
  
  if (!listing) {
    return next(
      new ErrorResponse(`Anúncio não encontrado com id ${listingId}`, 404)
    );
  }
  
  // Verificar se o usuário é o dono do anúncio
  if (listing.seller.toString() !== req.user.id) {
    return next(
      new ErrorResponse('Não autorizado a criar pagamento para este anúncio', 401)
    );
  }
  
  // Determinar o valor com base no plano
  let amount = 2990; // Plano básico: R$ 29,90
  let featuredType = 'basic';
  
  if (planType === 'premium') {
    amount = 4990; // Plano premium: R$ 49,90
    featuredType = 'premium';
  } else if (planType === 'spotlight') {
    amount = 7990; // Plano spotlight: R$ 79,90
    featuredType = 'spotlight';
  }
  
  // Criar o pagamento no banco de dados
  const payment = await Payment.create({
    user: req.user.id,
    listing: listingId,
    amount,
    paymentMethod,
    status: 'pending'
  });
  
  // Processar o pagamento de acordo com o método
  if (paymentMethod === 'credit_card') {
    // Processar pagamento com cartão de crédito via Stripe
    const { cardNumber, expMonth, expYear, cvc } = req.body;
    
    try {
      // Criar token do cartão
      const cardToken = await stripe.tokens.create({
        card: {
          number: cardNumber,
          exp_month: expMonth,
          exp_year: expYear,
          cvc: cvc
        }
      });
      
      // Criar o pagamento no Stripe
      const charge = await stripe.charges.create({
        amount: amount,
        currency: 'brl',
        source: cardToken.id,
        description: `Pagamento de anúncio ${listing.title} - Plano ${planType}`
      });
      
      // Atualizar o pagamento com os detalhes do Stripe
      payment.transactionId = charge.id;
      payment.status = 'completed';
      payment.completedAt = Date.now();
      payment.paymentDetails = {
        cardLastFour: cardNumber.slice(-4)
      };
      await payment.save();
      
      // Atualizar o anúncio
      listing.status = 'active';
      listing.featured = {
        isFeatured: planType !== 'basic',
        featuredUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        featuredType
      };
      listing.payment = {
        paid: true,
        amount,
        transactionId: charge.id,
        paidAt: Date.now(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        renewalEnabled: false
      };
      listing.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias
      await listing.save();
      
    } catch (error) {
      console.error('Erro no processamento do cartão:', error);
      
      // Atualizar o pagamento como falho
      payment.status = 'failed';
      await payment.save();
      
      return next(
        new ErrorResponse('Erro no processamento do pagamento com cartão', 400)
      );
    }
  } else if (paymentMethod === 'boleto') {
    // Gerar boleto (simulação)
    const boletoCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const boletoExpiration = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 dias
    
    payment.paymentDetails = {
      boleto: {
        code: boletoCode,
        pdf: `https://api.motomarket.com.br/boletos/${boletoCode}.pdf`,
        expiresAt: boletoExpiration
      }
    };
    await payment.save();
    
  } else if (paymentMethod === 'pix') {
    // Gerar PIX (simulação)
    const pixCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const pixExpiration = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // 1 dia
    
    payment.paymentDetails = {
      pix: {
        qrCode: `https://api.motomarket.com.br/pix/qrcode/${pixCode}.png`,
        copyPaste: pixCode,
        expiresAt: pixExpiration
      }
    };
    await payment.save();
  }
  
  res.status(201).json({
    success: true,
    data: payment
  });
});

// @desc    Obter todos os pagamentos do usuário
// @route   GET /api/v1/payments
// @access  Private
exports.getPayments = asyncHandler(async (req, res, next) => {
  const payments = await Payment.find({ user: req.user.id })
    .populate({
      path: 'listing',
      select: 'title motorcycle.brand motorcycle.model images'
    })
    .sort('-createdAt');
  
  res.status(200).json({
    success: true,
    count: payments.length,
    data: payments
  });
});

// @desc    Obter um pagamento específico
// @route   GET /api/v1/payments/:id
// @access  Private
exports.getPayment = asyncHandler(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id).populate({
    path: 'listing',
    select: 'title motorcycle.brand motorcycle.model images'
  });
  
  if (!payment) {
    return next(
      new ErrorResponse(`Pagamento não encontrado com id ${req.params.id}`, 404)
    );
  }
  
  // Verificar se o usuário é o dono do pagamento
  if (payment.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse('Não autorizado a acessar este pagamento', 401)
    );
  }
  
  res.status(200).json({
    success: true,
    data: payment
  });
});

// @desc    Confirmar pagamento (webhook)
// @route   POST /api/v1/payments/webhook
// @access  Public
exports.webhookHandler = asyncHandler(async (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Processar o evento
  if (event.type === 'charge.succeeded') {
    const charge = event.data.object;
    
    // Encontrar o pagamento pelo ID da transação
    const payment = await Payment.findOne({ transactionId: charge.id });
    
    if (payment) {
      // Atualizar o status do pagamento
      payment.status = 'completed';
      payment.completedAt = Date.now();
      await payment.save();
      
      // Atualizar o anúncio
      const listing = await Listing.findById(payment.listing);
      
      if (listing) {
        listing.status = 'active';
        listing.payment.paid = true;
        listing.payment.paidAt = Date.now();
        listing.payment.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias
        listing.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias
        await listing.save();
      }
    }
  } else if (event.type === 'charge.failed') {
    const charge = event.data.object;
    
    // Encontrar o pagamento pelo ID da transação
    const payment = await Payment.findOne({ transactionId: charge.id });
    
    if (payment) {
      // Atualizar o status do pagamento
      payment.status = 'failed';
      await payment.save();
    }
  }
  
  res.status(200).json({ received: true });
});

// @desc    Renovar anúncio
// @route   POST /api/v1/payments/renew/:listingId
// @access  Private
exports.renewListing = asyncHandler(async (req, res, next) => {
  const listing = await Listing.findById(req.params.listingId);
  
  if (!listing) {
    return next(
      new ErrorResponse(`Anúncio não encontrado com id ${req.params.listingId}`, 404)
    );
  }
  
  // Verificar se o usuário é o dono do anúncio
  if (listing.seller.toString() !== req.user.id) {
    return next(
      new ErrorResponse('Não autorizado a renovar este anúncio', 401)
    );
  }
  
  // Verificar se o anúncio está expirado ou prestes a expirar
  const now = new Date();
  const expirationDate = new Date(listing.expiresAt);
  const daysUntilExpiration = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiration > 7) {
    return next(
      new ErrorResponse('Anúncio só pode ser renovado quando estiver a 7 dias ou menos da expiração', 400)
    );
  }
  
  // Determinar o valor com base no plano atual
  let amount = 2990; // Plano básico: R$ 29,90
  let featuredType = 'basic';
  
  if (listing.featured && listing.featured.featuredType === 'premium') {
    amount = 4990; // Plano premium: R$ 49,90
    featuredType = 'premium';
  } else if (listing.featured && listing.featured.featuredType === 'spotlight') {
    amount = 7990; // Plano spotlight: R$ 79,90
    featuredType = 'spotlight';
  }
  
  // Criar o pagamento para renovação
  const payment = await Payment.create({
    user: req.user.id,
    listing: req.params.listingId,
    amount,
    paymentMethod: req.body.paymentMethod,
    status: 'pending'
  });
  
  // Processar o pagamento (similar ao createPayment)
  // ...
  
  // Atualizar o anúncio (simulação de pagamento bem-sucedido)
  listing.status = 'active';
  listing.featured = {
    isFeatured: featuredType !== 'basic',
    featuredUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 dias a partir de agora
    featuredType
  };
  listing.payment = {
    paid: true,
    amount,
    transactionId: payment._id,
    paidAt: now,
    expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 dias a partir de agora
    renewalEnabled: false
  };
  listing.expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias a partir de agora
  await listing.save();
  
  // Atualizar o pagamento
  payment.status = 'completed';
  payment.completedAt = now;
  await payment.save();
  
  res.status(200).json({
    success: true,
    data: {
      payment,
      listing
    }
  });
});
