import {
  clearDevNotifications,
  loadDevNotifications,
} from '../access-storage.js';

const SECURITY_WARNING =
  'Estos avisos son locales y ayudan a detectar incidencias de acceso. No contienen datos reales y el control de acceso es solo de interfaz.';

const REASON_LABELS = {
  INVALID_RUT: 'RUT inválido',
  INACTIVE: 'Acceso inactivo',
  DUPLICATE: 'RUT duplicado',
  BROKEN_ENTITY_LINK: 'Vínculo roto',
  NOT_FOUND: 'RUT no registrado',
};

export function initDevNotifications() {
  const root = document.getElementById('view-dev-notifications');
  if (!root) return null;

  function render() {
    const notifications = loadDevNotifications();
    root.innerHTML = `
      <h1 id="dev-notifications-title">Avisos para el desarrollador</h1>
      <p class="dev-notifications-warning">${SECURITY_WARNING}</p>
      <div id="dev-notifications-list" class="dev-notifications-list"></div>
      <button type="button" id="dev-notifications-clear">Limpiar avisos</button>
    `;
    const list = document.getElementById('dev-notifications-list');
    if (notifications.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No hay avisos registrados.';
      list.append(empty);
    } else {
      const table = document.createElement('table');
      table.className = 'invoice-table';
      table.innerHTML =
        '<thead><tr><th>Fecha</th><th>RUT</th><th>Rol</th><th>Motivo</th><th>Origen</th></tr></thead><tbody></tbody>';
      const tbody = table.querySelector('tbody');
      for (const notification of notifications) {
        const row = document.createElement('tr');
        const values = [
          notification.timestamp || '',
          notification.accessId || '',
          notification.role || '',
          REASON_LABELS[notification.reason] || notification.reason || '',
          notification.origin || '',
        ];
        for (const value of values) {
          const cell = document.createElement('td');
          cell.textContent = value;
          row.append(cell);
        }
        tbody.append(row);
      }
      list.append(table);
    }

    const clearButton = document.getElementById('dev-notifications-clear');
    clearButton.onclick = () => {
      const confirmed =
        typeof window !== 'undefined' && typeof window.confirm === 'function'
          ? window.confirm('¿Limpiar todos los avisos para el desarrollador?')
          : true;
      if (!confirmed) return;
      clearDevNotifications();
      render();
    };
  }

  render();
  return { render };
}
