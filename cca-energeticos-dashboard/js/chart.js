// URL de descarga directa en formato Excel de tu archivo de Google Drive
const EXCEL_DRIVE_URL = "https://docs.google.com/spreadsheets/d/1P9lEX2BzIqvlCXeV2CRgrMufqOIvb6V6/export?format=xlsx";

let datosExcelGlobal = [];
let chartFacturadoInstance = null;
let chartConsumoInstance = null;

// Cargar script de SheetJS dinámicamente si no existe
function cargarLibreriaXLSX(callback) {
  if (window.XLSX) {
    callback();
    return;
  }
  const script = document.createElement('script');
  script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
  script.onload = callback;
  document.head.appendChild(script);
}

window.initViewCharts = function(viewName) {
  if (viewName === 'analisis-cfe') {
    cargarLibreriaXLSX(() => {
      // Esperar brevemente a que el DOM inyecte los elementos HTML de views/analisis-cfe.html
      setTimeout(cargarDatosDesdeExcelDrive, 150);
    });
  }
};

async function cargarDatosDesdeExcelDrive() {
  try {
    const response = await fetch(EXCEL_DRIVE_URL);
    if (!response.ok) throw new Error("No se pudo descargar el archivo Excel de Drive");

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Obtener la primera hoja de cálculo
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convertir hoja a JSON de objetos
    const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
    
    procesarFilasExcel(jsonRows);
  } catch (err) {
    console.error("Error al leer el archivo Excel de Google Drive:", err);
  }
}

function procesarFilasExcel(rows) {
  datosExcelGlobal = [];

  const parseNum = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    let str = String(val).replace(/[^0-9.-]/g, '');
    return parseFloat(str) || 0;
  };

  rows.forEach(r => {
    // Buscar propiedades sin importar espacios o mayúsculas
    const getCol = (keyName) => {
      const match = Object.keys(r).find(k => k.trim().toLowerCase() === keyName.toLowerCase());
      return match ? r[match] : "";
    };

    const anio = String(getCol("Año") || getCol("Anio")).trim();
    const periodo = String(getCol("Periodo")).trim();

    if (anio && periodo) {
      datosExcelGlobal.push({
        anio: anio,
        periodo: periodo,
        consumoBaseKwh: parseNum(getCol("ConsumoBaseKwh")),
        consumoIntermedioKwh: parseNum(getCol("ConsumoIntermedioKwh")),
        consumoPuntaKwh: parseNum(getCol("ConsumoPuntaKwh")),
        demandaBaseKw: parseNum(getCol("DemandaBaseKw")),
        demandaIntermedioKw: parseNum(getCol("DemandaIntermedioKw")),
        demandaPuntaKw: parseNum(getCol("DemandaPuntaKw")),
        demandaMaximaKw: parseNum(getCol("DemandaMaximaKw")),
        factorPotencia: parseNum(getCol("FactorPotencia")),
        costoPorKw: parseNum(getCol("CostoPorKw")),
        suministro: parseNum(getCol("Suministro")),
        distribucion: parseNum(getCol("Distribucion")),
        transmision: parseNum(getCol("Transmision")),
        cenace: parseNum(getCol("Cenace")),
        generacionBase: parseNum(getCol("GeneracionBase")),
        generacionIntermedia: parseNum(getCol("GeneracionIntermedia")),
        generacionPunta: parseNum(getCol("GeneracionPunta")),
        capacidad: parseNum(getCol("Capacidad")),
        scnmem: parseNum(getCol("Scnmem")),
        bonificacionFactorPotencia: parseNum(getCol("BonificacionFactorPotencia")),
        totalFacturado: parseNum(getCol("TotalFacturado")),
        unidadesBYD: parseNum(getCol("UnidadesBYD")),
        unidadesSunwin: parseNum(getCol("UnidadesSunwin"))
      });
    }
  });

  if (datosExcelGlobal.length > 0) {
    poblarSelectores();
  }
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

  // Indicadores Técnicos
  el('costoKw').innerText = fmtMoney(f.costoPorKw);
  el('factorPotencia').innerText = `${(f.factorPotencia > 1 ? f.factorPotencia : f.factorPotencia * 100).toFixed(2)}%`;

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

  // Resumen de Pago
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
