// URL pública de exportación en formato CSV de tu Google Sheet
const GOOGLE_SHEET_ID = "1P9lEX2BzIqvlCXeV2CRgrMufqOIvb6V6";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv`;

let datosExcelGlobal = [];
let chartFacturadoInstance = null;
let chartConsumoInstance = null;

window.initViewCharts = function(viewName) {
  if (viewName === 'analisis-cfe') {
    cargarDatosDesdeGoogleSheets();
  }
};

async function cargarDatosDesdeGoogleSheets() {
  try {
    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error("No se pudo obtener respuesta del CSV de Google Sheets");
    
    const csvData = await res.text();
    datosExcelGlobal = procesarCSVGoogleSheets(csvData);

    if (datosExcelGlobal.length === 0) {
      console.warn("No se encontraron filas válidas en el Excel.");
      return;
    }

    poblarSelectores();
  } catch (err) {
    console.error("Error al cargar desde Google Sheets:", err);
  }
}

// Lector de CSV robusto para Google Sheets (maneja comillas y comas internas)
function procesarCSVGoogleSheets(text) {
  const lineas = text.split(/\r\n|\n/);
  const resultado = [];

  // Función para limpiar celdas (quita comillas de más y símbolos numéricos)
  const parseVal = (val) => {
    if (!val) return 0;
    let clean = val.replace(/"/g, '').replace(/[\$\,\%\s]/g, '');
    return parseFloat(clean) || 0;
  };

  const cleanText = (val) => (val ? val.replace(/"/g, '').trim() : '');

  // Omitimos la primera fila (Encabezados)
  for (let i = 1; i < lineas.length; i++) {
    const linea = lineas[i].trim();
    if (!linea) continue;

    // Regexp para parsear campos CSV delimitados por comas respetando comillas
    const columnas = linea.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || linea.split(',');
    
    if (columnas.length >= 23) {
      resultado.push({
        anio: cleanText(columnas[0]),
        periodo: cleanText(columnas[1]),
        consumoBaseKwh: parseVal(columnas[2]),
        consumoIntermedioKwh: parseVal(columnas[3]),
        consumoPuntaKwh: parseVal(columnas[4]),
        demandaBaseKw: parseVal(columnas[5]),
        demandaIntermedioKw: parseVal(columnas[6]),
        demandaPuntaKw: parseVal(columnas[7]),
        demandaMaximaKw: parseVal(columnas[8]),
        factorPotencia: parseVal(columnas[9]),
        costoPorKw: parseVal(columnas[10]),
        suministro: parseVal(columnas[11]),
        distribucion: parseVal(columnas[12]),
        transmision: parseVal(columnas[13]),
        cenace: parseVal(columnas[14]),
        generacionBase: parseVal(columnas[15]),
        generacionIntermedia: parseVal(columnas[16]),
        generacionPunta: parseVal(columnas[17]),
        capacidad: parseVal(columnas[18]),
        scnmem: parseVal(columnas[19]),
        bonificacionFactorPotencia: parseVal(columnas[20]),
        totalFacturado: parseVal(columnas[21]),
        unidadesBYD: parseVal(columnas[22]),
        unidadesSunwin: parseVal(columnas[23])
      });
    }
  }
  return resultado;
}

function poblarSelectores() {
  const selectAnio = document.getElementById('selectAnio');
  const selectPeriodo = document.getElementById('selectPeriodo');
  if (!selectAnio || !selectPeriodo) return;

  // Extraer Años únicos
  const anios = [...new Set(datosExcelGlobal.map(d => d.anio))].filter(a => a !== "");
  selectAnio.innerHTML = anios.map(a => `<option value="${a}">${a}</option>`).join('');

  function actualizarPeriodos() {
    const anioSel = selectAnio.value;
    const registrosAnio = datosExcelGlobal.filter(d => d.anio === anioSel);
    
    selectPeriodo.innerHTML = registrosAnio.map(p => `<option value="${p.periodo}">${p.periodo}</option>`).join('');
    
    if (registrosAnio.length > 0) {
      actualizarVistaFactura(registrosAnio[0]);
    }
  }

  selectAnio.onchange = actualizarPeriodos;
  selectPeriodo.onchange = () => {
    const seleccionado = datosExcelGlobal.find(d => d.anio === selectAnio.value && d.periodo === selectPeriodo.value);
    if (seleccionado) actualizarVistaFactura(seleccionado);
  };

  // Carga inicial
  actualizarPeriodos();
  renderGraficosHistoricos();
}

function actualizarVistaFactura(f) {
  const el = id => document.getElementById(id);
  if (!el('cBase')) return;

  const fmtMoney = v => `$${v.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtNum = v => v.toLocaleString('es-MX');

  el('tituloPeriodo').innerText = `COSTE ENERGÍA ELÉCTRICA ${f.periodo} (DESGLOSE)`;

  // Consumos y Demandas
  el('cBase').innerText = fmtNum(f.consumoBaseKwh);
  el('cInter').innerText = fmtNum(f.consumoIntermedioKwh);
  el('cPunta').innerText = fmtNum(f.consumoPuntaKwh);
  
  const consumoTotal = f.consumoBaseKwh + f.consumoIntermedioKwh + f.consumoPuntaKwh;
  el('cTotal').innerText = fmtNum(consumoTotal);

  el('dBase').innerText = fmtNum(f.demandaBaseKw);
  el('dInter').innerText = fmtNum(f.demandaIntermedioKw);
  el('dPunta').innerText = fmtNum(f.demandaPuntaKw);
  el('dMax').innerText = fmtNum(f.demandaMaximaKw);

  // Indicadores
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

  // Resumen Pago
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

  const labels = datosExcelGlobal.map(d => d.periodo.split('-')[0].trim());
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
