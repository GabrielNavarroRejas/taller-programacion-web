document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const searchToggle = document.getElementById('search-toggle');
    const searchOverlay = document.getElementById('search-overlay');
    const closeSearch = document.getElementById('close-search');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const searchSuggestions = document.getElementById('search-suggestions');
    
    // Mostrar/ocultar el overlay de búsqueda
    searchToggle.addEventListener('click', function(e) {
        e.preventDefault();
        searchOverlay.classList.add('active');
        searchInput.focus();
    });
    
    closeSearch.addEventListener('click', function() {
        searchOverlay.classList.remove('active');
        searchSuggestions.classList.remove('visible');
    });
    
    // Cargar productos desde el JSON
    let products = [];
    
    fetch('productos.json')
        .then(response => response.json())
        .then(data => {
            products = data;
        })
        .catch(error => {
            console.error('Error al cargar los productos:', error);
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