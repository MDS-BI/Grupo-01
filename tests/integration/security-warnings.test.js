import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderAccessAdmin } from '../../src/components/access-admin.js';
import { renderLogin } from '../../src/components/login.js';
import {
  renderPayrollSettlement,
  renderWorkerMarkup,
} from '../../src/components/payroll-worker.js';
import { loadAppMarkup } from '../setup/domFixture.js';

const readme = fs.readFileSync(
  path.resolve(process.cwd(), 'README.md'),
  'utf8'
);

function expectSecurityWarnings(text) {
  const normalized = text.replace(/\s+/g, ' ').toLowerCase();
  expect(normalized).toMatch(/control[^.]{0,80}interfaz/);
  expect(normalized).toMatch(
    /(solo|únicamente)[^.]{0,40}interfaz|restricción[^.]{0,40}interfaz/
  );
  expect(normalized).toMatch(/contraseña inicial/);
  expect(normalized).toMatch(
    /contraseña inicial[^.]{0,100}(inmutable|sin cambio|no se puede cambiar|no se puede modificar|no cambia|fija)|(inmutable|sin cambio|no se puede cambiar|no se puede modificar|no cambia|fija)[^.]{0,100}contraseña inicial/
  );
  expect(normalized).toMatch(/datos reales/);
  expect(normalized).toMatch(
    /(no|nunca)[^.]{0,80}datos reales|datos reales[^.]{0,80}(no|nunca)/
  );
}

describe('US6 - advertencias de seguridad y privacidad', () => {
  beforeEach(() => {
    loadAppMarkup();
  });

  it('login-warning advierte control solo de interfaz, contraseña inicial inmutable y prohibición de datos reales', () => {
    renderLogin(document.getElementById('view-login'));
    expectSecurityWarnings(
      document.getElementById('login-warning').textContent
    );
  });

  it('access-warning advierte control solo de interfaz, contraseña inicial inmutable y prohibición de datos reales', () => {
    renderAccessAdmin(document.getElementById('view-access'));
    expectSecurityWarnings(
      document.getElementById('access-warning').textContent
    );
  });

  it('payroll-worker advierte control solo de interfaz, contraseña inicial inmutable y prohibición de datos reales', () => {
    renderWorkerMarkup();
    renderPayrollSettlement(null, null);
    expectSecurityWarnings(
      document.getElementById('view-payroll-worker').textContent
    );
  });

  it('README.md documenta control solo de interfaz, contraseña inicial inmutable y prohibición de datos reales', () => {
    expectSecurityWarnings(readme);
  });
});
