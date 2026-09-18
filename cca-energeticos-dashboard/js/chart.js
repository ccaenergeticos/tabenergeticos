window.initViewCharts = function(viewName) {
  // Inicialización de gráficos para vista HOME
  if (viewName === 'home') {
    const ctx = document.getElementById('chartConsumoSemanal');
    if (!ctx) return;

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
        datasets: [
          {
            label: 'Diésel',
            data: [12, 19, 15, 17],
            backgroundColor: '#10b981',
            borderRadius: 4
          },
          {
            label: 'Eléctrico',
            data: [8, 12, 14, 15],
            backgroundColor: '#06b6d4',
            borderRadius: 4
          }
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

  // Agrega aquí las inicializaciones para otras vistas cuando lo requieras
};