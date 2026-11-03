import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { DEFAULT_CONFIG } from '../../src/module-config.js';
import { loadAppMarkup, submit } from '../setup/domFixture.js';

beforeEach(() => {
  loadAppMarkup();
});

describe('US1 - validación de entidad', () => {
  it('asocia los errores a los campos y mantiene el foco accesible', () => {
    initApp(DEFAULT_CONFIG);
    submit('entity-form');

    const nameError = document.getElementById('error-name');
    const codeError = document.getElementById('error-code');
    expect(nameError.textContent).toMatch(/obligatorio/i);
    expect(codeError.textContent).toMatch(/obligatorio/i);
    expect(document.getElementById('name').getAttribute('aria-invalid')).toBe(
      'true'
    );
  });
});
