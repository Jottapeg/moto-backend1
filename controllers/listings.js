const Listing = require('../models/Listing');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const cloudinary = require('../utils/cloudinary');

// @desc    Criar um novo anúncio
// @route   POST /api/v1/listings
// @access  Private
exports.createListing = asyncHandler(async (req, res, next) => {
  // Adicionar usuário ao corpo da requisição
  req.body.seller = req.user.id;
  
  // Verificar se o usuário tem permissão para criar anúncios
  const user = await User.findById(req.user.id);
  
  if (user.userType === 'buyer') {
    return next(
      new ErrorResponse('Usuários do tipo comprador não podem criar anúncios', 403)
    );
  }
  
  // Verificar se o usuário tem email e telefone verificados
  if (!user.verifications.emailVerified || !user.verifications.phoneVerified) {
    return next(
      new ErrorResponse('É necessário verificar email e telefone antes de criar anúncios', 403)
    );
  }
  
  // Processar imagens se existirem
  if (req.files && req.files.length > 0) {
    const images = [];
    
    for (let i = 0; i < req.files.length; i++) {
      const result = await cloudinary.uploader.upload(req.files[i].path, {
        folder: 'moto_marketplace/listings',
        use_filename: true
      });
      
      images.push({
        url: result.secure_url,
        order: i,
        isMain: i === 0 // A primeira imagem é a principal
      });
    }
    
    req.body.images = images;
  }
  
  const listing = await Listing.create(req.body);
  
  res.status(201).json({
    success: true,
    data: listing
  });
});

// @desc    Obter todos os anúncios
// @route   GET /api/v1/listings
// @access  Public
exports.getListings = asyncHandler(async (req, res, next) => {
  // Filtros avançados
  const queryObj = { ...req.query };
  
  // Campos a serem excluídos da filtragem
  const excludeFields = ['select', 'sort', 'page', 'limit'];
  excludeFields.forEach(field => delete queryObj[field]);
  
  // Filtros para campos específicos
  if (queryObj.brand) {
    queryObj['motorcycle.brand'] = queryObj.brand;
    delete queryObj.brand;
  }
  
  if (queryObj.model) {
    queryObj['motorcycle.model'] = queryObj.model;
    delete queryObj.model;
  }
  
  if (queryObj.year) {
    queryObj['motorcycle.year'] = queryObj.year;
    delete queryObj.year;
  }
  
  if (queryObj.type) {
    queryObj['motorcycle.type'] = queryObj.type;
    delete queryObj.type;
  }
  
  if (queryObj.condition) {
    queryObj['motorcycle.condition'] = queryObj.condition;
    delete queryObj.condition;
  }
  
  if (queryObj.city) {
    queryObj['location.city'] = queryObj.city;
    delete queryObj.city;
  }
  
  if (queryObj.state) {
    queryObj['location.state'] = queryObj.state;
    delete queryObj.state;
  }
  
  // Filtros de faixa de preço
  if (queryObj.minPrice || queryObj.maxPrice) {
    queryObj.price = {};
    
    if (queryObj.minPrice) {
      queryObj.price.$gte = Number(queryObj.minPrice);
      delete queryObj.minPrice;
    }
    
    if (queryObj.maxPrice) {
      queryObj.price.$lte = Number(queryObj.maxPrice);
      delete queryObj.maxPrice;
    }
  }
  
  // Filtros de faixa de quilometragem
  if (queryObj.minMileage || queryObj.maxMileage) {
    queryObj['motorcycle.mileage'] = {};
    
    if (queryObj.minMileage) {
      queryObj['motorcycle.mileage'].$gte = Number(queryObj.minMileage);
      delete queryObj.minMileage;
    }
    
    if (queryObj.maxMileage) {
      queryObj['motorcycle.mileage'].$lte = Number(queryObj.maxMileage);
      delete queryObj.maxMileage;
    }
  }
  
  // Filtros de faixa de ano
  if (queryObj.minYear || queryObj.maxYear) {
    queryObj['motorcycle.year'] = {};
    
    if (queryObj.minYear) {
      queryObj['motorcycle.year'].$gte = Number(queryObj.minYear);
      delete queryObj.minYear;
    }
    
    if (queryObj.maxYear) {
      queryObj['motorcycle.year'].$lte = Number(queryObj.maxYear);
      delete queryObj.maxYear;
    }
  }
  
  // Filtrar apenas anúncios ativos por padrão
  if (!queryObj.status) {
    queryObj.status = 'active';
  }
  
  // Criar string de consulta
  let queryStr = JSON.stringify(queryObj);
  
  // Criar operadores ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
  
  // Encontrar anúncios
  let query = Listing.find(JSON.parse(queryStr)).populate({
    path: 'seller',
    select: 'name profilePicture rating'
  });
  
  // Selecionar campos específicos
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }
  
  // Ordenação
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    // Ordenação padrão: anúncios em destaque primeiro, depois os mais recentes
    query = query.sort('-featured.isFeatured -createdAt');
  }
  
  // Paginação
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Listing.countDocuments(JSON.parse(queryStr));
  
  query = query.skip(startIndex).limit(limit);
  
  // Executar consulta
  const listings = await query;
  
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
    count: listings.length,
    pagination,
    data: listings
  });
});

