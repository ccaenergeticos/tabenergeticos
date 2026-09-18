document.addEventListener('DOMContentLoaded', () => {
  const mainContent = document.getElementById('main-content');
  const navButtons = document.querySelectorAll('.nav-btn');

  // Carga de vistas HTML dinámicas desde /views/
  async function loadView(viewName) {
    if (!mainContent) return;

    try {
      const response = await fetch(`/views/${viewName}.html`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: No se pudo encontrar /views/${viewName}.html`);
      }
      
      const html = await response.text();
      mainContent.innerHTML = html;

      // Esperar brevemente a que el DOM pinte los elementos inyectados
      setTimeout(() => {
        if (typeof window.initViewCharts === 'function') {
          window.initViewCharts(viewName);
        }
      }, 80);

    } catch (error) {
      console.error(error);
      mainContent.innerHTML = `
        <div class="p-8 text-center text-red-400">
          <i class="fa-solid fa-triangle-exclamation text-4xl mb-3"></i>
          <p class="font-bold text-base">Error al cargar la sección: ${viewName}</p>
          <p class="text-xs text-slate-500 mt-1">${error.message}</p>
        </div>`;
    }
  }

  // Asignar listeners a todos los botones del menú lateral
  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Resaltar el botón activo
      navButtons.forEach(b => b.classList.remove('active-nav'));
      btn.classList.add('active-nav');

      const view = btn.getAttribute('data-view');
      if (view) {
        loadView(view);
      }
    });
  });

  // Cargar vista inicial HOME por defecto
  loadView('home');
});
