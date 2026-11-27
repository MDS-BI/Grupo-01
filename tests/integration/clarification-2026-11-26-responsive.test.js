import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { saveAccessRecords } from '../../src/access-storage.js';
import { initApp } from '../../src/app.js';
import { getConfig } from '../../src/module-config.js';
import { saveSession } from '../../src/session.js';
import { addEntity } from '../../src/storage.js';
import {
  loadAppMarkup,
  setupAdminSession,
  setupFinanzasSession,
} from '../setup/domFixture.js';

const config = getConfig();
const css = fs.readFileSync(
  path.resolve(process.cwd(), 'src/styles.css'),
  'utf8'
);
const blockMatch = css.match(
  /@media \(max-width:\s*390px\)\s*\{([\s\S]*?)\n\}/
);

function expectNoWideTopbar() {
  const topbar = document.querySelector('.topbar');
  expect(topbar).toBeTruthy();
  for (const element of [topbar, ...topbar.querySelectorAll('*')]) {
    for (const property of ['width', 'minWidth']) {
      const declared = element.style[property];
      if (declared.endsWith('px')) {
        expect(parseFloat(declared)).toBeLessThanOrEqual(390);
      }
    }
  }
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

describe('Clarificación 2026-11-26 - ancho de 390 px', () => {
  it('define reglas dedicadas sin desbordar la página', () => {
    expect(blockMatch).not.toBeNull();
    const block = blockMatch?.[1] ?? '';

    expect(block).toMatch(/body[\s\S]*overflow-x:\s*hidden/);
    expect(block).toMatch(/#app[\s\S]*overflow-x:\s*hidden/);
    expect(block).toMatch(
      /\.topbar-left,\s*\.topbar-right[\s\S]*min-width:\s*0/
    );
    expect(block).toMatch(/\.brand-logo[\s\S]*max-width:\s*100%/);
    expect(block).toMatch(/\.invoice-table-scroll[\s\S]*overflow-x:\s*auto/);
  });

  it('mantiene la barra superior dentro de 390 px para los tres roles', () => {
    for (const setup of [setupAdminSession, setupFinanzasSession]) {
      loadAppMarkup();
      localStorage.clear();
      sessionStorage.clear();
      setup();
      initApp(config);
      expectNoWideTopbar();
    }

    loadAppMarkup();
    localStorage.clear();
    sessionStorage.clear();
    const now = new Date().toISOString();
    const worker = addEntity(
      {
        name: 'Ana Pérez',
        code: 'PE-R',
        customFields: { tipoTercero: 'personal' },
      },
      config
    );
    saveAccessRecords([
      {
        accessId: '12345678-5',
        role: 'trabajador',
        entityId: worker.entity_id,
        password: '1234',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    saveSession({
      accessId: '12345678-5',
      role: 'trabajador',
      entityId: worker.entity_id,
      startedAt: now,
    });
    initApp(config);
    expectNoWideTopbar();
  });
});
