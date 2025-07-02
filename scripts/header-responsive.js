document.addEventListener('DOMContentLoaded', function() {
    // Obtener el botón de menú móvil, los enlaces de navegación y los íconos
    const mobileMenu = document.getElementById('mobile-menu');  // Botón que activa el menú móvil
    const navLinks = document.querySelector('.nav-links');  // Contenedor de los enlaces de navegación
    const navIcons = document.querySelector('.nav-icons');  // Contenedor de los íconos de redes sociales o íconos adicionales
    
    // Manejo del clic en el botón de menú móvil
    mobileMenu.addEventListener('click', function() {
        // Alterna la clase 'active' en el botón de menú y en los enlaces de navegación
        this.classList.toggle('active');  // Alterna el estado del botón de menú
        navLinks.classList.toggle('active');  // Alterna la visibilidad de los enlaces de navegación

        // Efecto especial de animación para mostrar/ocultar los íconos de redes sociales
        if (navLinks.classList.contains('active')) {  // Si los enlaces de navegación están activos
            navIcons.style.display = 'flex';  // Muestra los íconos
            setTimeout(() => {  // Espera 300ms para realizar una transición suave
                navIcons.style.opacity = '1';  // Hace visible los íconos
                navIcons.style.transform = 'translateY(0)';  // Los mueve suavemente hacia su posición original
            }, 300);
        } else {  // Si los enlaces de navegación están inactivos
            navIcons.style.opacity = '0';  // Hace los íconos invisibles
            navIcons.style.transform = 'translateY(20px)';  // Mueve los íconos hacia abajo para ocultarlos
            setTimeout(() => {  // Espera 300ms antes de ocultar los íconos completamente
                navIcons.style.display = 'none';  // Los oculta completamente
            }, 300);
        }
    });
    
    // Cerrar el menú cuando se haga clic en un enlace de navegación
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function() {
            // Solo cierra el menú en pantallas pequeñas (menos de 992px de ancho)
            if (window.innerWidth <= 992) {  // Solo en pantallas móviles o tabletas
                mobileMenu.classList.remove('active');  // Desactiva el botón de menú móvil
                navLinks.classList.remove('active');  // Oculta los enlaces de navegación
                navIcons.style.opacity = '0';  // Desvanece los íconos de redes sociales
                navIcons.style.transform = 'translateY(20px)';  // Mueve los íconos hacia abajo
                setTimeout(() => {
                    navIcons.style.display = 'none';  // Esconde los íconos completamente después de 300ms
                }, 300);
            }
        });
    });
    
    // Ajustar la altura del menú desplegable dinámicamente para pantallas pequeñas
    function adjustMenuHeight() {
        if (window.innerWidth <= 992) {  // Solo para pantallas móviles o tabletas
            const viewportHeight = window.innerHeight;  // Obtiene la altura de la ventana del navegador
            const menuHeight = viewportHeight - 80;  // Resta la altura del header (80px) para dejar espacio al menú
            document.querySelector('.nav-links').style.maxHeight = `${menuHeight}px`;  // Establece la altura máxima del menú
        } else {  // Si es una pantalla más grande (escritorio)
            document.querySelector('.nav-links').style.maxHeight = 'none';  // Elimina cualquier restricción de altura
        }
    }
    
    // Llamada al evento de redimensionar para ajustar el menú cada vez que se cambie el tamaño de la ventana
    window.addEventListener('resize', adjustMenuHeight);  // Ejecuta la función cuando el tamaño de la ventana cambia
    adjustMenuHeight();  // Llama a la función al cargar la página para establecer la altura inicial del menú
});
