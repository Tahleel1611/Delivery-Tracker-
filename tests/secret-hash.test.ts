import { describe, expect, it } from 'vitest';
import { hashSecret, hashPassword, verifyPassword } from '../src/lib/secret-hash';

describe('secret hashing', () => {
  it('uses a stable fixed-length lookup hash', () => {
    expect(hashSecret('opaque-token')).toMatch(/^[a-f0-9]{64}$/);
    expect(hashSecret('opaque-token')).toBe(hashSecret('opaque-token'));
    expect(hashSecret('opaque-token')).not.toBe(hashSecret('another-token'));
  });

  it('verifies password hashes without retaining a plaintext password', async () => {
    const stored = await hashPassword('correct-horse-battery-staple');
    expect(stored).not.toContain('correct-horse-battery-staple');
    await expect(verifyPassword('correct-horse-battery-staple', stored)).resolves.toBe(true);
    await expect(verifyPassword('incorrect-password', stored)).resolves.toBe(false);
  });
});
