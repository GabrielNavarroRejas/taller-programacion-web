document.addEventListener("DOMContentLoaded", async () => {
    // Obtener el ID del producto de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        window.location.href = 'catalogo.html';
        return;
    }

    // Cargar los productos desde localStorage o productos.json
    let productos = [];
    try {
        const savedProducts = localStorage.getItem('modastyle_products');
        if (savedProducts) {
            productos = JSON.parse(savedProducts);
            console.log('Productos cargados desde localStorage:', productos.length);
        } else {
            // Fallback a productos.json
            const response = await fetch('productos.json');
            productos = await response.json();
            console.log('Productos cargados desde productos.json:', productos.length);
        }
    } catch (error) {
        console.error('Error cargando productos:', error);
        // Fallback a productos.json
        try {
            const response = await fetch('productos.json');
            productos = await response.json();
        } catch (fallbackError) {
            console.error('Error en fallback:', fallbackError);
            window.location.href = 'catalogo.html';
            return;
        }
    }

    // Encontrar el producto con el ID correspondiente
    const producto = productos.find(p => p.id == productId);

    if (!producto) {
        console.error('Producto no encontrado con ID:', productId);
        window.location.href = 'catalogo.html';
        return;
    }

    // Renderizar el producto
    renderizarProducto(producto);
    
    // Listener para evento personalizado de productos actualizados
    window.addEventListener('productosActualizados', function(e) {
        const productos = e.detail.productos;
        console.log('Productos actualizados en detalle:', productos.length);
        // Buscar el producto actualizado
        const productoActualizado = productos.find(p => p.id == productId);
        if (productoActualizado) {
            renderizarProducto(productoActualizado);
        }
    });
});

