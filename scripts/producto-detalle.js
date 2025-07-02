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


function addToCart(producto) {
    try {
        // 1. Convertir el producto a objeto si es un string
        // En caso de que el producto sea pasado como una cadena JSON (por ejemplo, si se ha generado desde otro script), lo convertimos a un objeto.
        if (typeof producto === 'string') {
            producto = JSON.parse(producto);  // Convertir el string en un objeto JSON
        }
        
        // 2. Obtener el carrito actual desde localStorage
        // Intentamos obtener el carrito de localStorage. Si no existe, creamos un carrito vacío.
        let carrito = JSON.parse(localStorage.getItem('carrito')) || [];  // Si no existe, inicializamos un array vacío
        
        // 3. Verificar si el producto ya está en el carrito
        // Buscamos si el producto ya está presente en el carrito por su ID
        const productoExistente = carrito.find(item => item.id === producto.id);
        
        if (productoExistente) {
            // 4. Si el producto ya existe en el carrito, aumentamos su cantidad
            // Si el producto ya está en el carrito, solo incrementamos la cantidad en 1.
            productoExistente.cantidad += 1;  // Aumentamos la cantidad
        } else {
            // 5. Si el producto no existe, lo añadimos al carrito
            // Si no existe, lo añadimos al carrito con una cantidad de 1
            carrito.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                imagen: producto.imagen,
                cantidad: 1  // Al principio, la cantidad es 1
            });
        }
        
        // 6. Guardar el carrito actualizado en localStorage
        // Guardamos el carrito actualizado en el almacenamiento local para mantener los datos entre sesiones.
        localStorage.setItem('carrito', JSON.stringify(carrito));  // Convertimos el carrito a string y lo guardamos

        // 7. Actualizar el contador del carrito
        // Después de añadir el producto, actualizamos el contador que muestra el número de artículos en el carrito.
        actualizarContadorCarrito();  // Esta función actualizará el número de artículos en el carrito

        // 8. Mostrar una notificación al usuario de que el producto se añadió correctamente
        // Proporcionamos retroalimentación visual al usuario de que el producto se ha añadido al carrito con éxito.
        mostrarNotificacion('Producto añadido al carrito');  // Función para mostrar una notificación en la interfaz

    } catch (error) {
        // 9. Manejo de errores
        // Si ocurre un error en el proceso de añadir al carrito (por ejemplo, problemas con el localStorage), lo mostramos en la consola.
        console.error('Error al añadir al carrito:', error);  // Imprime el error en la consola
        mostrarNotificacion('Error al añadir el producto');  // Informa al usuario que ocurrió un error
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