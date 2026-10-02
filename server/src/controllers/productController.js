import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/products?search=&category=&minPrice=&maxPrice=&sort=&page=&limit=
export const getProducts = asyncHandler(async (req, res) => {
  const { search, category, minPrice, maxPrice, sort } = req.query;
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 12);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ message: 'page must be positive and limit must be between 1 and 100' });
  }
  const filter = {};

  if (search) filter.$text = { $search: search };
  if (category) filter.category = category;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const sortMap = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    newest: { createdAt: -1 },
    rating: { rating: -1 },
  };

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort({ ...(sortMap[sort] || { createdAt: -1 }), _id: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  res.json({ products, page, totalPages: Math.max(1, Math.ceil(total / limit)), total });
});

// GET /api/products/:id
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json(product);
});

// POST /api/products (admin)
export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(product);
});

// PUT /api/products/:id (admin)
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json(product);
});

// DELETE /api/products/:id (admin)
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ message: 'Product deleted' });
});
