import Order from '../models/Order.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';

// POST /api/orders
export const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('Order must contain at least one item');
  }

  const reserved = [];
  let order;
  try {
    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        res.status(400);
        throw new Error('Item quantity must be a positive integer');
      }
      const result = await Product.updateOne(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );
      if (result.matchedCount === 0) {
        const product = await Product.findById(item.product);
        res.status(product ? 400 : 404);
        throw new Error(product ? `Not enough stock for ${product.name}` : `Product not found: ${item.product}`);
      }
      reserved.push({ product: item.product, quantity: item.quantity });
    }

    // Order creation can fail after stock was reserved; restore it in that case.
    const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    order = await Order.create({
      user: req.user._id,
      items,
      shippingAddress,
      paymentMethod,
      totalAmount,
    });
  } catch (error) {
    await Promise.all(reserved.map(({ product, quantity }) =>
      Product.updateOne({ _id: product }, { $inc: { stock: quantity } })
    ));
    throw error;
  }

  res.status(201).json(order);
});

// GET /api/orders/mine
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// GET /api/orders/:id
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const isOwner = order.user._id.equals(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not allowed to view this order');
  }
  res.json(order);
});

// GET /api/orders (admin)
export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
  res.json(orders);
});

// PATCH /api/orders/:id/status (admin)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  order.status = req.body.status;
  await order.save();
  res.json(order);
});
