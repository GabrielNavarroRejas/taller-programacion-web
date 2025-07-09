//Filtro de catalogo

let productos = [];
// Variable global para categorías (compartida entre páginas)
window.categorias = window.categorias || [];
let filtros = {
    tipo: "Todos",
    genero: "Todos",
    precio: "ninguno"
};


// Aplicar filtros al cargar la página
document.addEventListener("DOMContentLoaded", async () => {
    console.log('=== PÁGINA CARGADA - INICIANDO CATÁLOGO ===');
    
    // Cargar productos desde localStorage (del admin) o desde productos.json como fallback
    cargarProductos();
    
    // Cargar categorías desde localStorage
    cargarCategorias();
    
    aplicarFiltros();
    
    // Actualizar contador del carrito
    actualizarContadorCarrito();

    // Evento para mostrar/ocultar sidebar en móviles
    document.querySelector('.toggle-sidebar').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('active');
    });
    
    // Listener para cambios en las categorías desde el panel de administración
    window.addEventListener('storage', function(e) {
        if (e.key === 'modastyle_categorias' && e.newValue !== e.oldValue) {
            // Solo actualizar si realmente hay un cambio en las categorías
            setTimeout(() => {
                console.log('Detectado cambio en categorías desde administración');
                cargarCategorias();
            }, 100);
        }
        // Listener para cambios en productos desde el panel de administración
        if (e.key === 'modastyle_products' && e.newValue !== e.oldValue) {
            setTimeout(() => {
                cargarProductos();
                aplicarFiltros();
            }, 100);
        }
    });
    
    // Listener para evento personalizado de categorías actualizadas
    window.addEventListener('categoriasActualizadas', function(e) {
        console.log('Evento categoriasActualizadas recibido:', e.detail.categorias);
        window.categorias = e.detail.categorias;
        renderizarCategorias();
    });
    
    // Listener para evento personalizado de productos actualizados
    window.addEventListener('productosActualizados', function(e) {
        productos = e.detail.productos;
        aplicarFiltros();
        console.log('Productos actualizados en catálogo:', productos.length);
    });
});

// Función para cargar productos desde localStorage o productos.json
function cargarProductos() {
    try {
        const savedProducts = localStorage.getItem('modastyle_products');
        if (savedProducts) {
            productos = JSON.parse(savedProducts);
            console.log('Productos cargados desde localStorage:', productos.length);
        } else {
            // Si no hay productos en localStorage, cargar desde productos.json
            fetch('productos.json')
                .then(response => response.json())
                .then(data => {
                    productos = data;
                    console.log('Productos cargados desde productos.json:', productos.length);
                    aplicarFiltros();
                })
                .catch(error => {
                    console.error('Error cargando productos desde productos.json:', error);
                    productos = [];
                    aplicarFiltros();
                });
            return; // Salir aquí para evitar aplicar filtros dos veces
        }
    } catch (error) {
        console.error('Error al cargar productos desde localStorage:', error);
        // Fallback a productos.json
        fetch('productos.json')
            .then(response => response.json())
            .then(data => {
                productos = data;
                console.log('Productos cargados desde productos.json (fallback):', productos.length);
                aplicarFiltros();
            })
            .catch(error => {
                console.error('Error cargando productos desde productos.json:', error);
                productos = [];
                aplicarFiltros();
            });
        return;
    }
}

// Función para cargar categorías
function cargarCategorias() {
    console.log('=== CARGANDO CATEGORÍAS EN CATÁLOGO ===');
    try {
        const savedCategorias = localStorage.getItem('modastyle_categorias');
        console.log('Categorías guardadas en localStorage:', savedCategorias);
        
        if (savedCategorias) {
            const categoriasGuardadas = JSON.parse(savedCategorias);
            console.log('Categorías cargadas desde localStorage:', categoriasGuardadas);
            console.log('Número de categorías cargadas:', categoriasGuardadas.length);
            
            // Usar las categorías guardadas
            window.categorias = categoriasGuardadas;
            console.log('Categorías asignadas a variable global:', window.categorias);
            console.log('Número de categorías en variable global:', window.categorias.length);
            
            // Renderizar las categorías dinámicamente
            renderizarCategorias();
        } else {
            console.log('No hay categorías en localStorage, manteniendo categorías del HTML');
            // Inicializar con array vacío para que no se rendericen categorías dinámicas
            window.categorias = [];
            // No llamar a renderizarCategorias() para mantener las categorías del HTML
        }
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        console.log('Usando categorías por defecto del HTML');
        window.categorias = [];
    }
    console.log('=== FIN CARGAR CATEGORÍAS EN CATÁLOGO ===');
}

