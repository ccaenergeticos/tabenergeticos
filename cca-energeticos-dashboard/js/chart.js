// URL directa para descargar el CSV desde tu Google Drive
const DRIVE_EXCEL_CSV_URL = "https://docs.google.com/spreadsheets/d/1P9lEX2BzIqvlCXeV2CRgrMufqOIvb6V6/edit?usp=sharing&ouid=102792765386144797144&rtpof=true&sd=true/export?format=csv";

let datosExcelGlobal = [];
let chartFacturadoInstance = null;
let chartConsumoInstance = null;

window.initViewCharts = function(viewName) {
  if (viewName === 'analisis-cfe') {
    cargarExcelDesdeDrive();
  }
};

async function cargarExcelDesdeDrive() {
  try {
    const res = await fetch(DRIVE_EXCEL_CSV_URL);
    if (!res.ok) throw new Error("Error respondiendo Drive CSV");
    const csvData = await res.text();
    
    datosExcelGlobal = parsearCSV(csvData);
    poblarSelectores();
  } catch (err) {
    console.error("No se pudo descargar automáticamente de Drive (verifica permisos 'cualquier persona con el enlace'):", err);
  }
}

// Lector de CSV
function parsearCSV(text) {
  const lines = text.split('\n').filter(l => l.trim() !== '');
  if (lines.length < 2) return [];

  const parseVal = v => {
    if (!v) return 0;
    let clean = v.replace(/[\$\,\%\s]/g, '');
    return parseFloat(clean) || 0;
  };

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    // Expresión regular para separar respetando comillas
    const cols = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
    if (!cols || cols.length < 23) continue;

    const c = cols.map(item => item.replace(/^"|"$/g, '').trim());

    rows.push({
      anio: c[0],
      periodo: c[1],
      consumoBaseKwh: parseVal(c[2]),
      consumoIntermedioKwh: parseVal(c[3]),
      consumoPuntaKwh: parseVal(c[4]),
      demandaBaseKw: parseVal(c[5]),
      demandaIntermedioKw: parseVal(c[6]),
      demandaPuntaKw: parseVal(c[7]),
      demandaMaximaKw: parseVal(c[8]),
      factorPotencia: parseVal(c[9]),
      costoPorKw: parseVal(c[10]),
      suministro: parseVal(c[11]),
      distribucion: parseVal(c[12]),
      transmision: parseVal(c[13]),
      cenace: parseVal(c[14]),
      generacionBase: parseVal(c[15]),
      generacionIntermedia: parseVal(c[16]),
      generacionPunta: parseVal(c[17]),
      capacidad: parseVal(c[18]),
      scnmem: parseVal(c[19]),
      bonificacionFactorPotencia: parseVal(c[20]),
      totalFacturado: parseVal(c[21]),
      unidadesBYD: parseVal(c[22]),
      unidadesSunwin: parseVal(c[23])
    });
  }
  return rows;
}

function poblarSelectores() {
  const selectAnio = document.getElementById('selectAnio');
  const selectPeriodo = document.getElementById('selectPeriodo');
  if (!selectAnio || !selectPeriodo) return;

  const anios = [...new Set(datosExcelGlobal.map(d => d.anio))];
  selectAnio.innerHTML = anios.map(a => `<option value="${a}">${a}</option>`).join('');

  function actualizarPeriodos() {
    const anioSel = selectAnio.value;
    const periodos = datosExcelGlobal.filter(d => d.anio === anioSel);
    selectPeriodo.innerHTML = periodos.map(p => `<option value="${p.periodo}">${p.periodo}</option>`).join('');
    
    if (periodos.length > 0) {
      actualizarVistaFactura(periodos[0]);
    }
  }

  selectAnio.onchange = actualizarPeriodos;
  selectPeriodo.onchange = () => {
    const item = datosExcelGlobal.find(d => d.anio === selectAnio.value && d.periodo === selectPeriodo.value);
    if (item) actualizarVistaFactura(item);
  };

  actualizarPeriodos();
  renderGraficosHistoricos();
}

