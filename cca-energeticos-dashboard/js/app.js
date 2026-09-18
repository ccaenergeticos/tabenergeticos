document.addEventListener('DOMContentLoaded', () = {
  const mainContent = document.getElementById('main-content');
  const navButtons = document.querySelectorAll('.nav-btn');

   Función para cargar contenido desde la carpeta views
  async function loadView(viewName) {
    try {
      const response = await fetch(`views${viewName}.html`);
      if (!response.ok) throw new Error('Vista no encontrada');
      
      const html = await response.text();
      mainContent.innerHTML = html;

       Disparar inicialización de gráficos según la vista cargada
      if (window.initViewCharts) {
        window.initViewCharts(viewName);
      }
    } catch (error) {
      mainContent.innerHTML = `
        div class=p-8 text-center text-red-400
          i class=fa-solid fa-triangle-exclamation text-4xl mb-3i
          pError al cargar la sección ${viewName}p
        div`;
    }
  }

   Manejador de clics en menú lateral
  navButtons.forEach(btn = {
    btn.addEventListener('click', (e) = {
      e.preventDefault();
      
       Actualizar estado visual activo
      navButtons.forEach(b = b.classList.remove('active-nav'));
      btn.classList.add('active-nav');

       Cargar vista solicitada
      const view = btn.getAttribute('data-view');
      loadView(view);
    });
  });

   Cargar vista inicial HOME por defecto
  loadView('home');
});