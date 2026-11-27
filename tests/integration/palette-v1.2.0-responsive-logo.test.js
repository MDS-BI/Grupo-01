import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createShell } from '../../src/components/shell.js';
import { getConfig } from '../../src/module-config.js';
import { loadAppMarkup } from '../setup/domFixture.js';

const css = fs
  .readFileSync(path.resolve(process.cwd(), 'src/styles.css'), 'utf8')
  .toLowerCase();
const blockMatch = css.match(/@media \(max-width: 390px\)\s*\{([\s\S]*?)\n\}/);

function rulesInBlock(block, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Array.from(
    block.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'g')),
    (match) => match[1]
  ).join(' ');
}

beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', {
    value: 390,
    configurable: true,
    writable: true,
  });
  loadAppMarkup();
  localStorage.clear();
  sessionStorage.clear();
});

describe('paleta v1.2.0 - logo a 390 px', () => {
  for (const role of ['administrador', 'finanzas', 'trabajador']) {
    it(`mantiene círculo completo para ${role}`, () => {
      createShell({
        config: getConfig(),
        session: { accessId: 'test', role, entityId: null },
        onNavigate() {},
        onLogout() {},
      });

      expect(document.querySelector('#brand-logo')).toBeTruthy();
      expect(document.querySelector('#brand-logo circle')).toBeTruthy();
    });
  }

  it('define ellipsis en el rol y tamaño fijo del logo dentro de 390 px', () => {
    const block = blockMatch?.[1] ?? '';
    const rightRole = rulesInBlock(block, '.topbar-right');
    const sessionRole = rulesInBlock(block, '.session-role');
    const brandLogo = rulesInBlock(block, '.brand-logo');
    const viewContext = rulesInBlock(block, '.view-context');
    const bannerText = rulesInBlock(block, '.banner-notice-text');
    const bannerCount = rulesInBlock(block, '.banner-notice-count');

    expect(rightRole).toContain('min-width: 0');
    expect(sessionRole).toContain('min-width: 0');
    expect(sessionRole).toContain('overflow: hidden');
    expect(sessionRole).toContain('text-overflow: ellipsis');
    expect(sessionRole).toContain('white-space: nowrap');
    expect(brandLogo).toContain('flex-shrink: 0');
    expect(brandLogo).toContain('width: 40px');
    expect(brandLogo).toContain('height: 40px');
    expect(viewContext).toContain('display: none');
    expect(bannerText).toContain('display: none');
    expect(bannerCount).toContain('display: inline');
  });
});