// @desc    Obter um anúncio específico
// @route   GET /api/v1/listings/:id
// @access  Public
exports.getListing = asyncHandler(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id).populate({
    path: 'seller',
    select: 'name profilePicture rating'
  });
  
  if (!listing) {
    return next(
      new ErrorResponse(`Anúncio não encontrado com id ${req.params.id}`, 404)
    );
  }
  
  // Incrementar contador de visualizações
  listing.statistics.views += 1;
  listing.statistics.lastViewed = Date.now();
  await listing.save();
  
  res.status(200).json({
    success: true,
    data: listing
  });
});

// @desc    Atualizar um anúncio
// @route   PUT /api/v1/listings/:id
// @access  Private
exports.updateListing = asyncHandler(async (req, res, next) => {
  let listing = await Listing.findById(req.params.id);
  
  if (!listing) {
    return next(
      new ErrorResponse(`Anúncio não encontrado com id ${req.params.id}`, 404)
    );
  }
  
  // Verificar se o usuário é o dono do anúncio
  if (listing.seller.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`Usuário não autorizado a atualizar este anúncio`, 401)
    );
  }
  
  // Processar novas imagens se existirem
  if (req.files && req.files.length > 0) {
    const images = [];
    
    // Manter imagens existentes
    if (listing.images && listing.images.length > 0) {
      images.push(...listing.images);
    }
    
    // Adicionar novas imagens
    for (let i = 0; i < req.files.length; i++) {
      const result = await cloudinary.uploader.upload(req.files[i].path, {
        folder: 'moto_marketplace/listings',
        use_filename: true
      });
      
      images.push({
        url: result.secure_url,
        order: images.length,
        isMain: images.length === 0 // A primeira imagem é a principal
      });
    }
    
    req.body.images = images;
  }
  
  // Atualizar anúncio
  listing = await Listing.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: listing
  });
});

// @desc    Excluir um anúncio
// @route   DELETE /api/v1/listings/:id
// @access  Private
exports.deleteListing = asyncHandler(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  
  if (!listing) {
    return next(
      new ErrorResponse(`Anúncio não encontrado com id ${req.params.id}`, 404)
    );
  }
  
  // Verificar se o usuário é o dono do anúncio
  if (listing.seller.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`Usuário não autorizado a excluir este anúncio`, 401)
    );
  }
  
  await listing.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Adicionar anúncio aos favoritos
// @route   PUT /api/v1/listings/:id/favorite
// @access  Private
exports.favoriteListing = asyncHandler(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  
  if (!listing) {
    return next(
      new ErrorResponse(`Anúncio não encontrado com id ${req.params.id}`, 404)
    );
  }
  
  const user = await User.findById(req.user.id);
  
  // Verificar se o anúncio já está nos favoritos
  if (user.favorites.includes(req.params.id)) {
    return next(
      new ErrorResponse(`Anúncio já está nos favoritos`, 400)
    );
  }
  
  // Adicionar aos favoritos
  user.favorites.push(req.params.id);
  await user.save();
  
  // Incrementar contador de favoritos no anúncio
  listing.statistics.favorites += 1;
  await listing.save();
  
  res.status(200).json({
    success: true,
    data: user.favorites
  });
});

// @desc    Remover anúncio dos favoritos
// @route   PUT /api/v1/listings/:id/unfavorite
// @access  Private
exports.unfavoriteListing = asyncHandler(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  
  if (!listing) {
    return next(
      new ErrorResponse(`Anúncio não encontrado com id ${req.params.id}`, 404)
    );
  }
  
  const user = await User.findById(req.user.id);
  
  // Verificar se o anúncio está nos favoritos
  if (!user.favorites.includes(req.params.id)) {
    return next(
      new ErrorResponse(`Anúncio não está nos favoritos`, 400)
    );
  }
  
  // Remover dos favoritos
  user.favorites = user.favorites.filter(
    id => id.toString() !== req.params.id
  );
  await user.save();
  
  // Decrementar contador de favoritos no anúncio
  if (listing.statistics.favorites > 0) {
    listing.statistics.favorites -= 1;
    await listing.save();
  }
  
  res.status(200).json({
    success: true,
    data: user.favorites
  });
});

// @desc    Marcar anúncio como vendido
// @route   PUT /api/v1/listings/:id/sold
// @access  Private
exports.markAsSold = asyncHandler(async (req, res, next) => {
  let listing = await Listing.findById(req.params.id);
  
  if (!listing) {
    return next(
      new ErrorResponse(`Anúncio não encontrado com id ${req.params.id}`, 404)
    );
  }
  
  // Verificar se o usuário é o dono do anúncio
  if (listing.seller.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`Usuário não autorizado a marcar este anúncio como vendido`, 401)
    );
  }
  
  // Atualizar status para vendido
  listing = await Listing.findByIdAndUpdate(
    req.params.id,
    { status: 'sold' },
    { new: true }
  );
  
  res.status(200).json({
    success: true,
    data: listing
  });
});
