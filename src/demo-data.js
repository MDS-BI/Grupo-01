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

function localDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(days) {
  const now = new Date();
  return localDate(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + days)
  );
}

function monthDate(offset, day) {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  const lastDay = new Date(
    first.getFullYear(),
    first.getMonth() + 1,
    0
  ).getDate();
  return localDate(
    new Date(first.getFullYear(), first.getMonth(), Math.min(day, lastDay))
  );
}

function paymentDate(offset, day) {
  const date = monthDate(offset, day);
  return offset === 0 && date > localDate(new Date())
    ? localDate(new Date())
    : date;
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
    {
      name: 'Servicios Cordillera SpA',
      code: 'CL-003',
      dni: '11223344',
      tipo: 'cliente',
      creditLimit: 1000000,
      custom: { referenciaOtroModulo: 'CRM: cli-0117' },
    },
    {
      name: 'Exportadora Costa Azul Ltda.',
      code: 'CL-004',
      dni: '22334455',
      tipo: 'cliente',
      custom: { referenciaOtroModulo: 'CRM: cli-0203' },
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
    {
      name: 'Insumos Pacífico S.A.',
      code: 'PV-002',
      dni: '33445566',
      tipo: 'proveedor',
      custom: { referenciaOtroModulo: 'Compras: ord-0091' },
    },
    {
      name: 'Logística Andina Ltda.',
      code: 'PV-003',
      dni: '44556677',
      tipo: 'proveedor',
      custom: { referenciaOtroModulo: 'Compras: ord-0104' },
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
    {
      name: 'Camila Rojas Fuentes',
      code: 'PE-003',
      dni: '55667788',
      tipo: 'personal',
      custom: { referenciaOtroModulo: '' },
    },
  ];

  for (const entry of [...clientes, ...proveedores, ...personal]) {
    addEntity({
      name: entry.name,
      code: entry.code,
      taxId: formatoRut(entry.dni),
      creditLimit: entry.creditLimit,
      customFields: { ...entry.custom, tipoTercero: entry.tipo },
    });
  }

  const entities = loadEntities();
  const byCode = (code) => entities.find((entity) => entity.code === code);
  const [cl1, cl2, cl3, cl4] = ['CL-001', 'CL-002', 'CL-003', 'CL-004'].map(
    byCode
  );
  const [pv1, pv2, pv3] = ['PV-001', 'PV-002', 'PV-003'].map(byCode);
  const [pe1, pe2, pe3] = ['PE-001', 'PE-002', 'PE-003'].map(byCode);

  const cobradas = [];
  const compras = [];
  const liquidaciones = [];
  let saleFolio = 0;
  let purchaseFolio = 0;
  let payrollFolio = 0;

  function addPaidSale(entity, amount, offset, day, reference) {
    const folio = (saleFolio += 1);
    const customFields = {
      tipoFactura: 'venta',
      salesOrderId: reference,
      referenciaOtroModulo: `Ventas: pedido ${reference}`,
    };
    const payment = paymentDate(offset, day);
    const sale = addDocument({
      ...baseFactura(entity, { folio, serie: 'V' }),
      startDate: monthDate(offset, Math.max(1, day - 2)),
      endDate: monthDate(offset, Math.min(28, day + 5)),
      totalAmount: amount,
      customFields,
    });
    updateDocument(sale.document_id, { status: 'Emitida' });
    updateDocument(sale.document_id, {
      status: 'Pagada',
      customFields: {
        ...customFields,
        montoPagado: amount,
        fechaPago: payment,
      },
    });
    cobradas.push(sale);
  }

  const ventasMensuales = [
    [
      [cl1, 1200000, 4, 'PED-101'],
      [cl2, 1800000, 18, 'PED-102'],
    ],
    [
      [cl2, 1700000, 6, 'PED-103'],
      [cl4, 1500000, 21, 'PED-104'],
    ],
    [
      [cl1, 1400000, 3, 'PED-105'],
      [cl3, 1100000, 14, 'PED-106'],
      [cl2, 900000, 25, 'PED-107'],
    ],
    [
      [cl4, 1800000, 5, 'PED-108'],
      [cl1, 1500000, 20, 'PED-109'],
    ],
    [
      [cl2, 1600000, 7, 'PED-110'],
      [cl4, 1560000, 22, 'PED-111'],
    ],
    [
      [cl1, 1600000, 27, 'PED-112'],
      [cl3, 1320000, 19, 'PED-113'],
      [cl4, 1000000, 9, 'PED-114'],
    ],
  ];
  for (let offset = 5; offset >= 0; offset -= 1) {
    for (const [entity, amount, day, reference] of ventasMensuales[
      5 - offset
    ]) {
      addPaidSale(entity, amount, offset, day, reference);
    }
  }

  function addPaidSupplierPurchase(entity, amount, offset, day, reference) {
    const folio = (purchaseFolio += 1);
    const customFields = {
      tipoFactura: 'compra',
      centroCosto: 'Consumible',
      referenciaOtroModulo: `Compras: ${reference}`,
    };
    const payment = paymentDate(offset, day);
    const purchase = addDocument({
      ...baseFactura(entity, { folio, serie: 'P' }),
      startDate: monthDate(offset, Math.max(1, day - 2)),
      endDate: monthDate(offset, Math.min(28, day + 6)),
      totalAmount: amount,
      customFields,
    });
    updateDocument(purchase.document_id, { status: 'Emitida' });
    updateDocument(purchase.document_id, {
      status: 'Pagada',
      customFields: {
        ...customFields,
        montoPagado: amount,
        fechaPago: payment,
      },
    });
    compras.push(purchase);
  }

  const comprasMensuales = [
    [[pv1, 260000, 10, 'ord-0201']],
    [
      [pv2, 300000, 8, 'ord-0202'],
      [pv1, 140000, 20, 'ord-0203'],
    ],
    [[pv3, 380000, 12, 'ord-0204']],
    [
      [pv1, 330000, 9, 'ord-0205'],
      [pv2, 190000, 21, 'ord-0206'],
    ],
    [[pv3, 310000, 11, 'ord-0207']],
    [[pv2, 420000, 15, 'ord-0208']],
  ];
  for (let offset = 5; offset >= 0; offset -= 1) {
    for (const [entity, amount, day, reference] of comprasMensuales[
      5 - offset
    ]) {
      addPaidSupplierPurchase(entity, amount, offset, day, reference);
    }
  }

  const purchaseAnterior = addDocument({
    ...baseFactura(pv3, { folio: (purchaseFolio += 1), serie: 'P' }),
    startDate: monthDate(1, 25),
    endDate: addDays(10),
    totalAmount: 2000000,
    customFields: {
      tipoFactura: 'compra',
      centroCosto: 'Activo',
      referenciaOtroModulo: 'Compras: ord-0199',
    },
  });
  updateDocument(purchaseAnterior.document_id, { status: 'Emitida' });
  updateDocument(purchaseAnterior.document_id, {
    status: 'Pagada',
    customFields: {
      tipoFactura: 'compra',
      centroCosto: 'Activo',
      montoPagado: 2000000,
      fechaPago: paymentDate(0, 6),
      referenciaOtroModulo: 'Compras: ord-0199',
    },
  });
  compras.push(purchaseAnterior);

  function addPayrollPurchase(worker, amount, offset, day, estado, suffix) {
    const folio = (payrollFolio += 1);
    const periodo = monthDate(offset, 1).slice(0, 7);
    const customFields = {
      tipoFactura: 'compra',
      centroCosto: 'Consumible',
      periodoLiquidacion: periodo,
      referenciaOtroModulo: `Remuneraciones: ${periodo}`,
    };
    const startDate = monthDate(offset, 1);
    const purchase = addDocument({
      ...baseFactura(worker, { folio, serie: 'LIQ' }),
      startDate,
      endDate: estado === 'Pagada' ? monthDate(offset, 28) : addDays(10),
      totalAmount: amount,
      customFields,
    });
    updateDocument(purchase.document_id, {
      status: 'Emitida',
      customFields,
    });
    if (estado === 'Pagada') {
      updateDocument(purchase.document_id, {
        status: 'Pagada',
        customFields: {
          ...customFields,
          montoPagado: amount,
          fechaPago: paymentDate(offset, day),
        },
      });
    }
    compras.push(purchase);
    liquidaciones.push(
      settlementFromDocument(
        purchase.document_id,
        `set_demo_${suffix}_${periodo}`,
        {
          sueldoBase: Math.round(amount * 0.7),
          descuentos: Math.round(amount * 0.05),
          bonos: amount - Math.round(amount * 0.7) + Math.round(amount * 0.05),
        }
      )
    );
  }

  for (let offset = 5; offset >= 1; offset -= 1) {
    addPayrollPurchase(pe1, 700000, offset, 12, 'Pagada', 'pe1');
    addPayrollPurchase(pe2, 730000, offset, 16, 'Pagada', 'pe2');
  }
  addPayrollPurchase(pe1, 700000, 0, 12, 'Emitida', 'pe1_vigente');
  addPayrollPurchase(pe2, 730000, 0, 16, 'Emitida', 'pe2_vigente');

  const draftPeriodo = localDate(new Date()).slice(0, 7);
  const draftPurchase = addDocument({
    ...baseFactura(pe3, { folio: (payrollFolio += 1), serie: 'LIQ' }),
    startDate: monthDate(0, 1),
    endDate: addDays(10),
    totalAmount: 760000,
    customFields: {
      tipoFactura: 'compra',
      centroCosto: 'Consumible',
      periodoLiquidacion: draftPeriodo,
      referenciaOtroModulo: `Remuneraciones: ${draftPeriodo}`,
    },
  });
  compras.push(draftPurchase);
  liquidaciones.push(
    settlementFromDocument(
      draftPurchase.document_id,
      `set_demo_pe3_borrador_${draftPeriodo}`,
      { sueldoBase: 532000, descuentos: 38000, bonos: 266000 }
    )
  );

  const vencidas = [
    {
      entity: cl2,
      folio: 9001,
      startDate: monthDate(1, 3),
      endDate: addDays(-3),
      totalAmount: 320000,
      reference: 'PED-201',
    },
    {
      entity: cl2,
      folio: 9002,
      startDate: monthDate(1, 10),
      endDate: addDays(-1),
      totalAmount: 150000,
      reference: 'PED-202',
    },
  ];
  for (const entry of vencidas) {
    const customFields = {
      tipoFactura: 'venta',
      salesOrderId: entry.reference,
      referenciaOtroModulo: `Ventas: pedido ${entry.reference}`,
    };
    const sale = addDocument({
      ...baseFactura(entry.entity, { folio: entry.folio, serie: 'V' }),
      startDate: entry.startDate,
      endDate: entry.endDate,
      totalAmount: entry.totalAmount,
      customFields,
    });
    updateDocument(sale.document_id, { status: 'Emitida' });
  }

  const porVencerCustom = {
    tipoFactura: 'venta',
    salesOrderId: 'PED-203',
    referenciaOtroModulo: 'Ventas: pedido PED-203',
  };
  const porVencer = addDocument({
    ...baseFactura(cl1, { folio: 9003, serie: 'V' }),
    startDate: monthDate(0, 1),
    endDate: addDays(5),
    totalAmount: 200000,
    customFields: porVencerCustom,
  });
  updateDocument(porVencer.document_id, { status: 'Emitida' });

  const limiteCustom = {
    tipoFactura: 'venta',
    salesOrderId: 'PED-204',
    referenciaOtroModulo: 'Ventas: pedido PED-204',
  };
  const limiteEmitida = addDocument({
    ...baseFactura(cl3, { folio: 9004, serie: 'V' }),
    startDate: monthDate(1, 20),
    endDate: addDays(10),
    totalAmount: 900000,
    customFields: limiteCustom,
  });
  updateDocument(limiteEmitida.document_id, { status: 'Emitida' });
  addDocument({
    ...baseFactura(cl3, { folio: 9005, serie: 'V' }),
    startDate: monthDate(0, 2),
    endDate: addDays(10),
    totalAmount: 200000,
    customFields: {
      tipoFactura: 'venta',
      salesOrderId: 'PED-205',
      referenciaOtroModulo: 'Ventas: pedido PED-205',
    },
  });

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
    const personalWorker = entities.find(
      (entity) => entity.code === worker.personalCode
    );
    if (!personalWorker) continue;
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
        entityId: personalWorker.entity_id,
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
      cobradas,
      compras,
      liquidaciones,
    },
  };
}
