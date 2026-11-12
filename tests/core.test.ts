import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createMeetingSchema,
  createTaskSchema,
  registerSchema,
} from '../lib/validation.ts';
import { checkRateLimit } from '../lib/rate-limit.ts';
import { generateMeetingIntelligence } from '../lib/ai.ts';

describe('Validation Schemas', () => {
  it('validates meeting creation payload', () => {
    const ok = createMeetingSchema.safeParse({
      title: 'Sprint Planning',
      description: 'Weekly sync',
    });
    assert.equal(ok.success, true);

    const bad = createMeetingSchema.safeParse({ title: '' });
    assert.equal(bad.success, false);
  });

  it('validates user registration payload', () => {
    const ok = registerSchema.safeParse({
      name: 'Alex Rivera',
      email: 'ALEX@EXAMPLE.COM',
      password: 'password123',
    });
    assert.equal(ok.success, true);
    if (ok.success) {
      assert.equal(ok.data.email, 'alex@example.com');
    }
  });

  it('validates task creation defaults', () => {
    const ok = createTaskSchema.safeParse({
      title: 'Deploy to Vercel',
      priority: 'HIGH',
    });
    assert.equal(ok.success, true);
  });
});

describe('Rate Limiter', () => {
  it('blocks requests exceeding the window limit', () => {
    const key = `test-ip-${Date.now()}`;
    const first = checkRateLimit(key, 2, 10_000);
    const second = checkRateLimit(key, 2, 10_000);
    const third = checkRateLimit(key, 2, 10_000);

    assert.equal(first.allowed, true);
    assert.equal(second.allowed, true);
    assert.equal(third.allowed, false);
  });
});

describe('AI Meeting Intelligence', () => {
  it('generates summary and extracts action items', async () => {
    const result = await generateMeetingIntelligence(
      'Alex: We will finalize the WebRTC video room by Friday. Priya: Please prepare the analytics export.'
    );
    assert.ok(result.summary.length > 20);
    assert.ok(result.actionItems.length >= 1);
  });
});
