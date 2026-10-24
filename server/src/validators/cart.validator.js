import { z } from 'zod';

export const addToCartSchema = z.object({
  variant_id: z.string().uuid('Invalid variant ID'),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(10, 'Cannot add more than 10 units per item')
    .default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(10, 'Quantity cannot exceed 10 units per item'),
});

export const applyCouponSchema = z.object({
  code: z.string().trim().min(1, 'Coupon code cannot be empty'),
});

export const addToWishlistSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
});
