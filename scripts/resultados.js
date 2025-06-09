document.addEventListener('DOMContentLoaded', function() {
    const resultsContainer = document.getElementById('results-container');
    const noResults = document.getElementById('no-results');
    const resultsTitle = document.getElementById('results-title');
    
    // Obtener término de búsqueda del localStorage
    const searchTerm = localStorage.getItem('searchTerm') || '';
    resultsTitle.textContent = `Resultados para: "${searchTerm}"`;
    
    // Cargar productos y mostrar resultados
    fetch('productos.json')
        .then(response => response.json())
        .then(products => {
            const results = searchProducts(products, searchTerm);
            displayResults(results);
        })
        .catch(error => {
            console.error('Error al cargar los productos:', error);
            noResults.style.display = 'block';
        });
    
    // Función para buscar productos
    function searchProducts(products, query) {
        if (!query.trim()) return [];
        
        return products.filter(product => 
            product.nombre.toLowerCase().includes(query.toLowerCase()) || 
            product.tipo.toLowerCase().includes(query.toLowerCase()) ||
            product.descripcion.toLowerCase().includes(query.toLowerCase())
        );
    }
    
    // Mostrar resultados
    function displayResults(results) {
        if (results.length === 0) {
            noResults.style.display = 'block';
            return;
        }
        
        let html = '';
        results.forEach(product => {
            html += `
                <div class="result-card">
                    <img src="${product.imagen}" alt="${product.nombre}" class="result-card-img">
                    <div class="result-card-content">
                        <span class="result-card-category">${product.tipo}</span>
                        <h3 class="result-card-title">${product.nombre}</h3>
                        <p class="result-card-price">S/. ${product.precio.toFixed(2)}</p>
                        <a href="#" class="result-card-btn">Ver producto</a>
                    </div>
                </div>
            `;
        });
        
        resultsContainer.innerHTML = html;
    }
});