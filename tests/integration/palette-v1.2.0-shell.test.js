import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createShell } from '../../src/components/shell.js';
import { getConfig } from '../../src/module-config.js';
import { loadAppMarkup } from '../setup/domFixture.js';

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

const ROLES = [
  { role: 'administrador', roleLabel: 'Recursos Humanos', initials: 'R' },
  { role: 'finanzas', roleLabel: 'Finanzas', initials: 'F' },
  { role: 'trabajador', roleLabel: 'Trabajador', initials: 'T' },
];

beforeEach(() => {
  loadAppMarkup();
  localStorage.clear();
  sessionStorage.clear();
});

describe('paleta v1.2.0 - barra superior', () => {
  for (const { role, roleLabel, initials } of ROLES) {
    it(`mantiene marca, rol e iniciales de ${role} con los colores v1.2.0`, () => {
      createShell({
        config: getConfig(),
        session: { accessId: 'test', role, entityId: null },
        onNavigate() {},
        onLogout() {},
      });

      expect(document.getElementById('brand-name').textContent).toBe(
        getConfig().moduleName
      );
      expect(document.getElementById('brand-name').textContent).not.toContain(
        '›'
      );
      expect(document.getElementById('view-context').hidden).toBe(true);
      expect(document.getElementById('session-role').textContent).toBe(
        `Rol: ${roleLabel}`
      );
      const circle = document.querySelector('#brand-logo circle');
      const logoText = document.querySelector('#brand-logo text');
      expect((circle.getAttribute('style') || '').toLowerCase()).toContain(
        '#ffb703'
      );
      expect(logoText.getAttribute('fill')).toBe('#023047');
      expect(logoText.textContent).toBe(initials);
    });
  }

  it('aplica navy a la barra y celeste claro a la etiqueta de rol', () => {
    expect(ruleFor('.topbar')).toContain('#023047');
    expect(ruleFor('.topbar')).toContain('#ffffff');
    expect(ruleFor('.session-role')).toContain('#8ecae6');
    expect(ruleFor('.session-role')).toContain('#023047');
  });
});
