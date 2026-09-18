let datosExcelGlobal = [];
let chartConsumoSemanalInstance = null;
let chartFacturadoInstance = null;
let chartConsumoInstance = null;

// Fallback de datos para Análisis CFE si no encuentra el JSON
const FALLBACK_DATA = [
  { "anio": "2025", "periodo": "MAYO - JUNIO", "consumoBaseKwh": 226118, "consumoIntermedioKwh": 90668, "consumoPuntaKwh": 8795, "demandaBaseKw": 3386, "demandaIntermedioKw": 2476, "demandaPuntaKw": 1924, "demandaMaximaKw": 3386, "factorPotencia": 99.95, "costoPorKw": 3.09, "suministro": 466.83, "distribucion": 50911.28, "transmision": 58897.61, "cenace": 2116.28, "generacionBase": 227904.33, "generacionIntermedia": 163574.14, "generacionPunta": 18845.05, "capacidad": 351662.60, "scnmem": 2018.60, "bonificacionFactorPotencia": -10516.76, "totalFacturado": 1004421.19, "unidadesBYD": 55, "unidadesSunwin": 16 },
  { "anio": "2025", "periodo": "JUNIO - JULIO", "consumoBaseKwh": 262357, "consumoIntermedioKwh": 93990, "consumoPuntaKwh": 988, "demandaBaseKw": 3534, "demandaIntermedioKw": 2857, "demandaPuntaKw": 612, "demandaMaximaKw": 3534, "factorPotencia": 99.93, "costoPorKw": 2.70, "suministro": 466.83, "distribucion": 54053.16, "transmision": 64641.90, "cenace": 2322.68, "generacionBase": 268391.21, "generacionIntermedia": 172114.49, "generacionPunta": 2148.70, "capacidad": 275118.48, "scnmem": 2215.48, "bonificacionFactorPotencia": -10097.68, "totalFacturado": 964395.48, "unidadesBYD": 55, "unidadesSunwin": 16 },
  { "anio": "2026", "periodo": "JULIO - AGOSTO", "consumoBaseKwh": 324343, "consumoIntermedioKwh": 129924, "consumoPuntaKwh": 11396, "demandaBaseKw": 3518, "demandaIntermedioKw": 3163, "demandaPuntaKw": 1393, "demandaMaximaKw": 3518, "factorPotencia": 99.96, "costoPorKw": 2.71, "suministro": 540.49, "distribucion": 66841.18, "transmision": 83865.90, "cenace": 3539.04, "generacionBase": 285194.80, "generacionIntermedia": 204487.38, "generacionPunta": 21301.40, "capacidad": 424631.62, "scnmem": 3213.08, "bonificacionFactorPotencia": -7655.30, "totalFacturado": 1259713.16, "unidadesBYD": 55, "unidadesSunwin": 22 }
];

window.initViewCharts = function(viewName) {
  if (viewName === 'home') {
    initHomeChart();
  } else if (viewName === 'analisis-cfe') {
    initCfeProcess();
  }
};

// --- VISTA HOME ---
function initHomeChart() {
  const ctx = document.getElementById('chartConsumoSemanal');
  if (!ctx || typeof Chart === 'undefined') return;

  if (chartConsumoSemanalInstance) chartConsumoSemanalInstance.destroy();

  chartConsumoSemanalInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
      datasets: [
        { label: 'Diésel', data: [12, 19, 15, 17], backgroundColor: '#10b981', borderRadius: 4 },
        { label: 'Eléctrico', data: [8, 12, 14, 15], backgroundColor: '#06b6d4', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748b' } },
        y: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#64748b' } }
      }
    }
  });
}

// --- VISTA ANÁLISIS CFE ---
async function initCfeProcess() {
  try {
    const res = await fetch('/data/facturas_cfe.json');
    if (res.ok) {
      datosExcelGlobal = await res.json();
    } else {
      datosExcelGlobal = FALLBACK_DATA;
    }
  } catch (err) {
    datosExcelGlobal = FALLBACK_DATA;
  }

  poblarSelectores();
}

function poblarSelectores() {
  const selectAnio = document.getElementById('selectAnio');
  const selectPeriodo = document.getElementById('selectPeriodo');
  if (!selectAnio || !selectPeriodo) return;

  const anios = [...new Set(datosExcelGlobal.map(d => String(d.anio)))];
  selectAnio.innerHTML = anios.map(a => `<option value="${a}">${a}</option>`).join('');

  function actualizarPeriodos() {
    const anioSel = selectAnio.value;
    const registrosAnio = datosExcelGlobal.filter(d => String(d.anio) === anioSel);
    
    selectPeriodo.innerHTML = registrosAnio.map(p => `<option value="${p.periodo}">${p.periodo}</option>`).join('');
    
    if (registrosAnio.length > 0) {
      actualizarVistaFactura(registrosAnio[0]);
    }
  }

  selectAnio.onchange = actualizarPeriodos;
  selectPeriodo.onchange = () => {
    const seleccionado = datosExcelGlobal.find(d => String(d.anio) === selectAnio.value && d.periodo === selectPeriodo.value);
    if (seleccionado) actualizarVistaFactura(seleccionado);
  };

  actualizarPeriodos();
  renderGraficosHistoricos();
}

