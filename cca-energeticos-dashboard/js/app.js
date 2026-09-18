async function loadView(viewName) {
  try {
    const response = await fetch(`/views/${viewName}.html`);
    if (!response.ok) throw new Error('Vista no encontrada');
    
    const html = await response.text();
    mainContent.innerHTML = html;

    // Esperar al siguiente ciclo del DOM para ejecutar el script de la vista
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (typeof window.initViewCharts === 'function') {
          window.initViewCharts(viewName);
        }
      }, 50);
    });
  } catch (error) {
    mainContent.innerHTML = `
      <div class="p-8 text-center text-red-400">
        <i class="fa-solid fa-triangle-exclamation text-4xl mb-3"></i>
        <p>Error al cargar la sección: ${viewName}</p>
      </div>`;
  }
}
