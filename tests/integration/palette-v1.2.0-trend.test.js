import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { loadDemoData } from '../../src/demo-data.js';
import { getConfig, userConfig } from '../../src/module-config.js';
import { loadAppMarkup, setupFinanzasSession } from '../setup/domFixture.js';

const css = fs
  .readFileSync(path.resolve(process.cwd(), 'src/styles.css'), 'utf8')
  .toLowerCase();
const dashboardSource = fs
  .readFileSync(
    path.resolve(process.cwd(), 'src/components/dashboard.js'),
    'utf8'
  )
  .toLowerCase();

function ruleFor(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Array.from(
    css.matchAll(new RegExp(`${escaped}\\s*(?:,[^}]*)?\\{([^}]*)\\}`, 'g')),
    (match) => match[1]
  ).join(' ');
}

beforeEach(() => {
  loadAppMarkup();
  localStorage.clear();
  sessionStorage.clear();
  setupFinanzasSession();
});

describe('paleta v1.2.0 - gráfico de tendencia', () => {
  it('mantiene SVG accesible, leyenda y seis meses', () => {
    loadDemoData(getConfig());
    initApp(userConfig);

    const trend = document.getElementById('dashboard-trend-section');
    const svg = trend.querySelector('svg[role="img"]');
    expect(svg).not.toBeNull();
    expect(svg.querySelector('title').textContent).toBe(
      'Tendencia de ingresos y gastos de los últimos seis meses'
    );
    expect(svg.querySelector('desc').textContent.toLowerCase()).toContain(
      'ingresos'
    );
    expect(trend.textContent).toContain('Ingresos');
    expect(trend.textContent).toContain('Gastos');
    expect(svg.querySelectorAll('.trend-label')).toHaveLength(6);
    expect(svg.querySelector('.trend-bar--income')).not.toBeNull();
    expect(svg.querySelector('.trend-bar--expense')).not.toBeNull();
  });

  it('usa celeste para ingresos y crítico para gastos sin colores heredados', () => {
    expect(ruleFor('.trend-legend-item--income::before')).toContain('#219ebc');
    expect(ruleFor('.trend-bar--income')).toContain('#219ebc');
    expect(ruleFor('.trend-legend-item--expense::before')).toContain('#a84f00');
    expect(ruleFor('.trend-bar--expense')).toContain('#a84f00');

    const legacyColorPattern = /#1b7f4b|#c62828|\b(?:green|red)\b/i;
    expect(css).not.toMatch(legacyColorPattern);
    expect(dashboardSource).not.toMatch(legacyColorPattern);
  });
});