function renderizarProducto(producto) {
    const contenedor = document.getElementById('producto-detalle');

    // Preparar las imágenes (pueden venir como array 'imagenes' o string 'imagen')
    let imagenes = [];
    if (producto.imagenes && Array.isArray(producto.imagenes)) {
        imagenes = producto.imagenes;
    } else if (producto.imagen) {
        imagenes = [producto.imagen];
    } else {
        imagenes = ['https://via.placeholder.com/400x500?text=Sin+Imagen'];
    }

    // Preparar las tallas (asegurar que sea un array)
    let tallas = [];
    if (producto.tallas && Array.isArray(producto.tallas)) {
        tallas = producto.tallas;
    } else if (producto.tallas && typeof producto.tallas === 'string') {
        tallas = producto.tallas.split(',').map(t => t.trim());
    } else {
        tallas = ['S', 'M', 'L', 'XL'];
    }

    // Preparar los colores (asegurar que sea un array)
    let colores = [];
    if (producto.colores && Array.isArray(producto.colores)) {
        colores = producto.colores;
    } else if (producto.colores && typeof producto.colores === 'string') {
        colores = producto.colores.split(',').map(c => c.trim());
    } else {
        colores = ['Negro', 'Blanco'];
    }

    contenedor.innerHTML = `
                <div class="galeria-producto">
                    <div class="miniaturas">
                        ${imagenes.map((img, index) => `
                            <img src="${img}" alt="${producto.nombre}" class="miniatura ${index === 0 ? 'active' : ''}" 
                                 onclick="cambiarImagenPrincipal('${img}', this)"
                                 onerror="this.src='https://via.placeholder.com/100x100?text=Error'; this.onerror=null;">
                        `).join('')}
                    </div>
                    <div class="imagen-container">
                        <img src="${imagenes[0]}" alt="${producto.nombre}" class="imagen-principal" id="imagen-principal"
                             onerror="this.src='https://via.placeholder.com/400x500?text=Imagen+No+Disponible'; this.onerror=null;">
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
                                ${tallas.map(talla => `
                                    <button class="talla-btn" onclick="seleccionarTalla(this)">${talla}</button>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="opcion">
                            <h3>Color:</h3>
                            <div class="selector-colores">
                                ${colores.map((color, index) => `
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
                        <div class="detalle-item"><span>Material:</span> <span>${producto.material || 'No especificado'}</span></div>
                        <div class="detalle-item"><span>Disponibilidad:</span> <span>${producto.stock > 0 ? 'En stock' : 'Agotado'}</span></div>
                        <div class="detalle-item"><span>Categoría:</span> <span>${producto.tipo || 'Sin categoría'} para ${producto.genero || 'Unisex'}</span></div>
                    </div>
                </div>
                
                <!-- Sección de Comentarios y Calificaciones -->
                <div class="seccion-comentarios">
                    <h2>Comentarios y Calificaciones</h2>
                    
                    <!-- Formulario para agregar comentario -->
                    <div class="formulario-comentario">
                        <h3>Deja tu comentario</h3>
                        <div class="calificacion-input">
                            <label>Calificación:</label>
                            <div class="estrellas">
                                <i class="fas fa-star" data-rating="1"></i>
                                <i class="fas fa-star" data-rating="2"></i>
                                <i class="fas fa-star" data-rating="3"></i>
                                <i class="fas fa-star" data-rating="4"></i>
                                <i class="fas fa-star" data-rating="5"></i>
                            </div>
                            <span class="rating-text">Selecciona una calificación</span>
                        </div>
                        <div class="input-grupo">
                            <label for="nombre-usuario">Nombre:</label>
                            <input type="text" id="nombre-usuario" placeholder="Tu nombre" required>
                        </div>
                        <div class="input-grupo">
                            <label for="comentario-texto">Comentario:</label>
                            <textarea id="comentario-texto" placeholder="Escribe tu comentario aquí..." required></textarea>
                        </div>
                        <button class="btn-enviar-comentario" onclick="agregarComentario(${producto.id})">
                            <i class="fas fa-paper-plane"></i> Enviar Comentario
                        </button>
                    </div>
                    
                    <!-- Lista de comentarios -->
                    <div class="lista-comentarios" id="lista-comentarios-${producto.id}">
                        <!-- Los comentarios se cargarán dinámicamente -->
                    </div>
                </div>
            `;
    
    // Cargar comentarios existentes
    cargarComentarios(producto.id);
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
        if (typeof producto === 'string') {
            producto = JSON.parse(producto);
        }
        
        // 2. Obtener talla y color seleccionados
        const tallaSeleccionada = document.querySelector('.talla-btn.selected');
        const colorSeleccionado = document.querySelector('.color-btn.selected');
        
        if (!tallaSeleccionada) {
            mostrarNotificacion('Por favor, selecciona una talla');
            return;
        }
        
        if (!colorSeleccionado) {
            mostrarNotificacion('Por favor, selecciona un color');
            return;
        }
        
        const talla = tallaSeleccionada.textContent;
        const color = colorSeleccionado.title;
        
        // 3. Obtener la imagen correspondiente al color seleccionado
        const imagenColor = obtenerImagenPorColor(producto, color);
        
        // 4. Obtener el carrito actual desde localStorage
        let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
        
        // 5. Crear un identificador único para el producto con talla y color
        const itemKey = `${producto.id}-${talla}-${color}`;
        
        // 6. Verificar si el producto con la misma talla y color ya está en el carrito
        const productoExistente = carrito.find(item => 
            item.id === producto.id && 
            item.talla === talla && 
            item.color === color
        );
        
        if (productoExistente) {
            // 7. Si el producto ya existe con la misma talla y color, aumentamos su cantidad
            productoExistente.cantidad += 1;
        } else {
            // 8. Si el producto no existe, lo añadimos al carrito con talla y color
            carrito.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                imagen: imagenColor, // Usar la imagen del color seleccionado
                talla: talla,
                color: color,
                cantidad: 1
            });
        }
        
        // 9. Guardar el carrito actualizado en localStorage
        localStorage.setItem('carrito', JSON.stringify(carrito));

        // 10. Disparar evento personalizado para actualizar contadores
        window.dispatchEvent(new CustomEvent('carritoActualizado'));

        // 11. Mostrar una notificación al usuario
        mostrarNotificacion('Producto añadido al carrito');

    } catch (error) {
        console.error('Error al añadir al carrito:', error);
        mostrarNotificacion('Error al añadir el producto');
    }
}

