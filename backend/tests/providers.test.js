import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { withRetry } from '../src/services/providers/retry.js';

describe('Provider Abstraction & Retry Logic', () => {
  it('should succeed on first attempt if no error occurs', async () => {
    let callCount = 0;
    const result = await withRetry(async () => {
      callCount++;
      return { success: true };
    }, 'TestProvider', 3, 10);

    assert.equal(callCount, 1);
    assert.deepEqual(result, { success: true });
  });

  it('should retry up to 3 times on failure and succeed if subsequent attempt works', async () => {
    let attempts = 0;
    const result = await withRetry(async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary network glitch');
      }
      return { data: 'recovered' };
    }, 'OpenAI', 3, 10);

    assert.equal(attempts, 3);
    assert.deepEqual(result, { data: 'recovered' });
  });

  it('should throw clear error with provider name after exhausting 3 attempts', async () => {
    let attempts = 0;
    await assert.rejects(
      async () => {
        await withRetry(async () => {
          attempts++;
          throw new Error('Rate limit exceeded');
        }, 'Gemini', 3, 10);
      },
      (err) => {
        assert.equal(attempts, 3);
        assert.ok(err.message.includes('[Gemini]'));
        assert.ok(err.message.includes('after 3 attempts'));
        assert.ok(err.message.includes('Rate limit exceeded'));
        assert.equal(err.statusCode, 502);
        return true;
      }
    );
  });
});
