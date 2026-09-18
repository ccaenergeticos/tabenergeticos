let datosExcelGlobal = [];
let chartFacturadoInstance = null;
let chartConsumoInstance = null;

// Método invocado automáticamente al seleccionar la vista "analisis-cfe"
window.initViewCharts = function(viewName) {
  if (viewName === 'analisis-cfe') {
    // Breve espera para asegurar que el HTML de views/analisis-cfe.html esté renderizado en el DOM
    setTimeout(cargarDatosJSON, 100);
  }
};

async function cargarDatosJSON() {
  try {
    // Carga directa del archivo JSON alojado en tu repositorio de GitHub
    const res = await fetch('/data/facturas_cfe.json');
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    
    datosExcelGlobal = await res.json();

    if (datosExcelGlobal.length > 0) {
      poblarSelectores();
    }
  } catch (err) {
    console.error("Error al cargar data/facturas_cfe.json desde GitHub:", err);
  }
}

function poblarSelectores() {
  const selectAnio = document.getElementById('selectAnio');
  const selectPeriodo = document.getElementById('selectPeriodo');
  if (!selectAnio || !selectPeriodo) return;

  // Llenar Años únicos disponibles
  const anios = [...new Set(datosExcelGlobal.map(d => d.anio))];
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