// Función para obtener la imagen correspondiente al color seleccionado
function obtenerImagenPorColor(producto, color) {
    console.log('Buscando imagen para color:', color, 'en producto:', producto);
    
    // Primero verificar si el producto tiene mapeo de colores a imágenes (productos del admin)
    if (producto.colorImageMappings && producto.colorImageMappings[color]) {
        console.log('Imagen encontrada en colorImageMappings:', producto.colorImageMappings[color]);
        return producto.colorImageMappings[color];
    }
    
    // Mapeo de colores a imágenes específicas para productos del JSON original
    const mapeoColores = {
        1: { // Polo Básico Blanco
            "Blanco": "img/polo-blanco.jpg"
        },
        2: { // Camisa Clásica
            "Celeste": "img/camisa-celeste.jpg",
            "Blanco": "img/camisa-blanca.webp",
            "Azul marino": "img/camisa-azul-marino.webp"
        },
        3: { // Polera Oversize Mujer
            "Verde": "img/polera-mujer.jpg"
        },
        4: { // Polo Tommy Hilfiger
            "Azul": "img/polo-tommy.webp",
            "Rojo": "img/polo-tommy-hilfigger-rojo.webp",
            "Blanco": "img/polo-tommy-blanco.webp"
        }
    };
    
    // Si existe un mapeo específico para este producto y color, usarlo
    if (mapeoColores[producto.id] && mapeoColores[producto.id][color]) {
        console.log('Imagen encontrada en mapeoColores:', mapeoColores[producto.id][color]);
        return mapeoColores[producto.id][color];
    }
    
    // Si no hay mapeo específico, buscar en las imágenes del producto
    if (producto.imagenes && producto.imagenes.length > 0) {
        console.log('Usando primera imagen del producto:', producto.imagenes[0]);
        return producto.imagenes[0];
    } else if (producto.imagen) {
        console.log('Usando imagen principal del producto:', producto.imagen);
        return producto.imagen;
    }
    
    // Fallback
    console.log('Usando imagen por defecto');
    return 'https://via.placeholder.com/300x400?text=Sin+Imagen';
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
        'Marrón': '#a52a2a',
        'Amarillo': '#ffff00',
        'Naranja': '#ffa500',
        'Rosa': '#ffc0cb',
        'Morado': '#800080',
        'Turquesa': '#40e0d0',
        'Coral': '#ff7f50',
        'Verde oliva': '#808000',
        'Violeta': '#6C63FF',
        'Dorado': '#ffd700',
        'Plateado': '#c0c0c0',
        'Beige': '#f5f5dc',
        'Café': '#8b4513',
        'Burgundy': '#800020',
        'Navy': '#000080',
        'Teal': '#008080',
        'Lime': '#32cd32',
        'Fucsia': '#ff00ff',
        'Cian': '#00ffff',
        'Índigo': '#4b0082',
        'Lavanda': '#e6e6fa',
        'Salmón': '#fa8072',
        'Melocotón': '#ffefd5',
        'Menta': '#98ff98',
        'Ocre': '#cc7722',
        'Terracota': '#e2725b',
        'Granate': '#800000',
        'Esmeralda': '#50c878',
        'Zafiro': '#0f52ba',
        'Rubí': '#e0115f',
        'Ámbar': '#ffbf00',
        'Jade': '#00a86b',
        'Ópalo': '#a8c3bc',
        'Perla': '#f0e6d2',
        'Champagne': '#f7e7ce',
        'Cobre': '#b87333',
        'Bronce': '#cd7f32',
        'Platino': '#e5e4e2',
        'Oro': '#ffd700',
        'Púrpura': '#800080',
        'Magenta': '#ff00ff',
        'Coral claro': '#ff7f50',
        'Verde lima': '#32cd32',
        'Azul cielo': '#87ceeb',
        'Rosa profundo': '#ff1493',
        'Verde bosque': '#228b22',
        'Azul medianoche': '#191970',
        'Rojo carmesí': '#dc143c',
        'Verde primavera': '#00ff7f',
        'Azul acero': '#4682b4',
        'Naranja rojizo': '#ff4500',
        'Verde mar': '#2e8b57',
        'Azul real': '#4169e1',
        'Rosa salmón': '#fa8072',
        'Verde oliva claro': '#6b8e23',
        'Azul polvo': '#b0e0e6',
        'Rojo indio': '#cd5c5c',
        'Verde amarillo': '#9acd32',
        'Azul cadete': '#5f9ea0',
        'Naranja oscuro': '#ff8c00',
        'Verde oscuro': '#006400',
        'Azul oscuro': '#00008b',
        'Rojo oscuro': '#8b0000',
        'Amarillo dorado': '#ffd700',
        'Verde dorado': '#daa520',
        'Azul dorado': '#b8860b',
        'Rojo dorado': '#daa520'
    };
    return colors[colorName] || '#cccccc';
}

