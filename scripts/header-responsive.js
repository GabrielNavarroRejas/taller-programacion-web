// En tu archivo script.js o crea un nuevo archivo header-responsive.js
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    const navIcons = document.querySelector('.nav-icons');
    
    mobileMenu.addEventListener('click', function() {
        this.classList.toggle('active');
        navLinks.classList.toggle('active');
        
        // Efecto especial para mostrar/ocultar los íconos
        if (navLinks.classList.contains('active')) {
            navIcons.style.display = 'flex';
            setTimeout(() => {
                navIcons.style.opacity = '1';
                navIcons.style.transform = 'translateY(0)';
            }, 300);
        } else {
            navIcons.style.opacity = '0';
            navIcons.style.transform = 'translateY(20px)';
            setTimeout(() => {
                navIcons.style.display = 'none';
            }, 300);
        }
    });
    
    // Cerrar menú al hacer clic en un enlace
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 992) {
                mobileMenu.classList.remove('active');
                navLinks.classList.remove('active');
                navIcons.style.opacity = '0';
                navIcons.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    navIcons.style.display = 'none';
                }, 300);
            }
        });
    });
    
    // Ajustar dinámicamente la altura del menú desplegable
    function adjustMenuHeight() {
        if (window.innerWidth <= 992) {
            const viewportHeight = window.innerHeight;
            const menuHeight = viewportHeight - 80; // 80px es la altura del header
            document.querySelector('.nav-links').style.maxHeight = `${menuHeight}px`;
        } else {
            document.querySelector('.nav-links').style.maxHeight = 'none';
        }
    }
    
    window.addEventListener('resize', adjustMenuHeight);
    adjustMenuHeight();
});