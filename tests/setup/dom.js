import { beforeEach } from 'vitest';

// Node 25+ trae su propio `localStorage` (Web Storage), que queda sin
// funcionar cuando no se le indica un archivo y tapa el de jsdom. Si pasa,
// se usa un almacenamiento en memoria equivalente para las pruebas.
class MemoryStorage {
  #items = new Map();

  get length() {
    return this.#items.size;
  }

  key(index) {
    return Array.from(this.#items.keys())[index] ?? null;
  }

  getItem(key) {
    return this.#items.has(String(key)) ? this.#items.get(String(key)) : null;
  }

  setItem(key, value) {
    this.#items.set(String(key), String(value));
  }

  removeItem(key) {
    this.#items.delete(String(key));
  }

  clear() {
    this.#items.clear();
  }
}

function localStorageWorks() {
  try {
    return typeof globalThis.localStorage?.getItem === 'function';
  } catch {
    return false;
  }
}

if (!localStorageWorks()) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  if (typeof localStorage !== 'undefined') localStorage.clear();
  if (typeof document !== 'undefined') {
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('style');
    document.title = '';
  }
});