// Variables globales para comentarios
let calificacionSeleccionada = 0;

// Función para manejar la selección de estrellas
function seleccionarEstrella(rating) {
    calificacionSeleccionada = rating;
    const estrellas = document.querySelectorAll('.estrellas i');
    const ratingText = document.querySelector('.rating-text');
    
    estrellas.forEach((estrella, index) => {
        if (index < rating) {
            estrella.classList.add('active');
            estrella.style.animationDelay = `${index * 0.1}s`;
            estrella.style.animation = 'starPulse 0.6s ease-out';
        } else {
            estrella.classList.remove('active');
            estrella.style.animation = '';
        }
    });
    
    const textos = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];
    const colores = ['', '#ff4757', '#ffa502', '#ffa502', '#2ed573', '#1e90ff'];
    
    ratingText.textContent = textos[rating] || 'Selecciona una calificación';
    ratingText.style.color = colores[rating] || '#666';
    
    if (rating > 0) {
        ratingText.classList.add('rating-selected');
        ratingText.style.animation = 'ratingSelected 0.5s ease-out';
    } else {
        ratingText.classList.remove('rating-selected');
        ratingText.style.animation = '';
    }
}

// Función para agregar comentario
function agregarComentario(productoId) {
    const nombre = document.getElementById('nombre-usuario').value.trim();
    const comentario = document.getElementById('comentario-texto').value.trim();
    
    if (!nombre) {
        mostrarNotificacion('Por favor, ingresa tu nombre');
        return;
    }
    
    if (!comentario) {
        mostrarNotificacion('Por favor, escribe un comentario');
        return;
    }
    
    if (calificacionSeleccionada === 0) {
        mostrarNotificacion('Por favor, selecciona una calificación');
        return;
    }
    
    // Crear nuevo comentario
    const nuevoComentario = {
        id: Date.now(),
        nombre: nombre,
        comentario: comentario,
        calificacion: calificacionSeleccionada,
        fecha: new Date().toISOString(),
        productoId: productoId
    };
    
    // Animación del botón
    const boton = document.querySelector('.btn-enviar-comentario');
    boton.style.transform = 'scale(0.95)';
    boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    boton.disabled = true;
    
    // Simular delay para mostrar la animación
    setTimeout(() => {
        // Guardar comentario en localStorage
        guardarComentario(nuevoComentario);
        
        // Limpiar formulario con animación
        const inputs = document.querySelectorAll('.input-grupo input, .input-grupo textarea');
        inputs.forEach(input => {
            input.style.transform = 'scale(0.98)';
            input.style.opacity = '0.7';
            setTimeout(() => {
                input.value = '';
                input.style.transform = 'scale(1)';
                input.style.opacity = '1';
            }, 200);
        });
        
        // Resetear calificación
        calificacionSeleccionada = 0;
        const estrellas = document.querySelectorAll('.estrellas i');
        estrellas.forEach(estrella => {
            estrella.classList.remove('active');
            estrella.style.transform = 'scale(0.8)';
            setTimeout(() => {
                estrella.style.transform = 'scale(1)';
            }, 100);
        });
        
        const ratingText = document.querySelector('.rating-text');
        ratingText.textContent = 'Selecciona una calificación';
        ratingText.classList.remove('rating-selected');
        
        // Restaurar botón
        boton.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Comentario';
        boton.style.transform = 'scale(1)';
        boton.disabled = false;
        
        // Recargar comentarios con animación
        cargarComentarios(productoId);
        
        // Mostrar notificación de éxito
        mostrarNotificacion('¡Comentario agregado exitosamente! 🎉');
        
        // Scroll suave hacia los comentarios
        const seccionComentarios = document.querySelector('.seccion-comentarios');
        seccionComentarios.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
    }, 800);
}

