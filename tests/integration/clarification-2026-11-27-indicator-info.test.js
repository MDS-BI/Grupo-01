import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { FINANCE_INDICATORS } from '../../src/finance.js';
import { DEFAULT_CONFIG } from '../../src/module-config.js';
import { loadAppMarkup, setupFinanzasSession } from '../setup/domFixture.js';

function readSource(relativePath) {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

function ruleFor(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Array.from(
    css.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'g')),
    (match) => match[1]
  ).join(' ');
}

describe('Clarificación 2026-11-27 - ícono de información de los indicadores', () => {
  beforeEach(() => {
    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
    setupFinanzasSession();
  });

  it('no usa el carácter de texto ⓘ en index.html ni en dashboard.js', () => {
    expect(readSource('index.html')).not.toContain('ⓘ');
    expect(readSource('src/components/dashboard.js')).not.toContain('ⓘ');
  });

  it('dibuja un círculo CSS de 16 px con la letra i y mantiene la fórmula accesible', () => {
    initApp(DEFAULT_CONFIG);

    for (const indicator of FINANCE_INDICATORS) {
      const info = document.querySelector(
        `[data-formula-for="${indicator.id}"]`
      );
      expect(info).not.toBeNull();
      expect(info.textContent.trim()).toBe('i');
      expect(info.getAttribute('role')).toBe('img');
      expect(info.getAttribute('aria-label')).toBe(
        `Fórmula: ${indicator.formula}`
      );
      expect(info.title).toBe(indicator.formula);
      expect(info.tabIndex).toBe(0);
    }
  });

  it('define el círculo, el tinte base y el cambio de fondo en hover y foco', () => {
    const css = readSource('src/styles.css').toLowerCase();
    const base = ruleFor(css, '.indicator-info');
    const hover = ruleFor(css, '.indicator-info:hover');
    const focus =
      ruleFor(css, '.indicator-info:focus') +
      ruleFor(css, '.indicator-info:focus-visible');

    expect(base).toContain('width: 16px');
    expect(base).toContain('height: 16px');
    expect(base).toContain('box-sizing: border-box');
    expect(base).toContain('border: 1px solid #8ecae6');
    expect(base).toContain(
      'background-color: color-mix(in srgb, #8ecae6 18%, #ffffff)'
    );
    expect(base).toContain('color: #023047');
    expect(base).toContain('font-family: var(--font-sans)');
    expect(base).toContain('font-weight: 600');
    expect(base).toContain('display: inline-flex');
    expect(base).toContain('align-items: center');
    expect(base).toContain('justify-content: center');
    expect(base).toContain('vertical-align: middle');
    expect(hover).toContain('background-color: #8ecae6');
    expect(focus).toContain('background-color: #8ecae6');
  });
});
