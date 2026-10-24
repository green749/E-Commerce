import { z } from 'zod';

const VALID_EVENT_TYPES = [
  'page_view',
  'search',
  'product_view',
  'add_to_cart',
  'remove_from_cart',
  'begin_checkout',
  'purchase',
];

export const singleEventSchema = z
  .object({
    event_type: z.enum(VALID_EVENT_TYPES).optional(),
    eventType: z.enum(VALID_EVENT_TYPES).optional(),
    session_id: z.string().max(100).optional(),
    sessionId: z.string().max(100).optional(),
    user_id: z.string().uuid().nullable().optional(),
    userId: z.string().uuid().nullable().optional(),
    device_type: z.string().max(50).optional(),
    deviceType: z.string().max(50).optional(),
    page_url: z.string().max(2048).optional(),
    pageUrl: z.string().max(2048).optional(),
    properties: z.record(z.any()).optional().default({}),
    occurred_at: z.union([z.string(), z.date()]).optional(),
    occurredAt: z.union([z.string(), z.date()]).optional(),
  })
  .refine((data) => data.event_type || data.eventType, {
    message: `event_type (or eventType) is required and must be one of: ${VALID_EVENT_TYPES.join(', ')}`,
    path: ['event_type'],
  });

export const eventsPayloadSchema = z.union([
  // Array of events (batched directly): [ {...}, {...} ]
  z.array(singleEventSchema).min(1).max(100),
  // Object with events key: { events: [ {...}, {...} ] }
  z.object({
    events: z.array(singleEventSchema).min(1).max(100),
  }),
  // Single event object: { event_type: '...' }
  singleEventSchema,
]);

export default {
  eventsPayloadSchema,
  singleEventSchema,
};
