import { z } from 'zod';

export const createAddressSchema = z.object({
  full_name: z.string().trim().min(2, 'Full name must be at least 2 characters').max(255),
  phone: z.string().trim().min(10, 'Phone number must be at least 10 digits').max(20),
  line1: z.string().trim().min(3, 'Address line 1 must be at least 3 characters'),
  line2: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().min(2, 'City must be at least 2 characters').max(100),
  state: z.string().trim().min(2, 'State must be at least 2 characters').max(100),
  pincode: z.string().trim().min(4, 'Pincode must be at least 4 characters').max(20),
  is_default: z.boolean().optional().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();
