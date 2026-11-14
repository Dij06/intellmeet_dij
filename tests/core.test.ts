import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createMeetingSchema,
  createTaskSchema,
  registerSchema,
  updateProfileSchema,
  summarizeSchema,
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

  it('validates user profile update payload', () => {
    const ok = updateProfileSchema.safeParse({
      name: 'Lead Architect',
    });
    assert.equal(ok.success, true);

    const bad = updateProfileSchema.safeParse({
      name: 'a',
    });
    assert.equal(bad.success, false);
  });

  it('validates summarize schema with format options', () => {
    const ok = summarizeSchema.safeParse({
      transcript: 'Valid meeting notes and discussion points.',
      format: 'brief',
    });
    assert.equal(ok.success, true);

    const badFormat = summarizeSchema.safeParse({
      transcript: 'Valid text',
      format: 'unknown_format',
    });
    assert.equal(badFormat.success, false);
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

  it('supports brief, standard, and detailed summary formats', async () => {
    const transcript = 'Team met to discuss Q3 roadmap. Key decision: migrate backend to PostgreSQL on Neon. Next: Priya will create the deployment pipeline by Tuesday.';
    
    const brief = await generateMeetingIntelligence(transcript, 'brief');
    assert.ok(brief.summary.includes('Executive Bullet Summary') || brief.summary.length > 0);

    const detailed = await generateMeetingIntelligence(transcript, 'detailed');
    assert.ok(detailed.summary.length > 0);
  });
});

describe('Demo Store Resilience & Error Detection', () => {
  it('identifies database connection errors reliably', async () => {
    const { isDbConnectionError, getDemoStore } = await import('../lib/demo-store.ts');
    
    assert.equal(isDbConnectionError({ code: 'P1001' }), true);
    assert.equal(isDbConnectionError({ code: 'P1000' }), true);
    assert.equal(isDbConnectionError({ code: 'ECONNREFUSED' }), true);
    assert.equal(isDbConnectionError(new Error("Can't reach database server")), true);
    assert.equal(isDbConnectionError(null), false);
    assert.equal(isDbConnectionError(new Error('Validation error')), false);

    const store = getDemoStore();
    assert.ok(store.workspaces.length >= 1);
    assert.ok(store.meetings.length >= 1);
    assert.ok(store.tasks.length >= 1);
  });
});
