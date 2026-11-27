import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const css = fs
  .readFileSync(path.resolve(process.cwd(), 'src/styles.css'), 'utf8')
  .toLowerCase();

function luminance(hex) {
  const channels = [1, 3, 5]
    .map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground, background) {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

describe('paleta v1.2.0 - contraste WCAG', () => {
  const textPairs = [
    ['#ffffff', '#023047'],
    ['#023047', '#8ecae6'],
    ['#023047', '#ffb703'],
    ['#126782', '#ffffff'],
    ['#a84f00', '#ffffff'],
  ];

  for (const [foreground, background] of textPairs) {
    it(`da al menos 4.5:1 para ${foreground} sobre ${background}`, () => {
      expect(css).toContain(foreground);
      expect(css).toContain(background);
      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
    });
  }

  it('da al menos 3:1 para gráficos y bordes con #219EBC y #A84F00', () => {
    expect(contrast('#219ebc', '#ffffff')).toBeGreaterThanOrEqual(3);
    expect(contrast('#a84f00', '#ffffff')).toBeGreaterThanOrEqual(3);
    expect(css).toContain('#fb8500');
  });
});
