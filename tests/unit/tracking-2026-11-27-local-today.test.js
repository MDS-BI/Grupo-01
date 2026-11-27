import { afterEach, describe, expect, it, vi } from 'vitest';

let originalTZ;

afterEach(() => {
  vi.useRealTimers();
  if (originalTZ === undefined) delete process.env.TZ;
  else process.env.TZ = originalTZ;
});

describe('HU6 - todayISO local 2026-11-27', () => {
  it('considera vencida solo la fecha anterior al día local', async () => {
    originalTZ = process.env.TZ;
    process.env.TZ = 'America/Santiago';
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-27T21:30:00-03:00'));
    vi.resetModules();

    const { todayISO, isOverdue } = await import('../../src/tracking.js');

    expect(new Date().toISOString().slice(0, 10)).toBe('2026-11-28');
    expect(todayISO()).toBe('2026-11-27');
    expect(isOverdue({ status: 'Emitida', endDate: '2026-11-27' })).toBe(false);
    expect(isOverdue({ status: 'Emitida', endDate: '2026-11-26' })).toBe(true);
  });
});
