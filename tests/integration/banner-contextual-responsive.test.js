import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { userConfig } from '../../src/module-config.js';
import { addDocument, addEntity, updateDocument } from '../../src/storage.js';
import { loadAppMarkup, setupFinanzasSession } from '../setup/domFixture.js';

const byId = (id) => document.getElementById(id);
const css = fs
  .readFileSync(path.resolve(process.cwd(), 'src/styles.css'), 'utf8')
  .toLowerCase();

function ruleFor(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Array.from(
    css.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'g')),
    (match) => match[1]
  ).join(' ');
}

function seedOverdue() {
  const provider = addEntity(
    {
      name: 'Proveedor Responsive',
      code: 'PV-RS',
      customFields: { tipoTercero: 'proveedor' },
    },
    userConfig
  );
  const document = addDocument(
    {
      entity_id: provider.entity_id,
      series: 'P',
      folio: 1,
      startDate: '2026-01-10',
      endDate: '2026-02-10',
      totalAmount: 500,
      customFields: { tipoFactura: 'compra', centroCosto: 'Consumible' },
    },
    userConfig
  );
  updateDocument(
    document.document_id,
    {
      status: 'Emitida',
      customFields: { tipoFactura: 'compra', centroCosto: 'Consumible' },
    },
    userConfig
  );
}

describe('Banner contextual - colores y 390 px', () => {
  beforeEach(() => {
    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('usa fondo #FFB703 y texto #023047 en el aviso de acción', () => {
    const notice = ruleFor('.banner-notice');
    expect(notice).toContain('background-color: #ffb703');
    expect(notice).toContain('color: #023047');
    expect(css).toMatch(/\.banner-notice-count\s*\{[^}]*display:\s*none/);
  });

  it('oculta el nombre de vista y el texto del aviso a 390 px sin perder el nombre accesible', () => {
    const mediaBlockMatch = css.match(
      /@media \(max-width:\s*390px\)\s*\{([\s\S]*?)\n\}/
    );
    const mediaBlock = mediaBlockMatch?.[1] ?? '';

    expect(mediaBlock).toMatch(/\.view-context\s*\{[^}]*display:\s*none/);
    expect(mediaBlock).toMatch(/\.banner-notice-text\s*\{[^}]*display:\s*none/);
    expect(mediaBlock).toMatch(
      /\.banner-notice-count\s*\{[^}]*display:\s*(inline|inline-flex|block)/
    );

    setupFinanzasSession();
    seedOverdue();
    window.innerWidth = 390;
    initApp(userConfig);

    byId('nav-invoice-purchase').click();

    expect(byId('view-context-name').textContent).toBe('Facturas de compra');
    expect(byId('banner-notice-count').textContent.trim()).toBe('1');
    expect(byId('banner-notice-text').textContent.trim()).toBe(
      '1 factura vencida'
    );
    expect(byId('banner-notice').getAttribute('aria-label')).toBe(
      '1 factura vencida'
    );
  });
});
