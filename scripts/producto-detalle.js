document.addEventListener("DOMContentLoaded", async () => {
    // Obtener el ID del producto de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        window.location.href = 'catalogo.html';
        return;
    }

    // Cargar los productos
    const response = await fetch('productos.json');
    const productos = await response.json();

    // Encontrar el producto con el ID correspondiente
    const producto = productos.find(p => p.id == productId);

    if (!producto) {
        window.location.href = 'catalogo.html';
        return;
    }

    // Renderizar el producto
    renderizarProducto(producto);
});

function renderizarProducto(producto) {
    const contenedor = document.getElementById('producto-detalle');

    contenedor.innerHTML = `
                <div class="galeria-producto">
                    <div class="miniaturas">
                        ${producto.imagenes.map((img, index) => `
                            <img src="${img}" alt="${producto.nombre}" class="miniatura ${index === 0 ? 'active' : ''}" 
                                 onclick="cambiarImagenPrincipal('${img}', this)">
                        `).join('')}
                    </div>
                    <div class="imagen-container">
                        <img src="${producto.imagenes[0]}" alt="${producto.nombre}" class="imagen-principal" id="imagen-principal">
                    </div>
                </div>
                <div class="info-producto">
                    <h1>${producto.nombre}</h1>
                    <div class="precio-producto">S/ ${producto.precio.toFixed(2)}</div>
                    <div class="descripcion-producto">${producto.descripcion}</div>
                    
                    <div class="opciones-producto">
                        <div class="opcion">
                            <h3>Talla:</h3>
                            <div class="selector-tallas">
                                ${producto.tallas.map(talla => `
                                    <button class="talla-btn" onclick="seleccionarTalla(this)">${talla}</button>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="opcion">
                            <h3>Color:</h3>
                            <div class="selector-colores">
                                ${producto.colores.map((color, index) => `
                                    <button class="color-btn" style="background-color: ${getColorHex(color)}" 
                                            onclick="seleccionarColor(this)" 
                                            title="${color}"></button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <button class="btn-agregar-carrito" onclick="addToCart(${JSON.stringify(producto).replace(/"/g, '&quot;')})">
                        <i class="fas fa-shopping-bag"></i> Añadir al carrito
                    </button>
                    
                    <div class="detalles-adicionales">
                        <div class="detalle-item"><span>Material:</span> <span>${producto.material}</span></div>
                        <div class="detalle-item"><span>Disponibilidad:</span> <span>${producto.stock > 0 ? 'En stock' : 'Agotado'}</span></div>
                        <div class="detalle-item"><span>Categoría:</span> <span>${producto.tipo} para ${producto.genero}</span></div>
                    </div>
                </div>
            `;
}

function cambiarImagenPrincipal(src, elemento) {
    document.getElementById('imagen-principal').src = src;
    document.querySelectorAll('.miniatura').forEach(img => img.classList.remove('active'));
    elemento.classList.add('active');
}

function seleccionarTalla(boton) {
    document.querySelectorAll('.talla-btn').forEach(btn => btn.classList.remove('selected'));
    boton.classList.add('selected');
}

function seleccionarColor(boton) {
    document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('selected'));
    boton.classList.add('selected');
}

// Función para añadir al carrito
function addToCart(producto) {
    try {
        // Convertir el string de producto a objeto si es necesario
        if (typeof producto === 'string') {
            producto = JSON.parse(producto);
        }
        
        // Obtener el carrito actual del localStorage
        let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
        
        // Verificar si el producto ya está en el carrito
        const productoExistente = carrito.find(item => item.id === producto.id);
        
        if (productoExistente) {
            // Si ya existe, aumentar la cantidad en 1
            productoExistente.cantidad += 1;
        } else {
            // Si no existe, añadirlo al carrito con cantidad 1
            carrito.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                imagen: producto.imagen,
                cantidad: 1
            });
        }
        
        // Guardar el carrito actualizado en localStorage
        localStorage.setItem('carrito', JSON.stringify(carrito));
        
        // Actualizar el contador del carrito
        actualizarContadorCarrito();
        
        // Mostrar notificación
        mostrarNotificacion('Producto añadido al carrito');
    } catch (error) {
        console.error('Error al añadir al carrito:', error);
        mostrarNotificacion('Error al añadir el producto');
    }
}

// Función para mostrar notificación
function mostrarNotificacion(mensaje) {
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion';
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);
    
    // Animar la notificación
    setTimeout(() => {
        notificacion.classList.add('mostrar');
    }, 100);
    
    // Eliminar la notificación después de 3 segundos
    setTimeout(() => {
        notificacion.classList.remove('mostrar');
        setTimeout(() => {
            notificacion.remove();
        }, 300);
    }, 3000);
}

// Función para actualizar el contador del carrito
function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
    
    // Actualizar todos los contadores del carrito en la página
    const contadores = document.querySelectorAll('.cart-count');
    contadores.forEach(contador => {
        contador.textContent = totalItems;
        contador.style.display = totalItems > 0 ? 'flex' : 'none';
    });
    
    console.log('Contador actualizado:', totalItems);
}

function getColorHex(colorName) {
    const colors = {
        'Blanco': '#ffffff',
        'Negro': '#000000',
        'Azul': '#35359d',
        'Celeste': '#87CEEB',
        'Azul marino': '#000080',
        'Gris': '#808080',
        'Rojo': '#eb3f3f',
        'Verde': '#006b35',
    };
    return colors[colorName] || '#cccccc';
}