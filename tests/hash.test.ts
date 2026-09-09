import { describe, expect, it } from 'vitest';
import { hashPayload } from '../src/lib/hash';

describe('hashPayload', () => {
  it('is stable when object properties are reordered', () => {
    expect(hashPayload({ orderRef: 'A', nested: { z: 1, a: 2 } }))
      .toBe(hashPayload({ nested: { a: 2, z: 1 }, orderRef: 'A' }));
  });

  it('changes when the payload changes', () => {
    expect(hashPayload({ orderRef: 'A' })).not.toBe(hashPayload({ orderRef: 'B' }));
  });
});
