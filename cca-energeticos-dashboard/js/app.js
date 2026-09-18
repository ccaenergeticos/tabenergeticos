document.addEventListener('DOMContentLoaded', () => {
  const mainContent = document.getElementById('main-content');
  const navButtons = document.querySelectorAll('.nav-btn');

  // Función para cargar contenido dinámico desde la carpeta /views/
  async function loadView(viewName) {
    try {
      // Nota la diagonal inicial '/views/...' para asegurar la ruta raíz
      const response = await fetch(`/views/${viewName}.html`);
      
      if (!response.ok) {
        throw new Error(`No se pudo cargar /views/${viewName}.html (Status: ${response.status})`);
      }
      
      const html = await response.text();
      mainContent.innerHTML = html;

      // Inicializar gráficos si la vista los requiere
      if (typeof window.initViewCharts === 'function') {
        window.initViewCharts(viewName);
      }
    } catch (error) {
      console.error(error);
      mainContent.innerHTML = `
        <div class="p-8 text-center text-red-400">
          <i class="fa-solid fa-triangle-exclamation text-4xl mb-3"></i>
          <p class="font-bold">Error al cargar la sección</p>
          <p class="text-xs text-slate-500 mt-1">${error.message}</p>
        </div>`;
    }
  }

  // Escuchar clics en el menú lateral
  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      navButtons.forEach(b => b.classList.remove('active-nav'));
      btn.classList.add('active-nav');

      const view = btn.getAttribute('data-view');
      loadView(view);
    });
  });

  // Cargar vista por defecto al entrar
  loadView('home');
});
