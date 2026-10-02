import { z } from 'zod';

const nonEmpty = z.string().trim().min(1);
const category = z.enum(['electronics', 'fashion', 'home', 'books', 'sports', 'beauty']);

export const registerSchema = z.object({
  name: nonEmpty,
  email: z.string().email(),
  password: z.string().min(6),
}).passthrough();

export const loginSchema = z.object({
  email: z.string().email(),
  password: nonEmpty,
}).passthrough();

export const productSchema = z.object({
  name: nonEmpty,
  description: nonEmpty,
  price: z.number().finite().min(0),
  category,
  stock: z.number().int().min(0),
  brand: z.string().optional(),
  image: z.string().url().optional(),
}).passthrough();

export const updateProductSchema = productSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'At least one product field is required' }
);

export const orderSchema = z.object({
  items: z.array(z.object({
    product: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product ID'),
    name: z.string().optional(),
    price: z.number().finite().min(0).optional(),
    quantity: z.number().int().positive(),
  }).passthrough()).min(1),
  shippingAddress: z.object({
    line1: nonEmpty,
    city: nonEmpty,
    state: nonEmpty,
    pincode: nonEmpty,
  }),
  paymentMethod: z.enum(['COD', 'ONLINE']).optional(),
}).passthrough();
