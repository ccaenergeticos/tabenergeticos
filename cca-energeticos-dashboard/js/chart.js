let datosExcelGlobal = [];
let chartFacturadoInstance = null;
let chartConsumoInstance = null;

window.initViewCharts = function(viewName) {
  if (viewName === 'analisis-cfe') {
    cargarDatosJSON();
  }
};

async function cargarDatosJSON() {
  try {
    // Si ya los descargamos previamente, no volvemos a llamar al servidor
    if (datosExcelGlobal.length === 0) {
      const res = await fetch('/data/facturas_cfe.json');
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      datosExcelGlobal = await res.json();
    }

    intentarPoblar(0);
  } catch (err) {
    console.error("Error al cargar /data/facturas_cfe.json:", err);
  }
}

// Verifica que el HTML ya exista en el DOM antes de pintar datos
function intentarPoblar(intentos) {
  const selectAnio = document.getElementById('selectAnio');
  const selectPeriodo = document.getElementById('selectPeriodo');

  if (selectAnio && selectPeriodo) {
    poblarSelectores();
  } else if (intentos < 10) {
    setTimeout(() => intentarPoblar(intentos + 1), 100);
  }
}

function poblarSelectores() {
  const selectAnio = document.getElementById('selectAnio');
  const selectPeriodo = document.getElementById('selectPeriodo');

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

  // Consumos y Demandas
  el('cBase').innerText = fmtNum(f.consumoBaseKwh);
  el('cInter').innerText = fmtNum(f.consumoIntermedioKwh);
  el('cPunta').innerText = fmtNum(f.consumoPuntaKwh);
  
  const consumoTotal = (f.consumoBaseKwh || 0) + (f.consumoIntermedioKwh || 0) + (f.consumoPuntaKwh || 0);
  el('cTotal').innerText = fmtNum(consumoTotal);

  el('dBase').innerText = fmtNum(f.demandaBaseKw);
  el('dInter').innerText = fmtNum(f.demandaIntermedioKw);
  el('dPunta').innerText = fmtNum(f.demandaPuntaKw);
  el('dMax').innerText = fmtNum(f.demandaMaximaKw);

  // Indicadores
  el('costoKw').innerText = fmtMoney(f.costoPorKw);
  
  // Manejo del Factor de Potencia (si viene como decimal ej. 0.9995 o porcentaje ej. 99.95)
  let fpVal = f.factorPotencia || 0;
  if (fpVal <= 1) fpVal = fpVal * 100;
  el('factorPotencia').innerText = `${fpVal.toFixed(2)}%`;

  el('uByd').innerText = f.unidadesBYD || 0;
  el('uSunwin').innerText = f.unidadesSunwin || 0;

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

  const totalEnergia = (f.suministro || 0) + (f.distribucion || 0) + (f.transmision || 0) + (f.cenace || 0) + (f.generacionBase || 0) + (f.generacionIntermedia || 0) + (f.generacionPunta || 0) + (f.capacidad || 0) + (f.scnmem || 0);
  el('fTotalEnergia').innerText = fmtMoney(totalEnergia);

  // Resumen
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
  if (!ctx1 || !ctx2) return;

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