// Función para guardar comentario en localStorage
function guardarComentario(comentario) {
    let comentarios = JSON.parse(localStorage.getItem('modastyle_comentarios')) || [];
    comentarios.push(comentario);
    localStorage.setItem('modastyle_comentarios', JSON.stringify(comentarios));
}

// Función para cargar comentarios
function cargarComentarios(productoId) {
    const comentarios = JSON.parse(localStorage.getItem('modastyle_comentarios')) || [];
    const comentariosProducto = comentarios.filter(c => c.productoId == productoId);
    
    const contenedor = document.getElementById(`lista-comentarios-${productoId}`);
    
    if (comentariosProducto.length === 0) {
        contenedor.innerHTML = '<p class="sin-comentarios">No hay comentarios aún. ¡Sé el primero en comentar!</p>';
        return;
    }
    
    // Ordenar comentarios por fecha (más recientes primero)
    comentariosProducto.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    // Calcular calificación promedio
    const calificacionPromedio = comentariosProducto.reduce((sum, c) => sum + c.calificacion, 0) / comentariosProducto.length;
    
    contenedor.innerHTML = `
        <div class="resumen-calificaciones" style="animation: slideInUp 0.8s ease-out;">
            <div class="calificacion-promedio">
                <span class="numero-promedio">${calificacionPromedio.toFixed(1)}</span>
                <div class="estrellas-promedio">
                    ${generarEstrellasHTML(calificacionPromedio)}
                </div>
                <span class="total-comentarios">${comentariosProducto.length} comentario${comentariosProducto.length !== 1 ? 's' : ''}</span>
            </div>
        </div>
        <div class="comentarios-lista">
            ${comentariosProducto.map((comentario, index) => `
                <div class="comentario-item" style="animation: slideInUp 0.6s ease-out ${index * 0.1}s both;">
                    <div class="comentario-header">
                        <div class="usuario-info">
                            <span class="nombre-usuario">${comentario.nombre}</span>
                            <div class="estrellas-comentario">
                                ${generarEstrellasHTML(comentario.calificacion)}
                            </div>
                        </div>
                        <span class="fecha-comentario">${formatearFecha(comentario.fecha)}</span>
                    </div>
                    <div class="texto-comentario">
                        ${comentario.comentario}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Función para generar HTML de estrellas
function generarEstrellasHTML(calificacion) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= calificacion) {
            html += '<i class="fas fa-star active"></i>';
        } else if (i - calificacion < 1) {
            html += '<i class="fas fa-star-half-alt active"></i>';
        } else {
            html += '<i class="far fa-star"></i>';
        }
    }
    return html;
}

// Función para formatear fecha
function formatearFecha(fechaISO) {
    const fecha = new Date(fechaISO);
    const ahora = new Date();
    const diferencia = ahora - fecha;
    
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    
    if (minutos < 60) {
        return `hace ${minutos} minuto${minutos !== 1 ? 's' : ''}`;
    } else if (horas < 24) {
        return `hace ${horas} hora${horas !== 1 ? 's' : ''}`;
    } else if (dias < 7) {
        return `hace ${dias} día${dias !== 1 ? 's' : ''}`;
    } else {
        return fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Agregar event listeners para las estrellas cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Event listener para las estrellas del formulario
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('estrellas') || e.target.closest('.estrellas')) {
            const estrella = e.target.closest('i');
            if (estrella && estrella.dataset.rating) {
                seleccionarEstrella(parseInt(estrella.dataset.rating));
            }
        }
    });
});