import { z } from 'zod';

export const startCheckoutSchema = z.object({
  address_id: z.string().uuid('Invalid address ID'),
  shipping_option: z.enum(['standard', 'express']).optional().default('standard'),
});

export const verifyPaymentSchema = z
  .object({
    order_id: z.string().uuid('Invalid order ID').optional().nullable(),
    order_number: z.string().trim().optional().nullable(),
    razorpay_order_id: z.string().trim().min(1, 'razorpay_order_id is required'),
    razorpay_payment_id: z.string().trim().min(1, 'razorpay_payment_id is required'),
    razorpay_signature: z.string().trim().min(1, 'razorpay_signature is required'),
  })
  .refine(
    (data) => data.order_id || data.order_number,
    'Either order_id or order_number must be provided'
  );

export const cancelOrderSchema = z.object({
  reason: z.string().trim().max(500).optional().default('Cancelled by customer'),
});

export const requestReturnSchema = z.object({
  order_item_id: z.string().uuid('Invalid order item ID'),
  reason: z.string().trim().min(5, 'Return reason must be at least 5 characters').max(1000),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['packed', 'shipped', 'delivered'], {
    errorMap: () => ({ message: 'Status must be one of: packed, shipped, delivered' }),
  }),
  note: z.string().trim().max(500).optional().nullable(),
});

export const handleReturnActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'refund'], {
    errorMap: () => ({ message: 'Action must be one of: approve, reject, refund' }),
  }),
  reason: z.string().trim().max(500).optional().nullable(),
});
