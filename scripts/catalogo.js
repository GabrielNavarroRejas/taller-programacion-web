// Este script maneja los filtros y la visualización de productos en el catálogo

// Inicialización de productos y filtros
let productos = [];  // Array donde se almacenarán los productos del catálogo
let filtros = {
    tipo: "Todos",  // Filtro por tipo de producto (por ejemplo, ropa, calzado, etc.)
    genero: "Todos",  // Filtro por género (masculino, femenino, etc.)
    precio: "ninguno"  // Filtro por rango de precios (ninguno, ascendente, descendente)
};


// Aplicar filtros al cargar la página
document.addEventListener("DOMContentLoaded", async () => {
    // Cargar los productos desde un archivo JSON
    const respuesta = await fetch('productos.json');
    productos = await respuesta.json();
    aplicarFiltros();  // Aplicar los filtros al cargar los productos

 // Evento para mostrar/ocultar el sidebar en dispositivos móviles
    document.querySelector('.toggle-sidebar').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('active');
    });
});

// Función para aplicar los filtros seleccionados
function aplicarFiltros() {
    let resultado = [...productos];  // Hacemos una copia de los productos para evitar modificar el original

    // Filtrar por tipo de producto
    if (filtros.tipo !== "Todos") {
        resultado = resultado.filter(p => p.tipo === filtros.tipo);
    }

    // Filtrar por género
    if (filtros.genero !== "Todos") {
        resultado = resultado.filter(p => p.genero === filtros.genero);
    }

    // Ordenar los productos por precio
    if (filtros.precio === "asc") {
        resultado.sort((a, b) => a.precio - b.precio);  // Orden ascendente por precio
    } else if (filtros.precio === "desc") {
        resultado.sort((a, b) => b.precio - a.precio);  // Orden descendente por precio
    }

    // Aquí podrías añadir más lógica para mostrar los productos filtrados
}

function actualizarBotonesActivos(grupoClase, valorActivo) {
    const grupo = document.querySelector(`.${grupoClase}`);
    const botones = grupo.querySelectorAll("button");

    botones.forEach(btn => {
        // Comparar por texto exacto del botón (puedes mejorar esto con data-atributos si lo deseas)
        if (btn.textContent === valorActivo ||
            (valorActivo === "ninguno" && btn.textContent === "Ninguno")) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}

function filtrarPorTipo(tipo) {
    filtros.tipo = tipo;
    actualizarBotonesActivos("filtro-tipo", tipo);
    aplicarFiltros();
}

function filtrarPorGenero(genero) {
    filtros.genero = genero;
    actualizarBotonesActivos("filtro-genero", genero);
    aplicarFiltros();
}

function ordenarPrecio(orden) {
    filtros.precio = orden;
    actualizarBotonesActivos("filtro-precio", orden);
    aplicarFiltros();
}

function renderizarProductos(lista) {
    const contenedor = document.getElementById("contenedor-productos");
    contenedor.innerHTML = "";

    if (lista.length === 0) {
        contenedor.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px;">
                <h2>No se encontraron productos</h2>
                <p>Intenta cambiar tus filtros de búsqueda</p>
                <button onclick="filtrarPorTipo('Todos');filtrarPorGenero('Todos')" style="margin-top: 20px; padding: 12px 30px; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer;">Mostrar todos</button>
            </div>
        `;
        return;
    }

    lista.forEach((p, index) => {
        const ficha = document.createElement("div");
        ficha.className = "producto";
        ficha.style.animationDelay = `${index * 0.1}s`;

        // Hacer el producto clickeable
        ficha.style.cursor = "pointer";
        ficha.addEventListener("click", () => {
            window.location.href = `producto-detalle.html?id=${p.id}`;
        });

        ficha.innerHTML = `
            <div class="producto-imagen">
                <img src="${p.imagen}" alt="${p.nombre}" />
                <div class="producto-badges">
                    ${p.nuevo ? '<span class="badge badge-new">NUEVO</span>' : ''}
                    ${p.popular ? '<span class="badge badge-popular">POPULAR</span>' : ''}
                </div>
            </div>
            <div class="producto-info">
                <h2>${p.nombre}</h2>
                <p class="descripcion">${p.descripcion}</p>
                <div class="producto-precio">
                    <span class="precio">S/ ${p.precio.toFixed(2)}</span>
                    <button class="btn-carrito" onclick="event.stopPropagation(); addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')})">
                        <i class="fas fa-shopping-bag"></i>
                    </button>
                </div>
            </div>
        `;
        contenedor.appendChild(ficha);
    });
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