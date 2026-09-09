import { describe, expect, it } from 'vitest';
import { dispatchWebhookSchema } from '../src/schemas/webhook.schema';

describe('dispatchWebhookSchema', () => {
  it('accepts the assumed legacy dispatch contract', () => {
    const result = dispatchWebhookSchema.parse({
      orderRef: 'ORD-1001',
      customerPhone: '+919999999999',
      deliveryAddress: '1 Market Street'
    });

    expect(result.status).toBe('READY_FOR_DISPATCH');
  });

  it('rejects unknown fields', () => {
    expect(() => dispatchWebhookSchema.parse({
      orderRef: 'ORD-1001',
      customerPhone: '+919999999999',
      deliveryAddress: '1 Market Street',
      products: []
    })).toThrow();
  });
});
