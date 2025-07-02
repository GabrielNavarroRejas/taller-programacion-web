document.addEventListener('DOMContentLoaded', function() {
    const resultsContainer = document.getElementById('results-container');  // Contenedor de resultados de búsqueda
    const noResults = document.getElementById('no-results');  // Contenedor de "sin resultados"
    const resultsTitle = document.getElementById('results-title');  // Título de los resultados

    // Obtener término de búsqueda del localStorage
    const searchTerm = localStorage.getItem('searchTerm') || '';  // Si no hay término en el localStorage, se asigna una cadena vacía
    resultsTitle.textContent = `Resultados para: "${searchTerm}"`;  // Muestra el término de búsqueda en el título

    // Cargar productos y mostrar resultados
    fetch('productos.json')  // Asíncronamente carga los productos desde el archivo JSON
        .then(response => response.json())  // Convierte la respuesta en formato JSON
        .then(products => {
            const results = searchProducts(products, searchTerm);  // Filtra los productos por el término de búsqueda
            displayResults(results);  // Muestra los resultados en el contenedor
        })
        .catch(error => {
            console.error('Error al cargar los productos:', error);  // Maneja errores de carga
            noResults.style.display = 'block';  // Muestra un mensaje de "sin resultados"
        });

    // Función para buscar productos basados en el término de búsqueda
    function searchProducts(products, query) {
        if (!query.trim()) return [];  // Si el término de búsqueda está vacío, no devuelve resultados
        return products.filter(product => 
            product.nombre.toLowerCase().includes(query.toLowerCase()) ||  // Filtra por nombre
            product.tipo.toLowerCase().includes(query.toLowerCase()) ||  // Filtra por tipo
            product.descripcion.toLowerCase().includes(query.toLowerCase())  // Filtra por descripción
        );
    }

    // Función para mostrar los resultados en el contenedor
    function displayResults(results) {
        if (results.length === 0) {  // Si no hay resultados, muestra el mensaje "sin resultados"
            noResults.style.display = 'block';
            return;
        }

        let html = '';  // Variable para almacenar el HTML generado
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
        
        resultsContainer.innerHTML = html;  // Inserta el HTML generado en el contenedor de resultados
    }
});
