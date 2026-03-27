import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from './crypto.js';

describe('encrypt/decrypt', () => {
  it('roundtrips a simple string', () => {
    const original = 'sk-ant-test-key-12345';
    const encrypted = encrypt(original);
    expect(encrypted).not.toBe(original);
    expect(encrypted).toContain(':'); // IV:ciphertext format
    expect(decrypt(encrypted)).toBe(original);
  });

  it('produces different ciphertext each time (random IV)', () => {
    const text = 'same-input';
    const a = encrypt(text);
    const b = encrypt(text);
    expect(a).not.toBe(b); // Different IVs
    expect(decrypt(a)).toBe(text);
    expect(decrypt(b)).toBe(text);
  });

  it('handles empty string', () => {
    const encrypted = encrypt('');
    expect(decrypt(encrypted)).toBe('');
  });

  it('handles long strings', () => {
    const long = 'a'.repeat(10000);
    expect(decrypt(encrypt(long))).toBe(long);
  });

  it('handles unicode', () => {
    const unicode = 'Hello \u4e16\u754c \ud83c\udf0d';
    expect(decrypt(encrypt(unicode))).toBe(unicode);
  });
});