// Función para renderizar las categorías en los filtros
function renderizarCategorias() {
    console.log('=== RENDERIZANDO CATEGORÍAS EN CATÁLOGO ===');
    console.log('Categorías disponibles:', window.categorias);
    console.log('Número de categorías a renderizar:', window.categorias ? window.categorias.length : 0);
    
    // Solo renderizar si hay categorías dinámicas
    if (!window.categorias || window.categorias.length === 0) {
        console.log('No hay categorías dinámicas, manteniendo categorías del HTML');
        return;
    }
    
    try {
        // Renderizar en el sidebar
        const categoriasFiltro = document.getElementById('categorias-filtro');
        const filtroTipoMovil = document.getElementById('filtro-tipo-movil');
        
        console.log('Elemento categorias-filtro encontrado:', categoriasFiltro);
        console.log('Elemento filtro-tipo-movil encontrado:', filtroTipoMovil);
        
        if (categoriasFiltro) {
            console.log('Renderizando categorías en sidebar...');
            // Mantener el botón "Todos" y las categorías por defecto
            categoriasFiltro.innerHTML = `
                <li><button onclick="filtrarPorTipo('Todos')" class="active"><i class="fas fa-star"></i> Todos</button></li>
                <li><button onclick="filtrarPorTipo('Polos')"><i class="fas fa-tshirt"></i> Polos</button></li>
                <li><button onclick="filtrarPorTipo('Camisas')"><i class="fas fa-user-tie"></i> Camisas</button></li>
                <li><button onclick="filtrarPorTipo('Poleras')"><i class="fas fa-tshirt"></i> Poleras</button></li>
            `;
            
            // Agregar solo las categorías nuevas (que no sean las por defecto)
            const categoriasPorDefecto = ['Polos', 'Camisas', 'Poleras'];
            const categoriasNuevas = window.categorias.filter(categoria => 
                !categoriasPorDefecto.includes(categoria.nombre)
            );
            
            categoriasNuevas.forEach((categoria, index) => {
                const li = document.createElement('li');
                li.innerHTML = `<button onclick="filtrarPorTipo('${categoria.nombre}')" style="color: ${categoria.color || '#6C63FF'}">
                    <i class="${categoria.icono}"></i> ${categoria.nombre}
                </button>`;
                categoriasFiltro.appendChild(li);
                console.log(`Categoría nueva ${index + 1} agregada al sidebar:`, categoria.nombre);
            });
            console.log('Total de categorías en sidebar:', 4 + categoriasNuevas.length); // 4 por defecto + nuevas
        }
        
        if (filtroTipoMovil) {
            console.log('Renderizando categorías en filtro móvil...');
            // Mantener la opción "Todos" y las categorías por defecto
            filtroTipoMovil.innerHTML = `
                <option value="Todos">Todos los tipos</option>
                <option value="Polos">Polos</option>
                <option value="Camisas">Camisas</option>
                <option value="Poleras">Poleras</option>
            `;
            
            // Agregar solo las categorías nuevas
            const categoriasPorDefecto = ['Polos', 'Camisas', 'Poleras'];
            const categoriasNuevas = window.categorias.filter(categoria => 
                !categoriasPorDefecto.includes(categoria.nombre)
            );
            
            categoriasNuevas.forEach((categoria, index) => {
                const option = document.createElement('option');
                option.value = categoria.nombre;
                option.textContent = categoria.nombre;
                filtroTipoMovil.appendChild(option);
                console.log(`Categoría nueva ${index + 1} agregada al filtro móvil:`, categoria.nombre);
            });
            console.log('Total de categorías en filtro móvil:', 4 + categoriasNuevas.length); // 4 por defecto + nuevas
        }
        
        console.log('=== FIN RENDERIZAR CATEGORÍAS EN CATÁLOGO ===');
    } catch (error) {
        console.error('Error al renderizar categorías:', error);
    }
}

function aplicarFiltros() {
    let resultado = [...productos];

    // Filtrar por tipo
    if (filtros.tipo !== "Todos") {
        resultado = resultado.filter(p => p.tipo === filtros.tipo);
    }

    // Filtrar por género
    if (filtros.genero !== "Todos") {
        resultado = resultado.filter(p => p.genero === filtros.genero);
    }

    // Ordenar por precio
    if (filtros.precio === "asc") {
        resultado.sort((a, b) => a.precio - b.precio);
    } else if (filtros.precio === "desc") {
        resultado.sort((a, b) => b.precio - a.precio);
    }

    renderizarProductos(resultado);
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
                <img src="${p.imagen}" alt="${p.nombre}" onerror="this.src='https://via.placeholder.com/300x400?text=Imagen+No+Disponible'; this.onerror=null;" />
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
                    <button class="btn-carrito" onclick="event.stopPropagation(); addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')})" title="Ver detalles y agregar al carrito">
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
        
        // Redirigir a la página de detalle del producto para seleccionar talla y color
        window.location.href = `producto-detalle.html?id=${producto.id}`;
        
    } catch (error) {
        console.error('Error al procesar el producto:', error);
        mostrarNotificacion('Error al procesar el producto');
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

// Función para forzar la carga de categorías (para debugging)
function forzarCargarCategorias() {
    console.log('=== FORZANDO CARGA DE CATEGORÍAS ===');
    cargarCategorias();
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