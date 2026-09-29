import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildPrompt } from '../src/retrieval/promptBuilder.js';

describe('Prompt Builder', () => {
  it('should format chunks with bracket numbers and strict grounding rules', () => {
    const question = 'What is the refund window?';
    const chunks = [
      { text: 'Refunds are granted within 14 days of purchase with receipt.' },
      { text: 'Digital goods are non-refundable once downloaded.' }
    ];

    const prompt = buildPrompt(question, chunks);

    assert.ok(prompt.includes('[1] Refunds are granted within 14 days of purchase with receipt.'));
    assert.ok(prompt.includes('[2] Digital goods are non-refundable once downloaded.'));
    assert.ok(prompt.includes('Question: What is the refund window?'));
    assert.ok(prompt.includes('like [1] or [2]'));
    assert.ok(prompt.includes('"I don\'t know."'));
  });

  it('should handle empty chunks array gracefully', () => {
    const prompt = buildPrompt('Test question?', []);
    assert.ok(prompt.includes('Question: Test question?'));
    assert.ok(prompt.includes('Answer:'));
  });
});
