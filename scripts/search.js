document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const searchToggle = document.getElementById('search-toggle');  // Botón para abrir la barra de búsqueda
    const searchOverlay = document.getElementById('search-overlay');  // Contenedor del overlay de búsqueda
    const closeSearch = document.getElementById('close-search');  // Botón para cerrar el overlay de búsqueda
    const searchInput = document.getElementById('search-input');  // Campo de entrada para la búsqueda
    const searchButton = document.getElementById('search-button');  // Botón para realizar la búsqueda
    const searchSuggestions = document.getElementById('search-suggestions');  // Sugerencias de búsqueda
    
    // Evento para mostrar el overlay de búsqueda
    searchToggle.addEventListener('click', function(e) {
        e.preventDefault();
        searchOverlay.classList.add('active');  // Muestra el overlay de búsqueda
        searchInput.focus();  // Pone el foco en el campo de búsqueda
    });

    // Evento para cerrar el overlay de búsqueda
    closeSearch.addEventListener('click', function() {
        searchOverlay.classList.remove('active');  // Oculta el overlay
        searchSuggestions.classList.remove('visible');  // Oculta las sugerencias
    });

    let products = [];  // Variable para almacenar los productos

    // Carga los productos desde el archivo JSON de manera asíncrona
    fetch('productos.json')
        .then(response => response.json())  // Convierte la respuesta en formato JSON
        .then(data => {
            products = data;  // Guarda los productos en la variable
        });
    
    // Buscar productos y mostrar sugerencias
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        if (query.length > 0) {
            const results = searchProducts(query);
            displaySuggestions(results);
        } else {
            searchSuggestions.classList.remove('visible');
        }
    });
    
    // Función para buscar productos
    function searchProducts(query) {
        return products.filter(product => 
            product.nombre.toLowerCase().includes(query.toLowerCase()) || 
            product.tipo.toLowerCase().includes(query.toLowerCase()) ||
            product.descripcion.toLowerCase().includes(query.toLowerCase())
        );
    }
    
    // Mostrar sugerencias de búsqueda
    function displaySuggestions(results) {
        if (results.length === 0) {
            searchSuggestions.innerHTML = '<div class="search-suggestion-item">No se encontraron productos</div>';
            searchSuggestions.classList.add('visible');
            return;
        }
        
        let html = '';
        results.slice(0, 5).forEach(product => {
            html += `
                <div class="search-suggestion-item" data-id="${product.nombre}">
                    <img src="${product.imagen}" alt="${product.nombre}">
                    <div class="search-suggestion-info">
                        <h4>${product.nombre}</h4>
                        <p>${product.tipo} - S/. ${product.precio.toFixed(2)}</p>
                    </div>
                </div>
            `;
        });
        
        // Añadir opción para ver todos los resultados
        if (results.length > 5) {
            html += `<div class="search-suggestion-item view-all">Ver todos los resultados (${results.length})</div>`;
        }
        
        searchSuggestions.innerHTML = html;
        searchSuggestions.classList.add('visible');
        
        // Manejar clic en sugerencias
        document.querySelectorAll('.search-suggestion-item').forEach(item => {
            item.addEventListener('click', function() {
                const searchTerm = searchInput.value;
                localStorage.setItem('searchTerm', searchTerm);
                window.location.href = 'resultados.html';
            });
        });
    }
    
    // Manejar búsqueda al hacer clic en el botón o presionar Enter
    function performSearch() {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            localStorage.setItem('searchTerm', searchTerm);
            window.location.href = 'resultados.html';
        }
    }
    
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Cerrar al hacer clic fuera del área de búsqueda
    searchOverlay.addEventListener('click', function(e) {
        if (e.target === searchOverlay) {
            searchOverlay.classList.remove('active');
            searchSuggestions.classList.remove('visible');
        }
    });
});