import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const css = fs.readFileSync(
  path.resolve(process.cwd(), 'src/styles.css'),
  'utf8'
);
const config = fs.readFileSync(
  path.resolve(process.cwd(), 'src/module-config.js'),
  'utf8'
);
const shell = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/shell.js'),
  'utf8'
);

describe('paleta v1.2.0 - color heredado', () => {
  it('elimina #0f62fe de estilos, configuración y shell', () => {
    for (const source of [css, config, shell]) {
      expect(source.toLowerCase()).not.toContain('#0f62fe');
    }
  });

  it('declara los colores de la constitución v1.2.0', () => {
    const normalized = css.toLowerCase();
    for (const color of [
      '#023047',
      '#219ebc',
      '#8ecae6',
      '#ffb703',
      '#fb8500',
      '#126782',
      '#a84f00',
    ]) {
      expect(normalized).toContain(color);
    }
  });
});