function actualizarVistaFactura(f) {
  const el = id => document.getElementById(id);
  const fmtMoney = v => `$${v.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtNum = v => v.toLocaleString('es-MX');

  el('tituloPeriodo').innerText = `COSTE ENERGÍA ELÉCTRICA ${f.periodo} (DESGLOSE)`;

  el('cBase').innerText = fmtNum(f.consumoBaseKwh);
  el('cInter').innerText = fmtNum(f.consumoIntermedioKwh);
  el('cPunta').innerText = fmtNum(f.consumoPuntaKwh);
  
  const consumoTotal = f.consumoBaseKwh + f.consumoIntermedioKwh + f.consumoPuntaKwh;
  el('cTotal').innerText = fmtNum(consumoTotal);

  el('dBase').innerText = fmtNum(f.demandaBaseKw);
  el('dInter').innerText = fmtNum(f.demandaIntermedioKw);
  el('dPunta').innerText = fmtNum(f.demandaPuntaKw);
  el('dMax').innerText = fmtNum(f.demandaMaximaKw);

  el('costoKw').innerText = fmtMoney(f.costoPorKw);
  el('factorPotencia').innerText = `${f.factorPotencia}%`;

  el('uByd').innerText = f.unidadesBYD;
  el('uSunwin').innerText = f.unidadesSunwin;

  // Desglose CFE
  el('fSuministro').innerText = fmtMoney(f.suministro);
  el('fDistribucion').innerText = fmtMoney(f.distribucion);
  el('fTransmision').innerText = fmtMoney(f.transmision);
  el('fCenace').innerText = fmtMoney(f.cenace);
  el('fGenBase').innerText = fmtMoney(f.generacionBase);
  el('fGenInter').innerText = fmtMoney(f.generacionIntermedia);
  el('fGenPunta').innerText = fmtMoney(f.generacionPunta);
  el('fCapacidad').innerText = fmtMoney(f.capacidad);
  el('fScnmem').innerText = fmtMoney(f.scnmem);

  const totalEnergia = f.suministro + f.distribucion + f.transmision + f.cenace + f.generacionBase + f.generacionIntermedia + f.generacionPunta + f.capacidad + f.scnmem;
  el('fTotalEnergia').innerText = fmtMoney(totalEnergia);

  // Resumen
  el('rCargoFijo').innerText = fmtMoney(f.suministro);
  el('rEnergia').innerText = fmtMoney(totalEnergia - f.suministro);
  el('rBonif').innerText = fmtMoney(f.bonificacionFactorPotencia);
  
  const subtotal = totalEnergia + f.bonificacionFactorPotencia;
  const iva = subtotal * 0.16;
  el('rSubtotal').innerText = fmtMoney(subtotal);
  el('rIva').innerText = fmtMoney(iva);
  el('rTotal').innerText = fmtMoney(f.totalFacturado || (subtotal + iva));
}

function renderGraficosHistoricos() {
  const ctx1 = document.getElementById('chartHistoricoFacturado');
  const ctx2 = document.getElementById('chartHistoricoConsumo');
  if (!ctx1 || !ctx2) return;

  if (chartFacturadoInstance) chartFacturadoInstance.destroy();
  if (chartConsumoInstance) chartConsumoInstance.destroy();

  const labels = datosExcelGlobal.map(d => `${d.periodo.split('-')[0].trim()}`);
  const facturado = datosExcelGlobal.map(d => d.totalFacturado);

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
        { label: 'Base', data: datosExcelGlobal.map(d => d.consumoBaseKwh), backgroundColor: '#059669' },
        { label: 'Intermedio', data: datosExcelGlobal.map(d => d.consumoIntermedioKwh), backgroundColor: '#0284c7' },
        { label: 'Punta', data: datosExcelGlobal.map(d => d.consumoPuntaKwh), backgroundColor: '#d97706' }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { x: { stacked: true }, y: { stacked: true } }
    }
  });
}
