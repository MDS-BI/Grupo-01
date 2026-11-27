import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

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

describe('paleta v1.2.0 - banner de guía', () => {
  it('usa tinte y borde #8eCAe6 con texto #023047 sin acento gris', () => {
    const banner = ruleFor('.guide-banner');
    const shortcut = ruleFor('.guide-banner .guide-shortcut');

    expect(banner).toContain('color: #023047');
    expect(banner).toContain('border: 1px solid #8ecae6');
    expect(banner).toMatch(
      /background:[^;]*color-mix\([^;]*#8ecae6[^;]*#ffffff/
    );
    expect(shortcut).toContain('color: #023047');
    expect(banner + shortcut).not.toContain('var(--accent-color)');
  });
});
