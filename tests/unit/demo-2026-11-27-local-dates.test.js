import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let originalTZ;

function clearErpStorage() {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key && key.startsWith('erp.')) localStorage.removeItem(key);
  }
}

beforeEach(clearErpStorage);

afterEach(() => {
  vi.useRealTimers();
  if (originalTZ === undefined) delete process.env.TZ;
  else process.env.TZ = originalTZ;
});

describe('HU6 - fechas locales de la demostración 2026-11-27', () => {
  it('usa el día local de Chile aunque UTC ya sea el día siguiente', async () => {
    originalTZ = process.env.TZ;
    process.env.TZ = 'America/Santiago';
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-27T21:30:00-03:00'));
    vi.resetModules();

    const [{ loadDemoData }, { userConfig }, { loadSaleInvoices }] =
      await Promise.all([
        import('../../src/demo-data.js'),
        import('../../src/module-config.js'),
        import('../../src/storage.js'),
      ]);

    expect(loadDemoData(userConfig).ok).toBe(true);
    expect(new Date().toISOString().slice(0, 10)).toBe('2026-11-28');
    expect(
      loadSaleInvoices().some(
        (document) =>
          document.status === 'Pagada' &&
          String(document.startDate).slice(0, 7) === '2026-11' &&
          document.customFields?.fechaPago === '2026-11-27'
      )
    ).toBe(true);
  });
});
