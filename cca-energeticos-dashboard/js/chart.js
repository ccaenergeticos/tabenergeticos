// URL de Google Sheets exportado como CSV desde Google Drive
const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/1P9lEX2BzIqvlCXeV2CRgrMufqOIvb6V6/export?format=csv";

window.initViewCharts = function(viewName) {
  if (viewName === 'analisis-cfe') {
    cargarDatosCfe();
  }
};

async function cargarDatosCfe() {
  try {
    const res = await fetch(GOOGLE_SHEETS_CSV_URL);
    if (!res.ok) throw new Error("No se pudo descargar la hoja de Google Drive");
    
    const csvText = await res.text();
    procesarDatosExcel(csvText);
  } catch (err) {
    console.warn("Cargando datos estáticos de demostración:", err.message);
    // Datos por defecto si el enlace a Drive es privado o falla la conexión
    renderInterfazCfe({
      consumoBase: 45200, consumoInter: 38100, consumoPunta: 12400,
      demandaBase: 210, demandaInter: 195, demandaPunta: 180,
      byd: 18, sunwin: 20,
      suministro: 1250.00, distribucion: 15400.00, transmision: 8900.00, cenace: 450.00, capacidad: 22100.00,
      cargoFijo: 1250.00, bonif: -2100.00, iva: 18400.00, total: 133400.00
    });
  }
}

function renderInterfazCfe(d) {
  // Renderizar valores en DOM
  const el = id => document.getElementById(id);
  if (!el('cBase')) return;

  el('cBase').innerText = d.consumoBase.toLocaleString();
  el('cInter').innerText = d.consumoInter.toLocaleString();
  el('cPunta').innerText = d.consumoPunta.toLocaleString();
  el('cTotal').innerText = (d.consumoBase + d.consumoInter + d.consumoPunta).toLocaleString();

  el('dBase').innerText = d.demandaBase;
  el('dInter').innerText = d.demandaInter;
  el('dPunta').innerText = d.demandaPunta;
  el('dMax').innerText = Math.max(d.demandaBase, d.demandaInter, d.demandaPunta);

  el('uByd').innerText = d.byd;
  el('uSunwin').innerText = d.sunwin;

  const fmt = v => `$${v.toLocaleString('es-MX', {minimumFractionDigits: 2})}`;
  el('fSuministro').innerText = fmt(d.suministro);
  el('fDistribucion').innerText = fmt(d.distribucion);
  el('fTransmision').innerText = fmt(d.transmision);
  el('fCenace').innerText = fmt(d.cenace);
  el('fCapacidad').innerText = fmt(d.capacidad);
  
  const totalEnergia = d.suministro + d.distribucion + d.transmision + d.cenace + d.capacidad;
  el('fTotalEnergia').innerText = fmt(totalEnergia);

  el('rCargoFijo').innerText = fmt(d.cargoFijo);
  el('rEnergia').innerText = fmt(totalEnergia);
  el('rBonif').innerText = fmt(d.bonif);
  
  const subtotal = d.cargoFijo + totalEnergia + d.bonif;
  el('rSubtotal').innerText = fmt(subtotal);
  el('rIva').innerText = fmt(d.iva);
  el('rTotal').innerText = fmt(subtotal + d.iva);

  // Inicializar Gráficos Históricos
  renderGraficosHistoricos();
}

function renderGraficosHistoricos() {
  const ctxFacturado = document.getElementById('chartHistoricoFacturado');
  const ctxConsumo = document.getElementById('chartHistoricoConsumo');
  if (!ctxFacturado || !ctxConsumo) return;

  const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];

  new Chart(ctxFacturado, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{ label: 'Total $', data: [120000, 135000, 128000, 142000, 133400, 139000], backgroundColor: '#38bdf8', borderRadius: 4 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
  });

  new Chart(ctxConsumo, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: 'Base', data: [40000, 42000, 41000, 43000, 45200, 44000], backgroundColor: '#059669' },
        { label: 'Intermedio', data: [35000, 36000, 34000, 37000, 38100, 36500], backgroundColor: '#0284c7' },
        { label: 'Punta', data: [10000, 11000, 10500, 12000, 12400, 11800], backgroundColor: '#d97706' }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { x: { stacked: true }, y: { stacked: true } }
    }
  });
}