function actualizarVistaFactura(f) {
  const el = id => document.getElementById(id);
  if (!el('cBase')) return;

  const fmtMoney = v => `$${(v || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtNum = v => (v || 0).toLocaleString('es-MX');

  el('tituloPeriodo').innerText = `COSTE ENERGÍA ELÉCTRICA ${f.periodo} (DESGLOSE)`;

  el('cBase').innerText = fmtNum(f.consumoBaseKwh);
  el('cInter').innerText = fmtNum(f.consumoIntermedioKwh);
  el('cPunta').innerText = fmtNum(f.consumoPuntaKwh);
  
  const consumoTotal = (f.consumoBaseKwh || 0) + (f.consumoIntermedioKwh || 0) + (f.consumoPuntaKwh || 0);
  el('cTotal').innerText = fmtNum(consumoTotal);

  el('dBase').innerText = fmtNum(f.demandaBaseKw);
  el('dInter').innerText = fmtNum(f.demandaIntermedioKw);
  el('dPunta').innerText = fmtNum(f.demandaPuntaKw);
  el('dMax').innerText = fmtNum(f.demandaMaximaKw);

  el('costoKw').innerText = fmtMoney(f.costoPorKw);
  
  let fpVal = f.factorPotencia || 0;
  if (fpVal <= 1) fpVal = fpVal * 100;
  el('factorPotencia').innerText = `${fpVal.toFixed(2)}%`;

  el('uByd').innerText = f.unidadesBYD || 0;
  el('uSunwin').innerText = f.unidadesSunwin || 0;

  el('fSuministro').innerText = fmtMoney(f.suministro);
  el('fDistribucion').innerText = fmtMoney(f.distribucion);
  el('fTransmision').innerText = fmtMoney(f.transmision);
  el('fCenace').innerText = fmtMoney(f.cenace);
  el('fGenBase').innerText = fmtMoney(f.generacionBase);
  el('fGenInter').innerText = fmtMoney(f.generacionIntermedia);
  el('fGenPunta').innerText = fmtMoney(f.generacionPunta);
  el('fCapacidad').innerText = fmtMoney(f.capacidad);
  el('fScnmem').innerText = fmtMoney(f.scnmem);

  const totalEnergia = (f.suministro || 0) + (f.distribucion || 0) + (f.transmision || 0) + (f.cenace || 0) + (f.generacionBase || 0) + (f.generacionIntermedia || 0) + (f.generacionPunta || 0) + (f.capacidad || 0) + (f.scnmem || 0);
  el('fTotalEnergia').innerText = fmtMoney(totalEnergia);

  el('rCargoFijo').innerText = fmtMoney(f.suministro);
  el('rEnergia').innerText = fmtMoney(totalEnergia - (f.suministro || 0));
  el('rBonif').innerText = fmtMoney(f.bonificacionFactorPotencia);
  
  const subtotal = totalEnergia + (f.bonificacionFactorPotencia || 0);
  const iva = subtotal * 0.16;
  el('rSubtotal').innerText = fmtMoney(subtotal);
  el('rIva').innerText = fmtMoney(iva);
  el('rTotal').innerText = fmtMoney(f.totalFacturado || (subtotal + iva));
}

function renderGraficosHistoricos() {
  const ctx1 = document.getElementById('chartHistoricoFacturado');
  const ctx2 = document.getElementById('chartHistoricoConsumo');
  if (!ctx1 || !ctx2 || typeof Chart === 'undefined') return;

  if (chartFacturadoInstance) chartFacturadoInstance.destroy();
  if (chartConsumoInstance) chartConsumoInstance.destroy();

  const labels = datosExcelGlobal.map(d => d.periodo ? d.periodo.split('-')[0].trim() : '');
  const facturado = datosExcelGlobal.map(d => d.totalFacturado || 0);

  chartFacturadoInstance = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{ label: 'Facturado ($)', data: facturado, backgroundColor: '#38bdf8', borderRadius: 4 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
  });

  chartConsumoInstance = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: 'Base', data: datosExcelGlobal.map(d => d.consumoBaseKwh || 0), backgroundColor: '#059669' },
        { label: 'Intermedio', data: datosExcelGlobal.map(d => d.consumoIntermedioKwh || 0), backgroundColor: '#0284c7' },
        { label: 'Punta', data: datosExcelGlobal.map(d => d.consumoPuntaKwh || 0), backgroundColor: '#d97706' }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { x: { stacked: true }, y: { stacked: true } }
    }
  });
}
