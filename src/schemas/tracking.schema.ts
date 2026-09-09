import { z } from 'zod';

/** Public tracking uses a high-entropy opaque token. */
export const trackingTokenParamSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{40,128}$/)
}).strict();
