import { z } from 'zod';

export const createCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Coupon code must be at least 2 characters')
    .max(50, 'Coupon code too long'),
  type: z.enum(['percent', 'flat'], {
    errorMap: () => ({ message: "Type must be either 'percent' or 'flat'" }),
  }),
  value: z.number().int().positive('Coupon value must be a positive number'),
  min_order_amount: z.number().int().min(0).optional().default(0),
  max_discount: z.number().int().positive().nullable().optional(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  usage_limit: z.number().int().positive().nullable().optional(),
  is_active: z.boolean().optional().default(true),
});

export const updateCouponSchema = createCouponSchema.partial();
