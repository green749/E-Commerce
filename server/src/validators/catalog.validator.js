import { z } from 'zod';

export const createProductSchema = z.object({
  category_id: z.string().uuid('Invalid category ID').optional().nullable(),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(255),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .max(280)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().trim().min(5, 'Description must be at least 5 characters'),
  brand: z.string().trim().min(1, 'Brand is required').max(100),
  base_price: z.number().int().min(0, 'Base price cannot be negative'),
  mrp: z.number().int().min(0, 'MRP cannot be negative'),
  image_urls: z.array(z.string().url('Invalid image URL')).optional().default([]),
  is_active: z.boolean().optional().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export const createVariantSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  sku: z.string().trim().min(2, 'SKU must be at least 2 characters').max(100),
  size: z.string().trim().max(50).optional().nullable(),
  color: z.string().trim().max(50).optional().nullable(),
  price: z.number().int().min(0, 'Price cannot be negative'),
  mrp: z.number().int().min(0, 'MRP cannot be negative'),
  quantity_on_hand: z.number().int().min(0).optional().default(10),
  reorder_level: z.number().int().min(0).optional().default(5),
});

export const updateVariantSchema = createVariantSchema.omit({ product_id: true }).partial();

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .max(150)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  parent_id: z.string().uuid('Invalid parent category ID').optional().nullable(),
  image_url: z.string().url('Invalid image URL').optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const adjustInventorySchema = z
  .object({
    quantity_on_hand: z.number().int().min(0, 'Quantity on hand cannot be negative').optional(),
    adjustment: z.number().int().optional(),
    reason: z.string().trim().min(3, 'Adjustment reason must be at least 3 characters'),
  })
  .refine(
    (data) => data.quantity_on_hand !== undefined || data.adjustment !== undefined,
    'Either quantity_on_hand or adjustment must be provided'
  );
