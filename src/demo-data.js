import {
  addDocument,
  addEntity,
  loadDocuments,
  loadEntities,
  loadPayrollSettlements,
  loadPurchaseInvoices,
  savePayrollSettlements,
  updateDocument,
} from './storage.js';
import { createAccessRecord, loadAccessRecords } from './access-storage.js';
import { normalizeRut } from './auth.js';
import { userConfig } from './module-config.js';

function addDays(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function calculaDigitoVerificador(dni) {
  let sum = 0;
  let multiplier = 2;
  for (let i = dni.length - 1; i >= 0; i -= 1) {
    sum += Number(dni[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  return remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder);
}

function formatoRut(dni) {
  const body =
    dni.length === 8
      ? `${dni.slice(0, 2)}.${dni.slice(2, 5)}.${dni.slice(5)}`
      : `${dni.slice(0, 1)}.${dni.slice(1, 4)}.${dni.slice(4)}`;
  return `${body}-${calculaDigitoVerificador(dni)}`;
}

function baseFactura(entity, { folio, serie = 'A' }) {
  return {
    entity_id: entity.entity_id,
    series: serie,
    folio,
    currency: 'CLP',
  };
}

function settlementFromDocument(documentId, settlementId, breakdown) {
  const document = loadPurchaseInvoices().find(
    (item) => item.document_id === documentId
  );
  return {
    settlementId,
    documentId,
    entityId: document.entity_id,
    periodo: document.customFields?.periodoLiquidacion || '',
    sueldoBase: breakdown.sueldoBase,
    descuentos: breakdown.descuentos,
    bonos: breakdown.bonos,
    monto: Number(document.totalAmount) || 0,
    estado: document.status,
    fechaPago: document.customFields?.fechaPago || null,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

function isDemoAccessId(accessId) {
  const demoAccess = userConfig.demoAccess;
  const ids = [
    demoAccess.administrador?.accessId,
    demoAccess.finanzas?.accessId,
    ...(demoAccess.trabajadores || []).map((worker) => worker.accessId),
  ];
  return ids.some((id) => id && normalizeRut(id) === normalizeRut(accessId));
}

export function hasStoredRecords() {
  return (
    loadEntities().length > 0 ||
    loadDocuments().length > 0 ||
    loadPayrollSettlements().length > 0 ||
    loadAccessRecords().some((record) => !isDemoAccessId(record.accessId))
  );
}

export function loadDemoData(config) {
  if (hasStoredRecords()) {
    return {
      ok: false,
      reason: 'EXISTS',
      message:
        'El módulo ya contiene datos o registros previos; la carga de demostración requiere un módulo vacío. Se conservaron todos los registros.',
    };
  }
  return buildDemoData(config);
}

function buildDemoData(config) {
  const demoAccess = config?.demoAccess || userConfig.demoAccess;
  const clientes = [
    {
      name: 'Comercial Andina Ltda.',
      code: 'CL-001',
      dni: '12345678',
      tipo: 'cliente',
      custom: { referenciaOtroModulo: 'CRM: cli-0042' },
    },
    {
      name: 'Distribuidora Maino SpA',
      code: 'CL-002',
      dni: '76543210',
      tipo: 'cliente',
      custom: { referenciaOtroModulo: '' },
    },
  ];
  const proveedores = [
    {
      name: 'Proveedores del Sur S.A.',
      code: 'PV-001',
      dni: '77777777',
      tipo: 'proveedor',
      custom: { referenciaOtroModulo: 'Compras: ord-0089' },
    },
  ];
  const personal = [
    {
      name: 'Ana Pérez Soto',
      code: 'PE-001',
      dni: '22222222',
      tipo: 'personal',
      custom: { referenciaOtroModulo: '' },
    },
    {
      name: 'Bruno Soto Vega',
      code: 'PE-002',
      dni: '45000000',
      tipo: 'personal',
      custom: { referenciaOtroModulo: '' },
    },
  ];

  for (const entry of [...clientes, ...proveedores, ...personal]) {
    const customFields = entry.custom || {};
    addEntity({
      name: entry.name,
      code: entry.code,
      taxId: formatoRut(entry.dni),
      customFields: { ...customFields, tipoTercero: entry.tipo },
    });
  }
  const entities = loadEntities();
  const byCode = (prefix) => entities.find((e) => e.code.startsWith(prefix));

  const cl1 = byCode('CL-001');
  const cl2 = byCode('CL-002');
  const pv1 = byCode('PV-001');
  const pe1 = byCode('PE-001');
  const pe2 = byCode('PE-002');

  // Facturas de venta
  const v1 = addDocument({
    ...baseFactura(cl1, { folio: 101 }),
    startDate: addDays(-1),
    endDate: addDays(29),
    totalAmount: 250000,
    customFields: {
      tipoFactura: 'venta',
      referenciaOtroModulo: 'Ventas: pedido PED-033',
    },
  });

  const v2 = addDocument({
    ...baseFactura(cl1, { folio: 102 }),
    startDate: addDays(-2),
    endDate: addDays(13),
    totalAmount: 180000,
    customFields: {
      tipoFactura: 'venta',
      salesOrderId: 'PED-036',
      referenciaOtroModulo: 'Ventas: pedido PED-036',
    },
  });

  const v3 = addDocument({
    ...baseFactura(cl2, { folio: 55 }),
    startDate: addDays(-40),
    endDate: addDays(-6),
    totalAmount: 320000,
    customFields: {
      tipoFactura: 'venta',
      salesOrderId: 'PED-035',
      referenciaOtroModulo: 'Ventas: pedido PED-035',
    },
  });

  const v4 = addDocument({
    ...baseFactura(cl2, { folio: 56 }),
    startDate: addDays(-35),
    endDate: addDays(-5),
    totalAmount: 150000,
    customFields: {
      tipoFactura: 'venta',
      salesOrderId: 'PED-034',
      referenciaOtroModulo: 'Ventas: pedido PED-034',
    },
  });

  const v5 = addDocument({
    ...baseFactura(cl1, { folio: 103 }),
    startDate: addDays(-10),
    endDate: addDays(5),
    totalAmount: 90000,
    customFields: {
      tipoFactura: 'venta',
      referenciaOtroModulo: 'Ventas: pedido PED-037',
    },
  });

  // Facturas de compra
  const c1 = addDocument({
    ...baseFactura(pv1, { folio: 88 }),
    startDate: addDays(-3),
    endDate: addDays(27),
    totalAmount: 420000,
    customFields: {
      tipoFactura: 'compra',
      referenciaOtroModulo: 'Compras: ord-0089',
    },
  });

  const c2 = addDocument({
    ...baseFactura(pe1, { folio: 1, serie: 'LIQ' }),
    startDate: addDays(-15),
    endDate: addDays(15),
    totalAmount: 700000,
    customFields: {
      tipoFactura: 'compra',
      periodoLiquidacion: addDays(-15).slice(0, 7),
      referenciaOtroModulo: 'Remuneraciones: oct-2026',
    },
  });

  const c3 = addDocument({
    ...baseFactura(pv1, { folio: 87 }),
    startDate: addDays(-30),
    endDate: addDays(-2),
    totalAmount: 260000,
    customFields: {
      tipoFactura: 'compra',
      referenciaOtroModulo: 'Compras: ord-0076',
    },
  });

  const c4 = addDocument({
    ...baseFactura(pe2, { folio: 2, serie: 'LIQ' }),
    startDate: addDays(-45),
    endDate: addDays(-10),
    totalAmount: 620000,
    customFields: {
      tipoFactura: 'compra',
      periodoLiquidacion: addDays(-45).slice(0, 7),
      referenciaOtroModulo: 'Remuneraciones: sep-2026',
    },
  });

  const c5 = addDocument({
    ...baseFactura(pe1, { folio: 3, serie: 'LIQ' }),
    startDate: addDays(-50),
    endDate: addDays(-20),
    totalAmount: 650000,
    customFields: {
      tipoFactura: 'compra',
      periodoLiquidacion: addDays(-50).slice(0, 7),
      referenciaOtroModulo: 'Remuneraciones: ago-2026',
    },
  });

  const c6 = addDocument({
    ...baseFactura(pe2, { folio: 4, serie: 'LIQ' }),
    startDate: addDays(-70),
    endDate: addDays(-40),
    totalAmount: 600000,
    customFields: {
      tipoFactura: 'compra',
      periodoLiquidacion: addDays(-70).slice(0, 7),
      referenciaOtroModulo: 'Remuneraciones: jul-2026',
    },
  });

  // Emisiones y pagos vía transiciones del ciclo de vida
  updateDocument(v1.document_id, { status: 'Emitida' });
  updateDocument(v2.document_id, { status: 'Emitida' });
  updateDocument(v3.document_id, { status: 'Emitida' });
  updateDocument(v4.document_id, { status: 'Emitida' });
  updateDocument(v4.document_id, {
    status: 'Pagada',
    customFields: {
      tipoFactura: 'venta',
      salesOrderId: 'PED-034',
      montoPagado: 150000,
      fechaPago: addDays(-1),
      referenciaOtroModulo: 'Ventas: pedido PED-034',
    },
  });
  updateDocument(v1.document_id, {
    status: 'Pagada',
    customFields: {
      tipoFactura: 'venta',
      referenciaOtroModulo: 'Ventas: pedido PED-033',
      montoPagado: 250000,
      fechaPago: addDays(0),
    },
  });

  for (const [factura, centroCosto] of [
    [c1, 'Activo'],
    [c2, 'Consumible'],
    [c3, 'Consumible'],
    [c4, 'Consumible'],
    [c5, 'Consumible'],
    [c6, 'Consumible'],
  ]) {
    updateDocument(factura.document_id, {
      status: 'Emitida',
      customFields: { ...factura.customFields, centroCosto },
    });
  }

  updateDocument(c3.document_id, {
    status: 'Pagada',
    customFields: {
      tipoFactura: 'compra',
      centroCosto: 'Consumible',
      montoPagado: 260000,
      fechaPago: addDays(-1),
      referenciaOtroModulo: 'Compras: ord-0076',
    },
  });

  for (const [factura, fechaPago] of [
    [c2, addDays(-1)],
    [c4, addDays(-10)],
    [c5, addDays(-40)],
    [c6, addDays(-60)],
  ]) {
    updateDocument(factura.document_id, {
      status: 'Pagada',
      customFields: {
        ...factura.customFields,
        centroCosto: 'Consumible',
        montoPagado: factura.totalAmount,
        fechaPago,
      },
    });
  }

  const liquidaciones = [
    settlementFromDocument(c2.document_id, 'set_demo_pe1_latest', {
      sueldoBase: 500000,
      descuentos: 20000,
      bonos: 220000,
    }),
    settlementFromDocument(c5.document_id, 'set_demo_pe1_previous', {
      sueldoBase: 480000,
      descuentos: 15000,
      bonos: 185000,
    }),
    settlementFromDocument(c4.document_id, 'set_demo_pe2_latest', {
      sueldoBase: 450000,
      descuentos: 12000,
      bonos: 182000,
    }),
    settlementFromDocument(c6.document_id, 'set_demo_pe2_previous', {
      sueldoBase: 430000,
      descuentos: 10000,
      bonos: 180000,
    }),
  ];
  savePayrollSettlements(liquidaciones);

  const adminAccess = demoAccess.administrador;
  if (
    adminAccess &&
    !loadAccessRecords().some(
      (item) => item.accessId === normalizeRut(adminAccess.accessId)
    )
  ) {
    createAccessRecord(
      {
        accessId: adminAccess.accessId,
        role: adminAccess.role,
        entityId: null,
        password: adminAccess.password,
      },
      { entities: loadEntities(), records: loadAccessRecords() }
    );
  }
  const financeAccess = demoAccess.finanzas;
  if (
    financeAccess &&
    !loadAccessRecords().some(
      (item) => item.accessId === normalizeRut(financeAccess.accessId)
    )
  ) {
    createAccessRecord(
      {
        accessId: financeAccess.accessId,
        role: financeAccess.role,
        entityId: null,
        password: financeAccess.password,
      },
      { entities: loadEntities(), records: loadAccessRecords() }
    );
  }
  for (const worker of demoAccess.trabajadores || []) {
    const personal = entities.find(
      (entity) => entity.code === worker.personalCode
    );
    if (!personal) continue;
    if (
      loadAccessRecords().some(
        (item) => item.accessId === normalizeRut(worker.accessId)
      )
    )
      continue;
    createAccessRecord(
      {
        accessId: worker.accessId,
        role: 'trabajador',
        entityId: personal.entity_id,
        password: worker.password,
      },
      { entities: loadEntities(), records: loadAccessRecords() }
    );
  }

  return {
    ok: true,
    entidades: [clientes.length, proveedores.length, personal.length],
    records: {
      terceros: loadEntities().length,
      facturas: loadDocuments().length,
      cobradas: [v1, v2, v3, v4, v5],
      compras: [c1, c2, c3, c4, c5, c6],
      liquidaciones,
    },
  };
}
