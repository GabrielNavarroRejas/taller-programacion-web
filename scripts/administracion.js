// Este archivo maneja el inicio de sesión y la administración de productos en el panel de administración

// ===============================
// Manejo del inicio de sesión
// ===============================
// El login se maneja en setupEventListeners() para evitar duplicados

// ===============================
// Base de datos de productos (simulada con localStorage)
// ===============================
let productos = [];
let currentEditId = null;

// ===============================
// Base de datos de categorías (simulada con localStorage)
// ===============================
// Variable global para categorías (compartida entre páginas)
window.categorias = window.categorias || [];
let currentCategoryEditId = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function () {
        console.log('DOM cargado, inicializando administración...');
    
    // LIMPIAR PRODUCTOS ANTIGUOS PARA CARGAR LOS NUEVOS (SOLO UNA VEZ)
    console.log('=== LIMPIANDO PRODUCTOS ANTIGUOS ===');
    const shouldReloadProducts = !localStorage.getItem('modastyle_products_updated');
    if (shouldReloadProducts) {
        localStorage.removeItem('modastyle_products');
        localStorage.setItem('modastyle_products_updated', 'true');
        console.log('Productos antiguos eliminados de localStorage');
    } else {
        console.log('Productos ya actualizados, no es necesario limpiar');
    }
    
    // Verificar que los elementos existan
    const loginForm = document.getElementById('login-form');
    const loginScreen = document.getElementById('login-screen');
    const adminPanel = document.getElementById('admin-panel');
    
    console.log('Elementos encontrados:', {
        loginForm: !!loginForm,
        loginScreen: !!loginScreen,
        adminPanel: !!adminPanel
    });
    
    if (!loginForm) {
        console.error('ERROR: No se encontró el formulario de login');
        return;
    }
    
    if (!loginScreen) {
        console.error('ERROR: No se encontró la pantalla de login');
        return;
    }
    
    if (!adminPanel) {
        console.error('ERROR: No se encontró el panel de administración');
        return;
    }
    
    // Configurar eventos básicos primero
    setupEventListeners();
    
    // Verificar si ya hay una sesión activa
    if (adminPanel && !adminPanel.classList.contains('hidden')) {
        console.log('Sesión ya activa, cargando datos...');
        // Sesión ya activa, cargar datos
        loadProducts();
        loadCategorias();
        setupSectionNavigation();
    } else {
        console.log('No hay sesión activa, esperando login...');
        // Asegurar que el login esté visible
        if (loginScreen) loginScreen.classList.remove('hidden');
        if (adminPanel) adminPanel.classList.add('hidden');
    }
});

// Nueva función para inicializar la navegación de secciones
function setupSectionNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = {
        0: 'section-dashboard',
        1: 'section-productos',
        2: 'section-categorias',
        3: 'section-pedidos',
        4: 'section-estadisticas',
        5: 'section-ajustes'
    };
    navItems.forEach((item, idx) => {
        item.addEventListener('click', function () {
            navItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            Object.values(sections).forEach(id => {
                const sec = document.getElementById(id);
                if (sec) sec.style.display = 'none';
            });
            const sectionId = sections[idx];
            const section = document.getElementById(sectionId);
            if (section) section.style.display = '';
            if (sectionId === 'section-pedidos') renderPedidos();
            if (sectionId === 'section-estadisticas') {
                console.log('Navegando a sección de estadísticas');
                renderEstadisticas();
                console.log('Estadísticas actualizadas');
            }
            if (sectionId === 'section-productos') {
                console.log('Navegando a sección de productos');
                updateProductTypeDropdown(); // Actualizar dropdown cuando se navega a productos
                updateDashboard(); // Actualizar dashboard cuando se navega a productos
                renderProducts(); // Renderizar productos cuando se navega a la sección
                setupSaveProductButton(); // Configurar el botón de guardar producto
                console.log('Sección de productos cargada');
            }
            if (sectionId === 'section-categorias') {
                renderCategorias();
                setupCategoryEventListeners(); // Configurar eventos cuando se muestra la sección
            }
        });
    });
}

// ===============================
// Función para cargar productos
// ===============================

// Función para cargar productos
function loadProducts() {
    console.log('=== CARGANDO PRODUCTOS ===');
    // Primero intentar cargar desde localStorage
    const savedProducts = localStorage.getItem('modastyle_products');
    console.log('Productos guardados en localStorage:', savedProducts);
    
    if (savedProducts) {
        try {
            productos = JSON.parse(savedProducts);
            console.log('Productos cargados desde localStorage:', productos.length);
            console.log('Productos parseados:', productos);
            updateDashboard();
            renderProducts();
            return;
        } catch (error) {
            console.error('Error al parsear productos de localStorage:', error);
        }
    }
    
    // Si no hay productos en localStorage, cargar desde productos.json
    fetch('productos.json')
        .then(response => response.json())
        .then(data => {
            productos = data;
            saveProducts(); // Guardar en localStorage para persistencia
            updateDashboard();
            renderProducts();
        })
        .catch(error => {
            console.error('Error cargando productos:', error);
            showNotification('Error cargando productos', 'error');
        });
}

// Guardar productos en localStorage
function saveProducts() {
    console.log('=== GUARDANDO PRODUCTOS ===');
    console.log('Productos a guardar:', productos);
    console.log('Cantidad de productos:', productos.length);
    
    localStorage.setItem('modastyle_products', JSON.stringify(productos));
    console.log('Productos guardados en localStorage');
    
    // Disparar evento personalizado para notificar a otras páginas
    window.dispatchEvent(new CustomEvent('productosActualizados', {
        detail: { productos: productos }
    }));
    
    updateDashboard();
    
    // Actualizar estadísticas si están visibles
    const estadisticasSection = document.getElementById('section-estadisticas');
    if (estadisticasSection && estadisticasSection.style.display !== 'none') {
        renderEstadisticas();
    }
    
    console.log('Dashboard actualizado');
    console.log('=== FIN GUARDAR PRODUCTOS ===');
}

// Actualizar el dashboard con estadísticas
function updateDashboard() {
    const totalProducts = document.getElementById('total-products');
    const totalStock = document.getElementById('total-stock');
    const totalValue = document.getElementById('total-value');

    if (totalProducts && totalStock && totalValue) {
        totalProducts.textContent = productos.length;
        
        // Calcular stock total usando el nuevo sistema de stock por color y talla
        const stock = productos.reduce((sum, product) => {
            if (product.stock && typeof product.stock === 'object') {
                const productStock = Object.values(product.stock).reduce((colorSum, sizes) => {
                    if (typeof sizes === 'object') {
                        return colorSum + Object.values(sizes).reduce((sizeSum, quantity) => sizeSum + quantity, 0);
                    }
                    return colorSum + (sizes || 0);
                }, 0);
                console.log(`Stock de ${product.nombre}: ${productStock}`);
                return sum + productStock;
            }
            return sum;
        }, 0);
        totalStock.textContent = stock;
        console.log('Stock total calculado:', stock);
        
        // Calcular valor total usando el nuevo sistema de stock por color y talla
        const value = productos.reduce((sum, product) => {
            if (product.stock && typeof product.stock === 'object') {
                const productStock = Object.values(product.stock).reduce((colorSum, sizes) => {
                    if (typeof sizes === 'object') {
                        return colorSum + Object.values(sizes).reduce((sizeSum, quantity) => sizeSum + quantity, 0);
                    }
                    return colorSum + (sizes || 0);
                }, 0);
                const productValue = product.precio * productStock;
                console.log(`Valor de ${product.nombre}: S/ ${productValue.toFixed(2)} (${productStock} unidades x S/ ${product.precio})`);
                return sum + productValue;
            }
            return sum;
        }, 0);
        totalValue.textContent = `S/ ${value.toFixed(2)}`;
        console.log('Valor total del inventario: S/', value.toFixed(2));
    } else {
        console.error('One or more dashboard elements not found');
    }
    
    // Actualizar estadísticas de comentarios
    updateDashboardComments();
}

// Renderizar lista de productos
function renderProducts() {
    console.log('=== RENDERIZANDO PRODUCTOS ===');
    console.log('Productos en memoria:', productos);
    console.log('Cantidad de productos:', productos.length);
    
    // Verificar que productos sea un array
    if (!Array.isArray(productos)) {
        console.error('ERROR: productos no es un array:', productos);
        productos = [];
    }
    
    const container = document.getElementById('product-list');
    console.log('Contenedor de productos encontrado:', container);
    
    if (!container) {
        console.error('ERROR: No se encontró el contenedor de productos');
        return;
    }

    container.innerHTML = '';
    console.log('Contenedor limpiado');

    if (productos.length === 0) {
        container.innerHTML = '<div class="empty-message">No hay productos registrados</div>';
        console.log('No hay productos para mostrar');
        return;
    }

    productos.forEach(product => {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        productItem.innerHTML = `
            <img src="${product.imagen}" class="product-img" alt="${product.nombre}" onerror="this.src='https://via.placeholder.com/150'">
            <div class="product-info">
                <div class="product-name">${product.nombre}</div>
                <div class="product-price">S/ ${product.precio.toFixed(2)}</div>
                <div class="product-meta">Tipo: ${product.tipo} | Tallas: ${product.tallas.join(', ')}</div>
            </div>
            <div class="product-actions">
                <div class="action-btn edit-btn" data-id="${product.id}">
                    <i class="fas fa-edit"></i>
                </div>
                <div class="action-btn delete-btn" data-id="${product.id}">
                    <i class="fas fa-trash"></i>
                </div>
            </div>
        `;
        container.appendChild(productItem);
    });

    // Agregar event listeners a los botones de editar
    const editButtons = document.querySelectorAll('.edit-btn');
    console.log('Botones de editar encontrados:', editButtons.length);
    
    editButtons.forEach(btn => {
        // Remover event listeners previos
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('=== BOTÓN EDITAR CLICKEADO ===');
            const id = parseInt(this.getAttribute('data-id'));
            console.log('ID del producto a editar:', id);
            console.log('Producto encontrado:', productos.find(p => p.id === id));
            editProduct(id);
        });
    });

    // Agregar event listeners a los botones de eliminar
    const deleteButtons = document.querySelectorAll('.delete-btn');
    console.log('Botones de eliminar encontrados:', deleteButtons.length);
    
    deleteButtons.forEach(btn => {
        // Remover event listeners previos
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('=== BOTÓN ELIMINAR CLICKEADO ===');
            const id = parseInt(this.getAttribute('data-id'));
            console.log('ID del producto a eliminar:', id);
            deleteProduct(id);
        });
    });
    
    console.log('Productos renderizados exitosamente');
    console.log('Elementos de producto creados:', container.children.length);
    console.log('Botones de editar configurados:', editButtons.length);
    console.log('Botones de eliminar configurados:', deleteButtons.length);
    console.log('=== FIN RENDERIZAR PRODUCTOS ===');
}

// Editar producto
function editProduct(id) {
    console.log('=== EDITANDO PRODUCTO ===');
    console.log('ID del producto a editar:', id);
    console.log('Productos disponibles:', productos);
    
    const product = productos.find(p => p.id === id);
    if (!product) {
        console.error('Producto no encontrado con ID:', id);
        showNotification('Error: Producto no encontrado', 'error');
        return;
    }
    console.log('Producto encontrado:', product);

    // Navegar a la sección de productos primero
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(i => i.classList.remove('active'));
    
    const productosNavItem = document.querySelector('.nav-item[data-section="section-productos"]');
    if (productosNavItem) {
        productosNavItem.classList.add('active');
    }
    
    // Mostrar la sección de productos
    const sections = ['section-dashboard', 'section-productos', 'section-categorias', 'section-pedidos', 'section-estadisticas', 'section-ajustes'];
    sections.forEach(sectionId => {
        const sec = document.getElementById(sectionId);
        if (sec) sec.style.display = 'none';
    });
    
    const productSection = document.getElementById('section-productos');
    if (productSection) {
        productSection.style.display = '';
        console.log('Sección de productos mostrada');
    }

    // Limpiar datos dinámicos antes de cargar
    console.log('Limpiando datos dinámicos...');
    if (window.clearProductData) {
        window.clearProductData();
    }
    
    // Limpiar completamente todos los datos dinámicos
    clearAllDynamicData();

    // Cargar datos básicos del producto
    console.log('Cargando datos básicos del producto en el formulario...');
    
    const fields = {
        'product-id': product.id,
        'product-name': product.nombre,
        'product-price': product.precio,
        'product-description': product.descripcion,
        'product-image': product.imagen,
        'product-type': product.tipo,
        'product-gender': product.genero,
        'product-sizes': Array.isArray(product.tallas) ? product.tallas.join(', ') : product.tallas,
        'product-material': product.material
    };
    
    // Cargar cada campo con verificación
    Object.entries(fields).forEach(([fieldId, value]) => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = value;
            console.log(`Campo ${fieldId} cargado con valor:`, value);
        } else {
            console.error(`Campo ${fieldId} no encontrado`);
        }
    });
    
    console.log('Datos básicos cargados');

    // Cargar datos dinámicos (colores, imágenes, stock)
    console.log('Cargando datos dinámicos...');
    if (window.loadProductData) {
        try {
            window.loadProductData(product);
            console.log('Datos dinámicos cargados exitosamente');
        } catch (error) {
            console.error('Error al cargar datos dinámicos:', error);
        }
    } else {
        console.warn('Función loadProductData no disponible');
    }

    // Actualizar título del formulario
    const formTitle = document.getElementById('form-title');
    if (formTitle) {
        formTitle.textContent = "Editar Producto";
        console.log('Título del formulario actualizado');
    }

    // Hacer scroll al formulario
    const productForm = document.getElementById('product-form');
    if (productForm) {
        setTimeout(() => {
            productForm.scrollIntoView({ behavior: 'smooth' });
            console.log('Formulario scrolleado');
        }, 100);
    } else {
        console.error('ERROR: No se encontró el formulario de productos');
    }

    showNotification('Producto cargado para edición');
    console.log('=== FIN EDITAR PRODUCTO ===');
}

// Eliminar producto
function deleteProduct(id) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    productos = productos.filter(p => p.id !== id);
    saveProducts();
    renderProducts();
    updateDashboard(); // Actualizar dashboard
    showNotification('Producto eliminado exitosamente');
}

// Configurar eventos
function setupEventListeners() {
    document.getElementById('login-form').addEventListener('submit', function (e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === 'admin' && password === 'admin123') {
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('admin-panel').classList.remove('hidden');
            document.getElementById('section-dashboard').style.display = '';
            document.getElementById('section-productos').style.display = 'none';
            document.getElementById('section-categorias').style.display = 'none';
            document.getElementById('section-pedidos').style.display = 'none';
            document.getElementById('section-estadisticas').style.display = 'none';
            document.getElementById('section-ajustes').style.display = 'none';
            
            // Configurar navegación y cargar datos
            setupSectionNavigation();
            loadProducts();
            loadCategorias();
            updateDashboard(); // Actualizar dashboard inicial
        } else {
            document.getElementById('login-error').style.display = 'block';
            const form = document.getElementById('login-form');
            form.classList.add('shake');
            setTimeout(() => form.classList.remove('shake'), 500);
        }
    });

    // Configurar eventos para colores e imágenes dinámicas
    setupDynamicInputs();
    
    // Configurar eventos para las tarjetas del dashboard
    setupDashboardCards();
    


    document.getElementById('floating-btn').addEventListener('click', function () {
        // Limpiar completamente para nuevo producto
        window.clearFormForNewProduct();
        clearAllDynamicData(); // Limpiar todos los datos dinámicos
        document.getElementById('product-form').scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('add-product-btn').addEventListener('click', function () {
        // Limpiar completamente para nuevo producto
        window.clearFormForNewProduct();
        clearAllDynamicData(); // Limpiar todos los datos dinámicos
        document.getElementById('product-form').scrollIntoView({ behavior: 'smooth' });
    });

    // Configurar el botón de guardar producto
    setupSaveProductButton();


    
    // Event listener global como respaldo para el botón de guardar producto
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'save-product-btn') {
            console.log('Botón de guardar producto clickeado (event listener global)');
            e.preventDefault();
            e.stopPropagation();
            
            // Simular el clic en el botón configurado
            const saveBtn = document.querySelector('#product-form button[type="submit"]');
            if (saveBtn) {
                saveBtn.click();
            }
        }
    });
    
    // Listener para evento personalizado de pedidos actualizados
    window.addEventListener('pedidosActualizados', function(e) {
        console.log('Pedidos actualizados:', e.detail.pedidos.length);
        // Actualizar estadísticas si están visibles
        const estadisticasSection = document.getElementById('section-estadisticas');
        if (estadisticasSection && estadisticasSection.style.display !== 'none') {
            renderEstadisticas();
        }
    });
    
    console.log('setupEventListeners completado');
}

// Generar nuevo ID
function generarNuevoId() {
    if (productos.length === 0) return 1;
    const maxId = Math.max(...productos.map(p => p.id));
    return maxId + 1;
}

// Mostrar notificación
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.querySelector('span').textContent = message;

    if (type === 'error') {
        notification.style.background = '#f44336';
    } else {
        notification.style.background = '#4CAF50';
    }

    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Botón flotante para nuevo producto
document.querySelector('.floating-btn').addEventListener('click', function () {
    document.getElementById('product-form').reset();
    document.getElementById('form-title').textContent = "Agregar Nuevo Producto";
    document.getElementById('product-form').scrollIntoView({ behavior: 'smooth' });
});

function mover() {
    // Limpiar completamente para nuevo producto
    window.clearFormForNewProduct();
    clearAllDynamicData(); // Limpiar todos los datos dinámicos
    document.getElementById('product-form').scrollIntoView({ behavior: 'smooth' });
}

// Función para configurar el botón de guardar producto
function setupSaveProductButton() {
    console.log('=== CONFIGURANDO BOTÓN DE GUARDAR PRODUCTO ===');
    
    // Buscar el botón de guardar producto
    const saveProductBtn = document.querySelector('#product-form button[type="submit"]');
    console.log('Buscando botón de guardar producto:', saveProductBtn);
    
    if (saveProductBtn) {
        console.log('Botón de guardar producto encontrado');
        
        // Remover event listeners previos (clonar el botón)
        const newButton = saveProductBtn.cloneNode(true);
        saveProductBtn.parentNode.replaceChild(newButton, saveProductBtn);
        
        // Agregar event listener al botón
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('=== BOTÓN DE GUARDAR PRODUCTO CLICKEADO ===');
            
            // Obtener datos del formulario
            const id = document.getElementById('product-id').value;
            const productName = document.getElementById('product-name').value;
            const productDescription = document.getElementById('product-description').value;
            const productPrice = document.getElementById('product-price').value;
            const productImage = document.getElementById('product-image').value;
            const productType = document.getElementById('product-type').value;
            const productGender = document.getElementById('product-gender').value;
            const productSizes = document.getElementById('product-sizes').value;
            const productMaterial = document.getElementById('product-material').value;
            
            console.log('Datos del formulario:', {
                id: id,
                nombre: productName,
                descripcion: productDescription,
                precio: productPrice,
                imagen: productImage,
                tipo: productType,
                genero: productGender,
                tallas: productSizes,
                material: productMaterial
            });

            // Validar campos requeridos
            if (!productName || !productPrice || !productImage || !productType || !productSizes) {
                showNotification('Por favor, completa los campos requeridos: Nombre, Precio, Imagen, Tipo y Tallas', 'error');
                return false;
            }

            try {
                const productData = {
                    id: id ? parseInt(id) : generarNuevoId(),
                    nombre: productName,
                    descripcion: productDescription,
                    precio: parseFloat(productPrice),
                    imagen: productImage,
                    imagenes: window.getProductImages ? window.getProductImages() : [],
                    colorImageMappings: window.getColorImageMappings ? window.getColorImageMappings() : {},
                    stock: window.getProductStock ? window.getProductStock() : {},
                    tipo: productType,
                    genero: productGender,
                    colores: window.getProductColors ? window.getProductColors() : [],
                    tallas: productSizes.split(',').map(s => s.trim()),
                    material: productMaterial
                };
                
                console.log('Datos del producto a guardar:', productData);

                if (id) {
                    // Editar producto existente
                    const index = productos.findIndex(p => p.id === parseInt(id));
                    if (index !== -1) {
                        productos[index] = productData;
                        showNotification('Producto actualizado exitosamente');
                    }
                } else {
                    // Agregar nuevo producto
                    productos.push(productData);
                    showNotification('Producto agregado exitosamente');
                }

                console.log('Productos actuales:', productos);
                saveProducts();
                renderProducts();
                updateDashboard();
                
                // Limpiar formulario solo si es un nuevo producto
                if (!id) {
                    const productForm = document.getElementById('product-form');
                    productForm.reset();
                    document.getElementById('product-id').value = '';
                    document.getElementById('form-title').textContent = "Agregar Nuevo Producto";
                    
                    // Limpiar colores e imágenes dinámicas
                    if (window.clearProductData) {
                        window.clearProductData();
                    }
                    
                    // Limpiar datos dinámicos manualmente
                    clearAllDynamicData();
                }
                
                return false;
                
            } catch (error) {
                console.error('Error al guardar producto:', error);
                showNotification('Error al guardar el producto: ' + error.message, 'error');
                return false;
            }
        });
        
        console.log('Event listener agregado exitosamente al botón de guardar producto');
    } else {
        console.error('Botón de guardar producto no encontrado');
        console.log('Elementos disponibles:', document.querySelectorAll('button'));
        console.log('Formulario de productos:', document.getElementById('product-form'));
    }
    
    console.log('=== FIN CONFIGURAR BOTÓN DE GUARDAR PRODUCTO ===');
}

// Función para limpiar todos los datos dinámicos del formulario
function clearAllDynamicData() {
    console.log('=== LIMPIANDO DATOS DINÁMICOS ===');
    
    // Limpiar colores
    const colorsList = document.getElementById('colors-list');
    if (colorsList) {
        colorsList.innerHTML = '';
        console.log('Lista de colores limpiada');
    }
    
    // Limpiar stock
    const stockList = document.getElementById('stock-list');
    if (stockList) {
        stockList.innerHTML = '';
        console.log('Lista de stock limpiada');
    }
    
    // Limpiar stock por color y talla específicamente
    const stockItems = document.querySelectorAll('.stock-item, .stock-tag');
    stockItems.forEach(item => {
        item.remove();
    });
    console.log('Elementos de stock individuales eliminados');
    
    // Limpiar mapeos de color-imagen
    const colorImageMappings = document.getElementById('color-image-mappings');
    if (colorImageMappings) {
        colorImageMappings.innerHTML = '';
        console.log('Mapeos color-imagen limpiados');
    }
    
    // Limpiar imágenes adicionales
    const imagesList = document.getElementById('images-list');
    if (imagesList) {
        imagesList.innerHTML = '';
        console.log('Lista de imágenes limpiada');
    }
    
    // Limpiar selectores
    const stockColorSelector = document.getElementById('stock-color-selector');
    if (stockColorSelector) {
        stockColorSelector.innerHTML = '<option value="">Seleccionar color...</option>';
    }
    
    const stockSizeSelector = document.getElementById('stock-size-selector');
    if (stockSizeSelector) {
        stockSizeSelector.innerHTML = '<option value="">Seleccionar talla...</option>';
    }
    
    const colorSelector = document.getElementById('color-selector');
    if (colorSelector) {
        colorSelector.innerHTML = '<option value="">Seleccionar color...</option>';
    }
    
    // Limpiar variables globales
    if (window.productColors) {
        window.productColors = [];
    }
    if (window.productStock) {
        window.productStock = {};
    }
    if (window.colorImageMappings) {
        window.colorImageMappings = {};
    }
    if (window.productImages) {
        window.productImages = [];
    }
    
    // Limpiar campos de entrada
    const colorInput = document.getElementById('product-colors');
    if (colorInput) {
        colorInput.value = '';
        colorInput.placeholder = 'Escribe un color y presiona Enter o el botón +';
    }
    
    const stockQuantityInput = document.getElementById('stock-quantity');
    if (stockQuantityInput) {
        stockQuantityInput.value = '';
    }
    
    const colorImageUrlInput = document.getElementById('color-image-url');
    if (colorImageUrlInput) {
        colorImageUrlInput.value = '';
    }
    
    // Limpiar imagen principal del producto
    const productImageInput = document.getElementById('product-image');
    if (productImageInput) {
        productImageInput.value = '';
        console.log('Campo de imagen principal limpiado');
    }
    
    console.log('=== DATOS DINÁMICOS LIMPIADOS ===');
}

function renderPedidos() {
    const pedidosContainer = document.querySelector('#section-pedidos .info-section');
    if (!pedidosContainer) return;
    const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    if (pedidos.length === 0) {
        pedidosContainer.innerHTML = '<p>No hay pedidos registrados.</p>';
        return;
    }
    // Filtros
    let filtro = window.pedidosFiltro || 'todos';
    let fechaInicio = window.pedidosFechaInicio || '';
    let fechaFin = window.pedidosFechaFin || '';
    const now = new Date();
    // --- FILTRO POR FECHA ---
    let html = `<div class='pedidos-filtros' style='display:flex;align-items:center;gap:1em;margin-bottom:1em;'>
        <button class='filtro-btn${filtro === 'hoy' ? ' active' : ''}' data-filtro='hoy'>Hoy</button>
        <button class='filtro-btn${filtro === 'semana' ? ' active' : ''}' data-filtro='semana'>Semana</button>
        <button class='filtro-btn${filtro === 'mes' ? ' active' : ''}' data-filtro='mes'>Mes</button>
        <button class='filtro-btn${filtro === 'anio' ? ' active' : ''}' data-filtro='anio'>Año</button>
        <button class='filtro-btn${filtro === 'todos' ? ' active' : ''}' data-filtro='todos'>Todos</button>
        <span style='margin-left:2em;display:flex;align-items:center;gap:0.5em;'>
            <label for='fecha-inicio' style='font-weight:500;'>De</label>
            <input type='date' id='fecha-inicio' value='${fechaInicio}' style='padding:3px 8px;border-radius:6px;border:1px solid #ccc;'>
            <label for='fecha-fin' style='font-weight:500;'>a</label>
            <input type='date' id='fecha-fin' value='${fechaFin}' style='padding:3px 8px;border-radius:6px;border:1px solid #ccc;'>
            <button class='filtro-btn' id='filtrar-fechas' style='margin-left:0.5em;'>Filtrar</button>
        </span>
        <button class='btn-actualizar' id='actualizar-pedidos' style='margin-left:auto;background:linear-gradient(135deg, var(--primary), var(--secondary));color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600;display:flex;align-items:center;gap:8px;'>
            <i class="fas fa-sync-alt"></i> Actualizar Tabla
        </button>
        <button class='btn-exportar' id='exportar-pedidos' style='margin-left:10px;background:linear-gradient(135deg, #4CAF50, #45a049);color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600;display:flex;align-items:center;gap:8px;'>
            <i class="fas fa-file-pdf"></i> Exportar PDF
        </button>
    </div>`;
    // --- FILTRADO DE PEDIDOS ---
    let pedidosFiltrados = pedidos.filter(pedido => {
        const fecha = new Date(pedido.fecha);
        // Normalizar fechas a solo año-mes-día para comparar sin hora
        const fechaPedido = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
        const fechaHoy = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        // --- CORRECCIÓN: Normalizar fechaInicio y fechaFin a solo año-mes-día ---
        let fechaInicioDate = fechaInicio ? new Date(fechaInicio + 'T00:00:00') : null;
        let fechaFinDate = fechaFin ? new Date(fechaFin + 'T00:00:00') : null;
        if (fechaInicioDate && fechaPedido < fechaInicioDate) return false;
        if (fechaFinDate && fechaPedido > fechaFinDate) return false;
        if (filtro === 'hoy') {
            return fechaPedido.getTime() === fechaHoy.getTime();
        } else if (filtro === 'semana') {
            // Calcular lunes de la semana actual
            const dayOfWeek = fechaHoy.getDay() === 0 ? 6 : fechaHoy.getDay() - 1; // Lunes=0, Domingo=6
            const startOfWeek = new Date(fechaHoy);
            startOfWeek.setDate(fechaHoy.getDate() - dayOfWeek);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            return fechaPedido >= startOfWeek && fechaPedido <= endOfWeek;
        } else if (filtro === 'mes') {
            return fechaPedido.getMonth() === fechaHoy.getMonth() && fechaPedido.getFullYear() === fechaHoy.getFullYear();
        } else if (filtro === 'anio') {
            return fechaPedido.getFullYear() === fechaHoy.getFullYear();
        }
        return true;
    });
    // --- TABLA DE PEDIDOS ---
    html += `<table class="admin-table"><thead><tr><th>Fecha</th><th>Cliente</th><th>Teléfono</th><th>Productos</th><th>Especificación</th><th>Total</th><th>Estado</th></tr></thead><tbody>`;
    pedidosFiltrados.forEach((pedido, idx) => {
        // Asegurar que el estado se cargue correctamente
        let estado = pedido.estado || 'pendiente';
        estado = estado.toLowerCase();
        
        // Usar el índice del pedido en el array original como identificador único
        const pedidoOriginalIdx = pedidos.findIndex(p => 
            p.fecha === pedido.fecha && 
            p.cliente?.nombre === pedido.cliente?.nombre &&
            p.total === pedido.total
        );
        
        console.log(`Pedido ${idx}: estado cargado = "${estado}", índice original = ${pedidoOriginalIdx}`);
        
        let badgeClass = 'badge pendiente';
        if (estado === 'completado') badgeClass = 'badge completado';
        if (estado === 'cancelado') badgeClass = 'badge cancelado';
        let fechaObj = new Date(pedido.fecha);
        let fechaLegible = fechaObj.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
        let horaLegible = fechaObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
        html += `<tr>`;
        html += `<td><span style='font-weight:600;'>${fechaLegible}</span><br><span style='color:#888;font-size:0.95em;'>${horaLegible}</span></td>`;
        html += `<td>${pedido.cliente ? pedido.cliente.nombre : '-'}</td>`;
        html += `<td>${pedido.cliente ? pedido.cliente.telefono : (pedido.telefono || '')}</td>`;
        html += `<td><ul style='padding-left:1.2em;'>` + pedido.productos.map(prod => `<li>${prod.nombre} <span style='color:#6C63FF;'>(x${prod.cantidad})</span></li>`).join('') + `</ul></td>`;
        // Generar especificación automática basada en los productos del pedido
        let especificacionText = '';
        if (pedido.productos && pedido.productos.length > 0) {
            especificacionText = pedido.productos.map(prod => {
                let detalles = `${prod.nombre}`;
                if (prod.talla) detalles += ` - Talla: ${prod.talla}`;
                if (prod.color) detalles += ` - Color: ${prod.color}`;
                if (prod.cantidad) detalles += ` (x${prod.cantidad})`;
                return detalles;
            }).join('\n');
        }
        
        html += `<td><div class="especificacion-display" style="width:100%;min-height:60px;padding:8px;border-radius:6px;border:1px solid #ddd;background:#f8f9fa;font-size:12px;line-height:1.4;white-space:pre-line;">${especificacionText || 'Sin especificaciones'}</div></td>`;
        html += `<td><b>S/ ${pedido.total.toFixed(2)}</b></td>`;
        html += `<td>
        <select class="estado-select" data-idx="${pedidoOriginalIdx}" style="background:${estado === 'completado' ? '#C8E6C9' : estado === 'cancelado' ? '#FFCDD2' : '#FFF9C4'};border-radius:6px;padding:10px 10px;border:none">
            <option value="pendiente" ${estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
            <option value="completado" ${estado === 'completado' ? 'selected' : ''}>Completado</option>
            <option value="cancelado" ${estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
        </select>
    </td>`;
        html += `</tr>`;
    });
    html += `</tbody></table>`;
    // --- RESUMEN DE PRODUCTOS VENDIDOS EN EL RANGO O PERIODO ---
    const productosVendidos = {};
    pedidosFiltrados.forEach(pedido => {
        pedido.productos.forEach(prod => {
            if (!productosVendidos[prod.nombre]) productosVendidos[prod.nombre] = 0;
            productosVendidos[prod.nombre] += prod.cantidad;
        });
    });
    html += `<div class='productos-vendidos-dia' style='margin-top:1.5em;background:#f8f9ff;border-radius:12px;padding:1em 1.5em;box-shadow:0 2px 8px rgba(108,99,255,0.07);'>
        <h4 style='margin-bottom:0.7em;color:#6C63FF;'>Productos vendidos en este periodo:</h4><ul style='columns:2;column-gap:2em;padding-left:1.2em;'>`;
    if (Object.keys(productosVendidos).length === 0) {
        html += '<li style="color:#888;">No hay productos vendidos en este periodo.</li>';
    } else {
        Object.entries(productosVendidos).forEach(([nombre, cantidad]) => {
            html += `<li><b>${nombre}</b>: <span style='color:#4CAF50;'>${cantidad}</span></li>`;
        });
    }
    html += `</ul></div>`;
    pedidosContainer.innerHTML = html;
    // Eventos de cambio de estado
    pedidosContainer.querySelectorAll('.estado-select').forEach(sel => {
        sel.addEventListener('change', function () {
            console.log('Cambiando estado del pedido:', this.dataset.idx, 'a:', this.value);
            
            const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
            const pedidoIdx = parseInt(this.dataset.idx);
            
            console.log('Buscando pedido en índice:', pedidoIdx);
            console.log('Total de pedidos:', pedidos.length);
            
            if (pedidoIdx >= 0 && pedidoIdx < pedidos.length) {
                // Guardar el estado exactamente como se seleccionó
                pedidos[pedidoIdx].estado = this.value;
                console.log('Estado guardado:', pedidos[pedidoIdx].estado);
                
                // Guardar en localStorage inmediatamente
                localStorage.setItem('pedidos', JSON.stringify(pedidos));
                console.log('Pedidos guardados en localStorage');
                
                // Actualizar estadísticas si están visibles
                const estadisticasSection = document.getElementById('section-estadisticas');
                if (estadisticasSection && estadisticasSection.style.display !== 'none') {
                    renderEstadisticas();
                }
                
                // Actualizar dashboard si está visible
                updateDashboard();
                
                // Mostrar notificación
                showNotification(`Estado del pedido actualizado a: ${this.value}`, 'success');
            } else {
                console.error('Pedido no encontrado en índice:', pedidoIdx);
                console.error('Pedidos disponibles:', pedidos);
                showNotification('Error: Pedido no encontrado', 'error');
            }
            
            // Cambiar color dinámicamente
            if (this.value === 'completado') {
                this.style.background = '#C8E6C9';
            } else if (this.value === 'cancelado') {
                this.style.background = '#FFCDD2';
            } else {
                this.style.background = '#FFF9C4';
            }
        });
        
        // Inicializa el color al cargar
        if (sel.value === 'completado') {
            sel.style.background = '#C8E6C9';
        } else if (sel.value === 'cancelado') {
            sel.style.background = '#FFCDD2';
        } else {
            sel.style.background = '#FFF9C4';
        }
    });
    
    // La especificación ahora es solo de lectura, no necesita event listeners
    
    // Verificar que los pedidos se cargaron correctamente
    console.log('Pedidos cargados desde localStorage:', JSON.parse(localStorage.getItem('pedidos') || '[]'));
    // Evento para exportar pedidos a PDF
    const exportarBtn = pedidosContainer.querySelector('#exportar-pedidos');
    if (exportarBtn) {
        exportarBtn.addEventListener('click', function() {
            exportPedidosReport(pedidosFiltrados, filtro, fechaInicio, fechaFin);
        });
    }
    
    // Eventos de filtro
    pedidosContainer.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.onclick = function () {
            window.pedidosFiltro = this.dataset.filtro;
            window.pedidosFechaInicio = '';
            window.pedidosFechaFin = '';
            renderPedidos();
        };

    });
    // Evento para filtrar por fechas
    const filtrarFechasBtn = pedidosContainer.querySelector('#filtrar-fechas');
    if (filtrarFechasBtn) {
        filtrarFechasBtn.onclick = function () {
            const inicio = pedidosContainer.querySelector('#fecha-inicio').value;
            const fin = pedidosContainer.querySelector('#fecha-fin').value;
            window.pedidosFechaInicio = inicio;
            window.pedidosFechaFin = fin;
            window.pedidosFiltro = 'todos';
            renderPedidos();
        };
    }
    
    // Evento para actualizar tabla
    const actualizarBtn = pedidosContainer.querySelector('#actualizar-pedidos');
    if (actualizarBtn) {
        actualizarBtn.onclick = function () {
            // Agregar animación de rotación al ícono
            const icon = this.querySelector('i');
            icon.style.transition = 'transform 0.5s ease';
            icon.style.transform = 'rotate(360deg)';
            
            // Mostrar notificación
            showNotification('Actualizando tabla de pedidos...', 'info');
            
            // Re-renderizar la tabla después de un pequeño delay
            setTimeout(() => {
                renderPedidos();
                icon.style.transform = 'rotate(0deg)';
                showNotification('Tabla actualizada correctamente', 'success');
            }, 500);
        };
    }
}

function renderEstadisticas() {
    console.log('=== RENDERIZANDO ESTADÍSTICAS ===');
    const estContainer = document.querySelector('#section-estadisticas .info-section');
    if (!estContainer) {
        console.error('Contenedor de estadísticas no encontrado');
        return;
    }
    
    // Productos
    const productos = JSON.parse(localStorage.getItem('modastyle_products')) || [];
    const totalProductos = productos.length;
    
    // Calcular stock total correctamente
    const totalStock = productos.reduce((sum, product) => {
        if (product.stock && typeof product.stock === 'object') {
            return sum + Object.values(product.stock).reduce((colorSum, sizes) => {
                if (typeof sizes === 'object') {
                    return colorSum + Object.values(sizes).reduce((sizeSum, quantity) => sizeSum + quantity, 0);
                }
                return colorSum + (sizes || 0);
            }, 0);
        }
        return sum + (product.stock || 0);
    }, 0);
    
    // Calcular valor total del inventario
    const valorTotalInventario = productos.reduce((sum, product) => {
        if (product.stock && typeof product.stock === 'object') {
            const productStock = Object.values(product.stock).reduce((colorSum, sizes) => {
                if (typeof sizes === 'object') {
                    return colorSum + Object.values(sizes).reduce((sizeSum, quantity) => sizeSum + quantity, 0);
                }
                return colorSum + (sizes || 0);
            }, 0);
            return sum + (product.precio * productStock);
        }
        return sum + (product.precio * (product.stock || 0));
    }, 0);
    
    // Pedidos
    const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    const totalPedidos = pedidos.length;
    const totalVendido = pedidos.reduce((sum, p) => sum + (p.total || 0), 0);
    
    // Producto más vendido
    let productoMasVendido = '-';
    let maxVendidas = 0;
    const ventasPorProducto = {};
    pedidos.forEach(pedido => {
        (pedido.productos || []).forEach(prod => {
            ventasPorProducto[prod.nombre] = (ventasPorProducto[prod.nombre] || 0) + prod.cantidad;
            if (ventasPorProducto[prod.nombre] > maxVendidas) {
                maxVendidas = ventasPorProducto[prod.nombre];
                productoMasVendido = prod.nombre;
            }
        });
    });
    
    // Estadísticas por categoría
    const statsPorCategoria = {};
    
    // Obtener todas las categorías disponibles (incluyendo las que no tienen productos)
    const categorias = JSON.parse(localStorage.getItem('modastyle_categorias')) || [];
    const categoriasPorDefecto = [
        { nombre: 'Polos', icono: 'fas fa-tshirt', color: '#6C63FF' },
        { nombre: 'Camisas', icono: 'fas fa-user-tie', color: '#4CAF50' },
        { nombre: 'Poleras', icono: 'fas fa-tshirt', color: '#FF6584' }
    ];
    
    // Combinar categorías por defecto con las categorías dinámicas
    const todasLasCategorias = [...categoriasPorDefecto];
    if (categorias && categorias.length > 0) {
        const categoriasNuevas = categorias.filter(categoria => 
            !categoriasPorDefecto.some(defecto => defecto.nombre === categoria.nombre)
        );
        todasLasCategorias.push(...categoriasNuevas);
    }
    
    console.log('Categorías cargadas:', categorias);
    console.log('Categorías por defecto:', categoriasPorDefecto.map(c => c.nombre));
    console.log('Todas las categorías:', todasLasCategorias.map(c => c.nombre));
    
    // Inicializar estadísticas para todas las categorías
    todasLasCategorias.forEach(categoria => {
        statsPorCategoria[categoria.nombre] = {
            count: 0,
            stock: 0,
            value: 0
        };
    });
    
    // Calcular estadísticas de productos
    productos.forEach(product => {
        if (statsPorCategoria[product.tipo]) {
            statsPorCategoria[product.tipo].count++;
            
            // Calcular stock por categoría
            if (product.stock && typeof product.stock === 'object') {
                const productStock = Object.values(product.stock).reduce((colorSum, sizes) => {
                    if (typeof sizes === 'object') {
                        return colorSum + Object.values(sizes).reduce((sizeSum, quantity) => sizeSum + quantity, 0);
                    }
                    return colorSum + (sizes || 0);
                }, 0);
                statsPorCategoria[product.tipo].stock += productStock;
                statsPorCategoria[product.tipo].value += product.precio * productStock;
            } else {
                statsPorCategoria[product.tipo].stock += product.stock || 0;
                statsPorCategoria[product.tipo].value += product.precio * (product.stock || 0);
            }
        }
    });
    
    console.log('Estadísticas calculadas:', statsPorCategoria);
    
    // Colores para los gráficos
    const colors = ['#6C63FF', '#FF6584', '#4CAF50', '#FF9800', '#9C27B0', '#2196F3', '#F44336', '#00BCD4'];
    
    estContainer.innerHTML = `
    <div class="estadisticas-grid">
      <div class="estadistica-card">
        <div class="icono"><i class="fas fa-box"></i></div>
        <div class="valor">${totalProductos}</div>
        <div class="label">Productos registrados</div>
      </div>
      <div class="estadistica-card">
        <div class="icono"><i class="fas fa-cubes"></i></div>
        <div class="valor">${totalStock}</div>
        <div class="label">Stock total</div>
      </div>
            <div class="estadistica-card">
                <div class="icono"><i class="fas fa-coins"></i></div>
                <div class="valor">S/ ${valorTotalInventario.toFixed(2)}</div>
                <div class="label">Valor del inventario</div>
            </div>
      <div class="estadistica-card">
        <div class="icono"><i class="fas fa-shopping-cart"></i></div>
        <div class="valor">${totalPedidos}</div>
        <div class="label">Pedidos recibidos</div>
      </div>
      <div class="estadistica-card">
                <div class="icono"><i class="fas fa-dollar-sign"></i></div>
        <div class="valor">S/ ${totalVendido.toFixed(2)}</div>
        <div class="label">Total vendido</div>
      </div>
      <div class="estadistica-card">
        <div class="icono"><i class="fas fa-star"></i></div>
        <div class="valor">${productoMasVendido}</div>
        <div class="label">Producto más vendido</div>
      </div>
    </div>
        
        <div class="charts-container">
            <div class="chart-section">
                <h3>Distribución por Categorías</h3>
                <div class="pie-chart-container">
                    <canvas id="categoriaChart" width="300" height="300"></canvas>
                    <div class="chart-legend">
                        ${Object.entries(statsPorCategoria).map(([categoria, stats], index) => `
                            <div class="legend-item">
                                <span class="legend-color" style="background-color: ${colors[index % colors.length]}"></span>
                                <span class="legend-label">${categoria}</span>
                                <span class="legend-value">${stats.count} productos</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div class="chart-section">
                <h3>Stock por Categoría</h3>
                <div class="bar-chart-container">
                    <canvas id="stockChart" width="400" height="300"></canvas>
                </div>
            </div>
            
            <div class="chart-section">
                <h3>Valor por Categoría</h3>
                <div class="bar-chart-container">
                    <canvas id="valueChart" width="400" height="300"></canvas>
                </div>
            </div>
        </div>
        
        <div class="stats-table-container">
            <h3>Detalle por Categoría</h3>
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>Categoría</th>
                        <th>Productos</th>
                        <th>Stock</th>
                        <th>Valor</th>
                        <th>% del Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(statsPorCategoria).map(([categoria, stats]) => `
                        <tr>
                            <td><strong>${categoria}</strong></td>
                            <td>${stats.count}</td>
                            <td>${stats.stock}</td>
                            <td>S/ ${stats.value.toFixed(2)}</td>
                            <td>${totalProductos > 0 ? ((stats.count / totalProductos) * 100).toFixed(1) : '0.0'}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    // Crear gráficos después de que el HTML esté listo
    setTimeout(() => {
        createPieChart('categoriaChart', Object.keys(statsPorCategoria), Object.values(statsPorCategoria).map(s => s.count), colors);
        createBarChart('stockChart', Object.keys(statsPorCategoria), Object.values(statsPorCategoria).map(s => s.stock), colors, 'Stock');
        createBarChart('valueChart', Object.keys(statsPorCategoria), Object.values(statsPorCategoria).map(s => s.value), colors, 'Valor (S/)');
        
        // Asegurar que los botones del dashboard funcionen
        if (typeof setupDashboardCards === 'function') {
            setupDashboardCards();
        }
    }, 100);
    
    console.log('=== ESTADÍSTICAS RENDERIZADAS ===');
}

// Función para crear gráfico de pastel
function createPieChart(canvasId, labels, data, colors) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const total = data.reduce((sum, value) => sum + value, 0);
    
    let currentAngle = 0;
    
    data.forEach((value, index) => {
        const sliceAngle = (value / total) * 2 * Math.PI;
        
        ctx.beginPath();
        ctx.moveTo(150, 150);
        ctx.arc(150, 150, 100, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = colors[index % colors.length];
        ctx.fill();
        
        // Agregar borde
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        currentAngle += sliceAngle;
    });
}

// Función para crear gráfico de barras
function createBarChart(canvasId, labels, data, colors, title) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const maxValue = Math.max(...data);
    const barWidth = 60;
    const barSpacing = 20;
    const startX = 50;
    const startY = 250;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar barras
    data.forEach((value, index) => {
        const barHeight = (value / maxValue) * 200;
        const x = startX + index * (barWidth + barSpacing);
        const y = startY - barHeight;
        
        // Barra
        ctx.fillStyle = colors[index % colors.length];
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Borde
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, barHeight);
        
        // Valor
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(value.toFixed(0), x + barWidth/2, y - 5);
        
        // Etiqueta
        ctx.fillText(labels[index], x + barWidth/2, startY + 15);
    });
}

// ===============================
// Funciones para ventanas modales del dashboard
// ===============================

// Función para abrir modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Cargar contenido según el tipo de modal
        switch(modalId) {
            case 'stock-modal':
                loadStockModalContent();
                break;
            case 'products-modal':
                loadProductsModalContent();
                break;
            case 'value-modal':
                loadValueModalContent();
                break;
            case 'comments-modal':
                loadCommentsModalContent();
                break;
        }
    }
}

// Función para cerrar modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('dashboard-modal')) {
        e.target.classList.remove('show');
        document.body.style.overflow = '';
    }
});

// Cerrar modal con ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.dashboard-modal.show');
        modals.forEach(modal => {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        });
    }
});

// Función para cargar contenido del modal de stock
function loadStockModalContent() {
    const modalBody = document.getElementById('stock-modal-body');
    if (!modalBody) return;
    
    const productos = JSON.parse(localStorage.getItem('modastyle_products')) || [];
    
    // Calcular estadísticas
    let totalStock = 0;
    let totalValue = 0;
    
    const stockData = productos.map(product => {
        let productStock = 0;
        let productValue = 0;
        let stockDetails = [];
        
        if (product.stock && typeof product.stock === 'object') {
            Object.entries(product.stock).forEach(([color, sizes]) => {
                if (typeof sizes === 'object') {
                    Object.entries(sizes).forEach(([size, quantity]) => {
                        productStock += quantity;
                        productValue += product.precio * quantity;
                        stockDetails.push({
                            color: color,
                            size: size,
                            quantity: quantity,
                            value: product.precio * quantity
                        });
                    });
                } else {
                    productStock += sizes || 0;
                    productValue += product.precio * (sizes || 0);
                    stockDetails.push({
                        color: color,
                        size: 'Única',
                        quantity: sizes || 0,
                        value: product.precio * (sizes || 0)
                    });
                }
            });
        } else {
            productStock = product.stock || 0;
            productValue = product.precio * (product.stock || 0);
            stockDetails.push({
                color: 'Sin especificar',
                size: 'Única',
                quantity: product.stock || 0,
                value: product.precio * (product.stock || 0)
            });
        }
        
        totalStock += productStock;
        totalValue += productValue;
        
        return {
            ...product,
            totalStock: productStock,
            totalValue: productValue,
            stockDetails: stockDetails
        };
    });
    
    // Ordenar por stock total (descendente)
    stockData.sort((a, b) => b.totalStock - a.totalStock);
    
    modalBody.innerHTML = `
        <div class="summary-cards">
            <div class="summary-card">
                <div class="value">${totalStock}</div>
                <div class="label">Total de Unidades</div>
            </div>
            <div class="summary-card">
                <div class="value">S/ ${totalValue.toFixed(2)}</div>
                <div class="label">Valor Total</div>
            </div>
            <div class="summary-card">
                <div class="value">${productos.length}</div>
                <div class="label">Productos</div>
            </div>
        </div>
        
        <table class="dashboard-table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Imagen</th>
                    <th>Precio</th>
                    <th>Stock Total</th>
                    <th>Valor</th>
                    <th>Detalle por Talla</th>
                </tr>
            </thead>
            <tbody>
                ${stockData.map(product => `
                    <tr>
                        <td>
                            <strong>${product.nombre}</strong><br>
                            <small>${product.tipo} - ${product.genero}</small>
                        </td>
                        <td>
                            <img src="${product.imagen}" alt="${product.nombre}" class="product-image" 
                                 onerror="this.src='https://via.placeholder.com/60x60?text=Sin+Imagen'">
                        </td>
                        <td>S/ ${product.precio.toFixed(2)}</td>
                        <td><strong>${product.totalStock}</strong></td>
                        <td class="total-value">S/ ${product.totalValue.toFixed(2)}</td>
                        <td>
                            <div class="stock-info">
                                ${product.stockDetails.map(detail => `
                                    <div class="stock-item">
                                        <div class="stock-color" style="background-color: ${getColorHex(detail.color)}"></div>
                                        <span>${detail.color} - ${detail.size}: ${detail.quantity}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Función para cargar contenido del modal de productos
function loadProductsModalContent() {
    const modalBody = document.getElementById('products-modal-body');
    if (!modalBody) return;
    
    const productos = JSON.parse(localStorage.getItem('modastyle_products')) || [];
    
    // Estadísticas por categoría
    const statsPorCategoria = {};
    productos.forEach(product => {
        if (!statsPorCategoria[product.tipo]) {
            statsPorCategoria[product.tipo] = {
                count: 0,
                totalValue: 0
            };
        }
        statsPorCategoria[product.tipo].count++;
        
        // Calcular valor por categoría
        if (product.stock && typeof product.stock === 'object') {
            const productStock = Object.values(product.stock).reduce((colorSum, sizes) => {
                if (typeof sizes === 'object') {
                    return colorSum + Object.values(sizes).reduce((sizeSum, quantity) => sizeSum + quantity, 0);
                }
                return colorSum + (sizes || 0);
            }, 0);
            statsPorCategoria[product.tipo].totalValue += product.precio * productStock;
        } else {
            statsPorCategoria[product.tipo].totalValue += product.precio * (product.stock || 0);
        }
    });
    
    modalBody.innerHTML = `
        <div class="summary-cards">
            <div class="summary-card">
                <div class="value">${productos.length}</div>
                <div class="label">Total Productos</div>
            </div>
            <div class="summary-card">
                <div class="value">${Object.keys(statsPorCategoria).length}</div>
                <div class="label">Categorías</div>
            </div>
            <div class="summary-card">
                <div class="value">${productos.filter(p => p.genero === 'Hombre').length}</div>
                <div class="label">Productos Hombre</div>
            </div>
            <div class="summary-card">
                <div class="value">${productos.filter(p => p.genero === 'Mujer').length}</div>
                <div class="label">Productos Mujer</div>
            </div>
        </div>
        
        <table class="dashboard-table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Imagen</th>
                    <th>Categoría</th>
                    <th>Género</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${productos.sort((a, b) => a.nombre.localeCompare(b.nombre)).map(product => {
                    // Calcular stock total del producto
                    let totalStock = 0;
                    if (product.stock && typeof product.stock === 'object') {
                        totalStock = Object.values(product.stock).reduce((colorSum, sizes) => {
                            if (typeof sizes === 'object') {
                                return colorSum + Object.values(sizes).reduce((sizeSum, quantity) => sizeSum + quantity, 0);
                            }
                            return colorSum + (sizes || 0);
                        }, 0);
                    } else {
                        totalStock = product.stock || 0;
                    }
                    
                    return `
                        <tr>
                            <td>
                                <strong>${product.nombre}</strong><br>
                                <small>${product.descripcion}</small>
                            </td>
                            <td>
                                <img src="${product.imagen}" alt="${product.nombre}" class="product-image" 
                                     onerror="this.src='https://via.placeholder.com/60x60?text=Sin+Imagen'">
                            </td>
                            <td>${product.tipo}</td>
                            <td>${product.genero}</td>
                            <td>S/ ${product.precio.toFixed(2)}</td>
                            <td><strong>${totalStock}</strong></td>
                            <td>
                                <button class="modal-btn modal-btn-primary" onclick="editProductFromModal(${product.id})" style="padding: 8px 12px; font-size: 12px;">
                                    <i class="fas fa-edit"></i> Editar
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

// Función para cargar contenido del modal de valor
function loadValueModalContent() {
    const modalBody = document.getElementById('value-modal-body');
    if (!modalBody) return;
    
    const productos = JSON.parse(localStorage.getItem('modastyle_products')) || [];
    
    // Calcular valor total y por categoría
    let valorTotal = 0;
    const valorPorCategoria = {};
    
    const valueData = productos.map(product => {
        let productStock = 0;
        let productValue = 0;
        
        if (product.stock && typeof product.stock === 'object') {
            productStock = Object.values(product.stock).reduce((colorSum, sizes) => {
                if (typeof sizes === 'object') {
                    return colorSum + Object.values(sizes).reduce((sizeSum, quantity) => sizeSum + quantity, 0);
                }
                return colorSum + (sizes || 0);
            }, 0);
        } else {
            productStock = product.stock || 0;
        }
        
        productValue = product.precio * productStock;
        valorTotal += productValue;
        
        // Agrupar por categoría
        if (!valorPorCategoria[product.tipo]) {
            valorPorCategoria[product.tipo] = 0;
        }
        valorPorCategoria[product.tipo] += productValue;
        
        return {
            ...product,
            totalStock: productStock,
            totalValue: productValue
        };
    });
    
    // Ordenar por valor (descendente)
    valueData.sort((a, b) => b.totalValue - a.totalValue);
    
    modalBody.innerHTML = `
        <div class="summary-cards">
            <div class="summary-card">
                <div class="value">S/ ${valorTotal.toFixed(2)}</div>
                <div class="label">Valor Total</div>
            </div>
            <div class="summary-card">
                <div class="value">${productos.length}</div>
                <div class="label">Productos</div>
            </div>
            <div class="summary-card">
                <div class="value">${Object.keys(valorPorCategoria).length}</div>
                <div class="label">Categorías</div>
            </div>
        </div>
        
        <h3 style="margin: 20px 0; color: var(--primary);">Valor por Categoría</h3>
        <div class="summary-cards">
            ${Object.entries(valorPorCategoria).map(([categoria, valor]) => `
                <div class="summary-card">
                    <div class="value">S/ ${valor.toFixed(2)}</div>
                    <div class="label">${categoria}</div>
                </div>
            `).join('')}
        </div>
        
        <table class="dashboard-table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Imagen</th>
                    <th>Categoría</th>
                    <th>Precio Unitario</th>
                    <th>Stock</th>
                    <th>Valor Total</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${valueData.map(product => `
                    <tr>
                        <td>
                            <strong>${product.nombre}</strong><br>
                            <small>${product.descripcion}</small>
                        </td>
                        <td>
                            <img src="${product.imagen}" alt="${product.nombre}" class="product-image" 
                                 onerror="this.src='https://via.placeholder.com/60x60?text=Sin+Imagen'">
                        </td>
                        <td>${product.tipo}</td>
                        <td>S/ ${product.precio.toFixed(2)}</td>
                        <td><strong>${product.totalStock}</strong></td>
                        <td class="total-value">S/ ${product.totalValue.toFixed(2)}</td>
                        <td>
                            <button class="modal-btn modal-btn-primary" onclick="editProductFromModal(${product.id})" style="padding: 8px 12px; font-size: 12px;">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Función para editar producto desde modal
function editProductFromModal(productId) {
    closeModal('products-modal');
    closeModal('value-modal');
    
    // Navegar a la sección de productos y editar
    setTimeout(() => {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(i => i.classList.remove('active'));
        
        const productosNavItem = document.querySelector('.nav-item[data-section="section-productos"]');
        if (productosNavItem) {
            productosNavItem.classList.add('active');
        }
        
        // Mostrar la sección de productos
        const sections = ['section-dashboard', 'section-productos', 'section-categorias', 'section-pedidos', 'section-estadisticas', 'section-ajustes'];
        sections.forEach(sectionId => {
            const sec = document.getElementById(sectionId);
            if (sec) sec.style.display = 'none';
        });
        
        const productSection = document.getElementById('section-productos');
        if (productSection) {
            productSection.style.display = '';
        }
        
        // Editar el producto
        editProduct(productId);
    }, 300);
}

// Función para agregar nuevo producto desde modal
function addNewProductFromModal() {
    closeModal('products-modal');
    
    setTimeout(() => {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(i => i.classList.remove('active'));
        
        const productosNavItem = document.querySelector('.nav-item[data-section="section-productos"]');
        if (productosNavItem) {
            productosNavItem.classList.add('active');
        }
        
        // Mostrar la sección de productos
        const sections = ['section-dashboard', 'section-productos', 'section-categorias', 'section-pedidos', 'section-estadisticas', 'section-ajustes'];
        sections.forEach(sectionId => {
            const sec = document.getElementById(sectionId);
            if (sec) sec.style.display = 'none';
        });
        
        const productSection = document.getElementById('section-productos');
        if (productSection) {
            productSection.style.display = '';
        }
        
        // Limpiar formulario para nuevo producto
        mover();
    }, 300);
}

// Funciones de exportación a PDF
function exportStockReport() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Obtener los mismos datos que se muestran en el modal de stock
        const productos = JSON.parse(localStorage.getItem('modastyle_products')) || [];
        
        // Calcular estadísticas exactamente como en loadStockModalContent
        let totalStock = 0;
        let totalValue = 0;
        
        const stockData = productos.map(product => {
            let productStock = 0;
            let productValue = 0;
            let stockDetails = [];
            
            if (product.stock && typeof product.stock === 'object') {
                Object.entries(product.stock).forEach(([color, sizes]) => {
                    if (typeof sizes === 'object') {
                        Object.entries(sizes).forEach(([size, quantity]) => {
                            productStock += quantity;
                            productValue += product.precio * quantity;
                            stockDetails.push({
                                color: color,
                                size: size,
                                quantity: quantity,
                                value: product.precio * quantity
                            });
                        });
                    } else {
                        productStock += sizes || 0;
                        productValue += product.precio * (sizes || 0);
                        stockDetails.push({
                            color: color,
                            size: 'Única',
                            quantity: sizes || 0,
                            value: product.precio * (sizes || 0)
                        });
                    }
                });
            } else {
                productStock = product.stock || 0;
                productValue = product.precio * (product.stock || 0);
                stockDetails.push({
                    color: 'Sin especificar',
                    size: 'Única',
                    quantity: product.stock || 0,
                    value: product.precio * (product.stock || 0)
                });
            }
            
            totalStock += productStock;
            totalValue += productValue;
            
            return {
                ...product,
                totalStock: productStock,
                totalValue: productValue,
                stockDetails: stockDetails
            };
        });
        
        // Ordenar por stock total (descendente) - igual que en el modal
        stockData.sort((a, b) => b.totalStock - a.totalStock);
        
        // Título del documento
        doc.setFontSize(20);
        doc.text('Reporte de Stock Total', 105, 20, { align: 'center' });
        
        // Fecha del reporte
        doc.setFontSize(12);
        const fecha = new Date().toLocaleDateString('es-ES');
        doc.text(`Fecha: ${fecha}`, 20, 35);
        
        // Tabla principal ordenada por stock (solo la información de la tabla)
        const tableData = stockData.map(product => {
            // Generar detalle por talla basado en stockDetails
            let detallePorTalla = '';
            if (product.stockDetails.length > 0) {
                detallePorTalla = product.stockDetails.map(detail => 
                    `${detail.color} - ${detail.size}: ${detail.quantity}`
                ).join('\n');
            }
            
            return [
                product.nombre,
                product.tipo || 'Sin categoría',
                product.genero || 'No especificado',
                product.totalStock,
                `S/ ${product.precio.toFixed(2)}`,
                `S/ ${product.totalValue.toFixed(2)}`,
                detallePorTalla || 'Sin especificar'
            ];
        });
        
        doc.autoTable({
            startY: 50,
            head: [['Producto', 'Categoría', 'Género', 'Stock Total', 'Precio Unit.', 'Valor Total', 'Detalle por Talla']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [108, 99, 255] },
            styles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 35 },
                1: { cellWidth: 25 },
                2: { cellWidth: 20 },
                3: { cellWidth: 20 },
                4: { cellWidth: 20 },
                5: { cellWidth: 25 },
                6: { cellWidth: 45 }
            }
        });
        
        // Guardar el PDF
        doc.save(`Reporte_Stock_${fecha.replace(/\//g, '-')}.pdf`);
        showNotification('Reporte de stock exportado exitosamente', 'success');
        
    } catch (error) {
        console.error('Error al exportar reporte de stock:', error);
        showNotification('Error al exportar el reporte', 'error');
    }
}

function exportValueReport() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Obtener los mismos datos que se muestran en el modal de valor
        const productos = JSON.parse(localStorage.getItem('modastyle_products')) || [];
        
        // Calcular valor total y por categoría exactamente como en loadValueModalContent
        let valorTotal = 0;
        const valorPorCategoria = {};
        
        const valueData = productos.map(product => {
            let productStock = 0;
            let productValue = 0;
            
            if (product.stock && typeof product.stock === 'object') {
                productStock = Object.values(product.stock).reduce((colorSum, sizes) => {
                    if (typeof sizes === 'object') {
                        return colorSum + Object.values(sizes).reduce((sizeSum, quantity) => sizeSum + quantity, 0);
                    }
                    return colorSum + (sizes || 0);
                }, 0);
            } else {
                productStock = product.stock || 0;
            }
            
            productValue = product.precio * productStock;
            valorTotal += productValue;
            
            // Agrupar por categoría
            if (!valorPorCategoria[product.tipo]) {
                valorPorCategoria[product.tipo] = 0;
            }
            valorPorCategoria[product.tipo] += productValue;
            
            return {
                ...product,
                totalStock: productStock,
                totalValue: productValue
            };
        });
        
        // Ordenar por valor (descendente) - igual que en el modal
        valueData.sort((a, b) => b.totalValue - a.totalValue);
        
        // Título del documento
        doc.setFontSize(20);
        doc.text('Reporte de Valor del Inventario', 105, 20, { align: 'center' });
        
        // Fecha del reporte
        doc.setFontSize(12);
        const fecha = new Date().toLocaleDateString('es-ES');
        doc.text(`Fecha: ${fecha}`, 20, 35);
        
        // Resumen general (igual que en el modal)
        doc.setFontSize(14);
        doc.text('Resumen General:', 20, 50);
        
        doc.setFontSize(12);
        doc.text(`• Valor total: S/ ${valorTotal.toFixed(2)}`, 25, 65);
        doc.text(`• Total de productos: ${productos.length}`, 25, 75);
        doc.text(`• Categorías: ${Object.keys(valorPorCategoria).length}`, 25, 85);
        
        // Tabla principal ordenada por valor (igual que en el modal)
        const tableData = valueData.map(product => [
            product.nombre,
            product.tipo || 'Sin categoría',
            `S/ ${product.precio.toFixed(2)}`,
            product.totalStock,
            `S/ ${product.totalValue.toFixed(2)}`
        ]);
        
        doc.autoTable({
            startY: 100,
            head: [['Producto', 'Categoría', 'Precio Unitario', 'Stock', 'Valor Total']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [108, 99, 255] },
            styles: { fontSize: 9 },
            columnStyles: {
                0: { cellWidth: 45 },
                1: { cellWidth: 30 },
                2: { cellWidth: 30 },
                3: { cellWidth: 25 },
                4: { cellWidth: 30 }
            }
        });
        
        // Agregar página con valor por categoría (igual que en el modal)
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Valor por Categoría', 105, 20, { align: 'center' });
        
        const categoriaData = Object.entries(valorPorCategoria).map(([categoria, valor]) => [
            categoria,
            `S/ ${valor.toFixed(2)}`
        ]);
        
        doc.autoTable({
            startY: 35,
            head: [['Categoría', 'Valor Total']],
            body: categoriaData,
            theme: 'grid',
            headStyles: { fillColor: [76, 175, 80] },
            styles: { fontSize: 10 },
            columnStyles: {
                0: { cellWidth: 80 },
                1: { cellWidth: 80 }
            }
        });
        
        // Guardar el PDF
        doc.save(`Reporte_Valor_Inventario_${fecha.replace(/\//g, '-')}.pdf`);
        showNotification('Reporte de valor exportado exitosamente', 'success');
        
    } catch (error) {
        console.error('Error al exportar reporte de valor:', error);
        showNotification('Error al exportar el reporte', 'error');
    }
}

function exportProductsReport() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Obtener los mismos datos que se muestran en el modal de productos
        const productos = JSON.parse(localStorage.getItem('modastyle_products')) || [];
        
        // Calcular estadísticas exactamente como en loadProductsModalContent
        const statsPorCategoria = {};
        productos.forEach(product => {
            if (!statsPorCategoria[product.tipo]) {
                statsPorCategoria[product.tipo] = {
                    count: 0,
                    totalValue: 0
                };
            }
            statsPorCategoria[product.tipo].count++;
            
            // Calcular valor por categoría
            if (product.stock && typeof product.stock === 'object') {
                const productStock = Object.values(product.stock).reduce((colorSum, sizes) => {
                    if (typeof sizes === 'object') {
                        return colorSum + Object.values(sizes).reduce((sizeSum, quantity) => sizeSum + quantity, 0);
                    }
                    return colorSum + (sizes || 0);
                }, 0);
                statsPorCategoria[product.tipo].totalValue += product.precio * productStock;
            } else {
                statsPorCategoria[product.tipo].totalValue += product.precio * (product.stock || 0);
            }
        });
        
        // Título del documento
        doc.setFontSize(20);
        doc.text('Reporte de Productos', 105, 20, { align: 'center' });
        
        // Fecha del reporte
        doc.setFontSize(12);
        const fecha = new Date().toLocaleDateString('es-ES');
        doc.text(`Fecha: ${fecha}`, 20, 35);
        
        // Resumen general (igual que en el modal)
        doc.setFontSize(14);
        doc.text('Resumen General:', 20, 50);
        
        doc.setFontSize(12);
        doc.text(`• Total de productos: ${productos.length}`, 25, 65);
        doc.text(`• Categorías: ${Object.keys(statsPorCategoria).length}`, 25, 75);
        doc.text(`• Productos Hombre: ${productos.filter(p => p.genero === 'Hombre').length}`, 25, 85);
        doc.text(`• Productos Mujer: ${productos.filter(p => p.genero === 'Mujer').length}`, 25, 95);
        
        // Ordenar productos por nombre (alfabético) para consistencia
        const productosOrdenados = [...productos].sort((a, b) => a.nombre.localeCompare(b.nombre));
        
        // Tabla principal de productos (igual que en el modal)
        const tableData = productosOrdenados.map(product => {
            // Calcular stock total del producto
            let totalStock = 0;
            if (product.stock && typeof product.stock === 'object') {
                totalStock = Object.values(product.stock).reduce((colorSum, sizes) => {
                    if (typeof sizes === 'object') {
                        return colorSum + Object.values(sizes).reduce((sizeSum, quantity) => sizeSum + quantity, 0);
                    }
                    return colorSum + (sizes || 0);
                }, 0);
            } else {
                totalStock = product.stock || 0;
            }
            
            return [
                product.nombre,
                product.tipo || 'Sin categoría',
                product.genero || 'No especificado',
                `S/ ${product.precio.toFixed(2)}`,
                totalStock.toString(),
                product.descripcion || 'Sin descripción'
            ];
        });
        
        doc.autoTable({
            startY: 110,
            head: [['Producto', 'Categoría', 'Género', 'Precio', 'Stock', 'Descripción']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [108, 99, 255] },
            styles: { fontSize: 9 },
            columnStyles: {
                0: { cellWidth: 40 },
                1: { cellWidth: 30 },
                2: { cellWidth: 25 },
                3: { cellWidth: 25 },
                4: { cellWidth: 20 },
                5: { cellWidth: 40 }
            }
        });
        
        // Agregar página con estadísticas por categoría
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Estadísticas por Categoría', 105, 20, { align: 'center' });
        
        const categoriaData = Object.entries(statsPorCategoria).map(([categoria, stats]) => [
            categoria,
            stats.count.toString(),
            `S/ ${stats.totalValue.toFixed(2)}`
        ]);
        
        doc.autoTable({
            startY: 35,
            head: [['Categoría', 'Cantidad', 'Valor Total']],
            body: categoriaData,
            theme: 'grid',
            headStyles: { fillColor: [76, 175, 80] },
            styles: { fontSize: 10 },
            columnStyles: {
                0: { cellWidth: 60 },
                1: { cellWidth: 40 },
                2: { cellWidth: 60 }
            }
        });
        
        // Guardar el PDF
        doc.save(`Reporte_Productos_${fecha.replace(/\//g, '-')}.pdf`);
        showNotification('Reporte de productos exportado exitosamente', 'success');
        
    } catch (error) {
        console.error('Error al exportar reporte de productos:', error);
        showNotification('Error al exportar el reporte', 'error');
    }
}

function exportPedidosReport(pedidosFiltrados, filtro, fechaInicio, fechaFin) {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Título del documento
        doc.setFontSize(20);
        doc.text('Reporte de Pedidos', 105, 20, { align: 'center' });
        
        // Fecha del reporte
        doc.setFontSize(12);
        const fecha = new Date().toLocaleDateString('es-ES');
        doc.text(`Fecha: ${fecha}`, 20, 35);
        
        // Ordenar pedidos por fecha (más recientes primero) - igual que en renderPedidos
        const pedidosOrdenados = [...pedidosFiltrados].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        // Tabla principal de pedidos (solo la información de la tabla)
        const tableData = pedidosOrdenados.map(pedido => {
            const fechaObj = new Date(pedido.fecha);
            const fechaLegible = fechaObj.toLocaleDateString('es-ES');
            const horaLegible = fechaObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            
            // Contar productos
            const totalProductos = pedido.productos ? pedido.productos.reduce((sum, prod) => sum + prod.cantidad, 0) : 0;
            
            // Generar especificación automática basada en los productos del pedido
            let especificacionText = '';
            if (pedido.productos && pedido.productos.length > 0) {
                especificacionText = pedido.productos.map(prod => {
                    let detalles = `${prod.nombre}`;
                    if (prod.talla) detalles += ` - Talla: ${prod.talla}`;
                    if (prod.color) detalles += ` - Color: ${prod.color}`;
                    if (prod.cantidad) detalles += ` (x${prod.cantidad})`;
                    return detalles;
                }).join('\n');
            }
            
            return [
                fechaLegible + ' ' + horaLegible,
                pedido.cliente ? pedido.cliente.nombre : '-',
                pedido.cliente ? pedido.cliente.telefono : (pedido.telefono || '-'),
                totalProductos.toString(),
                `S/ ${pedido.total.toFixed(2)}`,
                pedido.estado || 'pendiente',
                especificacionText || 'Sin especificaciones'
            ];
        });
        
        doc.autoTable({
            startY: 50,
            head: [['Fecha', 'Cliente', 'Teléfono', 'Cant. Productos', 'Total', 'Estado', 'Especificación']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [108, 99, 255] },
            styles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 25 },
                2: { cellWidth: 20 },
                3: { cellWidth: 15 },
                4: { cellWidth: 15 },
                5: { cellWidth: 15 },
                6: { cellWidth: 45 }
            }
        });
        
        // Guardar el PDF
        const nombreArchivo = `Reporte_Pedidos_${fecha.replace(/\//g, '-')}.pdf`;
        doc.save(nombreArchivo);
        showNotification('Reporte de pedidos exportado exitosamente', 'success');
        
    } catch (error) {
        console.error('Error al exportar reporte de pedidos:', error);
        showNotification('Error al exportar el reporte', 'error');
    }
}



function setupSidebarResponsive() {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    if (sidebar && toggleBtn) {
        toggleBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            sidebar.classList.toggle('open');
        });
        // Cerrar sidebar al hacer click fuera en móvil
        document.addEventListener('click', function (e) {
            if (
                window.innerWidth <= 900 &&
                sidebar.classList.contains('open') &&
                !sidebar.contains(e.target) &&
                e.target !== toggleBtn
            ) {
                sidebar.classList.remove('open');
            }
        });
    }
}

setupSidebarResponsive();

// ===============================
// Funciones para manejar categorías
// ===============================

// Función para cargar categorías
function loadCategorias() {
    console.log('=== CARGANDO CATEGORÍAS ===');
    try {
        const savedCategorias = localStorage.getItem('modastyle_categorias');
        console.log('Categorías guardadas en localStorage:', savedCategorias);
        
        if (savedCategorias) {
            window.categorias = JSON.parse(savedCategorias);
            console.log('Categorías cargadas desde localStorage:', window.categorias);
        } else {
            console.log('No hay categorías guardadas, creando categorías por defecto...');
            // Categorías por defecto
            window.categorias = [
                {
                    id: 1,
                    nombre: 'Polos',
                    descripcion: 'Polos y camisetas básicas',
                    icono: 'fas fa-tshirt',
                    color: '#6C63FF',
                    genero: 'Unisex'
                },
                {
                    id: 2,
                    nombre: 'Camisas',
                    descripcion: 'Camisas formales y casuales',
                    icono: 'fas fa-user-tie',
                    color: '#4CAF50',
                    genero: 'Hombre'
                },
                {
                    id: 3,
                    nombre: 'Poleras',
                    descripcion: 'Poleras y sweaters',
                    icono: 'fas fa-tshirt',
                    color: '#FF6584',
                    genero: 'Unisex'
                }
            ];
            saveCategorias();
            console.log('Categorías por defecto creadas y guardadas:', window.categorias);
        }
        
        console.log('Renderizando categorías...');
        renderCategorias();
        console.log('Actualizando dropdown de productos...');
        updateProductTypeDropdown(); // Actualizar dropdown de productos
        console.log('=== FIN CARGAR CATEGORÍAS ===');
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        window.categorias = [];
        renderCategorias();
        updateProductTypeDropdown(); // Actualizar dropdown de productos
    }
}

// Guardar categorías
function saveCategorias() {
    try {
        console.log('=== GUARDANDO CATEGORÍAS ===');
        console.log('Categorías a guardar:', categorias);
        console.log('Número de categorías:', categorias.length);
        
        localStorage.setItem('modastyle_categorias', JSON.stringify(window.categorias));
        
        // Verificar que se guardó correctamente
        const savedData = localStorage.getItem('modastyle_categorias');
        console.log('Datos guardados en localStorage:', savedData);
        console.log('Verificación - categorías guardadas:', JSON.parse(savedData));
        
        // Actualizar el dropdown de tipos de productos
        updateProductTypeDropdown();
        
        // Disparar evento personalizado para notificar cambios
        window.dispatchEvent(new CustomEvent('categoriasActualizadas', {
            detail: { categorias: window.categorias }
        }));
        
        // Actualizar estadísticas si están visibles
        const estadisticasSection = document.getElementById('section-estadisticas');
        if (estadisticasSection && estadisticasSection.style.display !== 'none') {
            renderEstadisticas();
        }
        
        console.log('Evento categoriasActualizadas disparado con', window.categorias.length, 'categorías');
        console.log('=== FIN GUARDAR CATEGORÍAS ===');
    } catch (error) {
        console.error('Error al guardar categorías:', error);
        showNotification('Error al guardar categorías', 'error');
    }
}

// Actualizar el dropdown de tipos de productos con las categorías disponibles
function updateProductTypeDropdown() {
    const productTypeSelect = document.getElementById('product-type');
    if (!productTypeSelect) {
        console.log('Dropdown de tipo de producto no encontrado');
        return;
    }

    // Guardar la opción seleccionada actualmente
    const currentValue = productTypeSelect.value;
    
    // Limpiar opciones existentes (mantener la primera opción "Seleccione...")
    const firstOption = productTypeSelect.querySelector('option[value=""]');
    productTypeSelect.innerHTML = '';
    if (firstOption) {
        productTypeSelect.appendChild(firstOption);
    } else {
        // Crear la opción por defecto si no existe
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Seleccione...';
        productTypeSelect.appendChild(defaultOption);
    }

    // Categorías por defecto que siempre deben estar disponibles
    const categoriasPorDefecto = [
        { nombre: 'Polos', icono: 'fas fa-tshirt', color: '#6C63FF' },
        { nombre: 'Camisas', icono: 'fas fa-user-tie', color: '#4CAF50' },
        { nombre: 'Poleras', icono: 'fas fa-tshirt', color: '#FF6584' }
    ];

    // Combinar categorías por defecto con las categorías dinámicas
    const todasLasCategorias = [...categoriasPorDefecto];
    
    // Agregar categorías dinámicas que no sean las por defecto
    if (window.categorias && window.categorias.length > 0) {
        const categoriasNuevas = window.categorias.filter(categoria => 
            !categoriasPorDefecto.some(defecto => defecto.nombre === categoria.nombre)
        );
        todasLasCategorias.push(...categoriasNuevas);
    }

    // Agregar todas las categorías al dropdown
    todasLasCategorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.nombre;
        option.textContent = categoria.nombre;
        productTypeSelect.appendChild(option);
    });

    // Restaurar la selección anterior si aún existe
    if (currentValue && todasLasCategorias.some(c => c.nombre === currentValue)) {
        productTypeSelect.value = currentValue;
    }

    console.log('Dropdown de tipos de productos actualizado con', todasLasCategorias.length, 'categorías');
    console.log('Categorías disponibles:', todasLasCategorias.map(c => c.nombre));
    console.log('Categorías por defecto incluidas:', categoriasPorDefecto.map(c => c.nombre));
    console.log('Categorías dinámicas incluidas:', window.categorias ? window.categorias.map(c => c.nombre) : []);
}

// Renderizar lista de categorías
function renderCategorias() {
    console.log('=== RENDERIZANDO CATEGORÍAS ===');
    const container = document.getElementById('category-list');
    console.log('Contenedor de categorías encontrado:', container);
    
    if (!container) {
        console.error('Contenedor de categorías no encontrado');
        return;
    }

    container.innerHTML = '';
    console.log('Categorías a renderizar:', window.categorias);

    if (window.categorias.length === 0) {
        console.log('No hay categorías para mostrar');
        container.innerHTML = '<div class="empty-message">No hay categorías registradas</div>';
        return;
    }

    window.categorias.forEach(categoria => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        categoryItem.innerHTML = `
            <div class="category-info">
                <div class="category-icon" style="color: ${categoria.color}">
                    <i class="${categoria.icono}"></i>
                </div>
                <div class="category-details">
                    <div class="category-name">${categoria.nombre}</div>
                    <div class="category-description">${categoria.descripcion || 'Sin descripción'}</div>
                    <div class="category-meta">Género: ${categoria.genero || 'Sin especificar'}</div>
                </div>
            </div>
            <div class="category-actions">
                <div class="action-btn edit-category-btn" data-id="${categoria.id}">
                    <i class="fas fa-edit"></i>
                </div>
                <div class="action-btn delete-category-btn" data-id="${categoria.id}">
                    <i class="fas fa-trash"></i>
                </div>
            </div>
        `;
        container.appendChild(categoryItem);
    });

    // Event listeners para editar categorías
    document.querySelectorAll('.edit-category-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const id = parseInt(this.getAttribute('data-id'));
            editCategoria(id);
        });
    });

    // Event listeners para eliminar categorías
    document.querySelectorAll('.delete-category-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const id = parseInt(this.getAttribute('data-id'));
            deleteCategoria(id);
        });
    });
}

// Editar categoría
function editCategoria(id) {
    const categoria = window.categorias.find(c => c.id === id);
    if (!categoria) return;

    document.getElementById('category-id').value = categoria.id;
    document.getElementById('category-name').value = categoria.nombre;
    document.getElementById('category-description').value = categoria.descripcion || '';
    document.getElementById('category-icon').value = categoria.icono;
    document.getElementById('category-color').value = categoria.color;
    document.getElementById('category-gender').value = categoria.genero || '';

    document.getElementById('category-form-title').textContent = "Editar Categoría";
    document.getElementById('category-form').scrollIntoView({ behavior: 'smooth' });

    showNotification('Categoría cargada para edición');
}

// Eliminar categoría
function deleteCategoria(id) {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;

    try {
        window.categorias = window.categorias.filter(c => c.id !== id);
        saveCategorias();
        renderCategorias();
        showNotification('Categoría eliminada exitosamente');
        
        // Verificar sesión después de eliminar
        setTimeout(() => {
            if (!verificarSesion()) {
                console.log('Sesión perdida después de eliminar categoría');
            }
        }, 300);
        
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        showNotification('Error al eliminar la categoría', 'error');
    }
}

// Generar nuevo ID para categorías
function generarNuevoIdCategoria() {
    return window.categorias.length > 0 ? Math.max(...window.categorias.map(c => c.id)) + 1 : 1;
}

// Configurar eventos de categorías
function setupCategoryEventListeners() {
    console.log('Configurando eventos de categorías...');
    
    // Buscar el botón de guardar categoría
    const saveButton = document.querySelector('#category-form button[type="submit"]');
    if (saveButton) {
        console.log('Botón de guardar categoría encontrado');
        
        // Remover event listeners previos
        const newButton = saveButton.cloneNode(true);
        saveButton.parentNode.replaceChild(newButton, saveButton);
        
        // Agregar event listener al botón
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botón de guardar categoría clickeado');
            
            // Obtener datos del formulario
            const categoryId = document.getElementById('category-id').value;
            const categoryName = document.getElementById('category-name').value;
            const categoryDescription = document.getElementById('category-description').value;
            const categoryIcon = document.getElementById('category-icon').value;
            const categoryColor = document.getElementById('category-color').value;
            const categoryGender = document.getElementById('category-gender').value;
            
            console.log('Datos del formulario:', {
                id: categoryId,
                nombre: categoryName,
                descripcion: categoryDescription,
                icono: categoryIcon,
                color: categoryColor,
                genero: categoryGender
            });

            // Validar campos requeridos
            if (!categoryName || !categoryIcon) {
                showNotification('Por favor, completa los campos requeridos (Nombre e Icono)', 'error');
                return false;
            }

            try {
                if (categoryId) {
                    // Editar categoría existente
                    const id = parseInt(categoryId);
                    const index = window.categorias.findIndex(c => c.id === id);
                    if (index !== -1) {
                        window.categorias[index] = { 
                            ...window.categorias[index], 
                            nombre: categoryName,
                            descripcion: categoryDescription,
                            icono: categoryIcon,
                            color: categoryColor,
                            genero: categoryGender
                        };
                        showNotification('Categoría actualizada exitosamente');
                    }
                } else {
                    // Agregar nueva categoría
                    const newCategory = {
                        id: generarNuevoIdCategoria(),
                        nombre: categoryName,
                        descripcion: categoryDescription,
                        icono: categoryIcon,
                        color: categoryColor,
                        genero: categoryGender
                    };
                    console.log('Nueva categoría a agregar:', newCategory);
                    window.categorias.push(newCategory);
                    showNotification('Categoría agregada exitosamente');
                }

                console.log('Categorías actuales:', window.categorias);
                saveCategorias();
                renderCategorias();
                
                // Limpiar formulario solo si es una nueva categoría
                if (!categoryId) {
                    const categoryForm = document.getElementById('category-form');
                    categoryForm.reset();
                    document.getElementById('category-id').value = '';
                    document.getElementById('category-color').value = '#6C63FF';
                }
                
                return false;
                
            } catch (error) {
                console.error('Error al guardar categoría:', error);
                showNotification('Error al guardar la categoría: ' + error.message, 'error');
                return false;
            }
        });
        
        console.log('Event listener agregado exitosamente al botón de guardar categoría');
    } else {
        console.error('Botón de guardar categoría no encontrado');
        console.log('Elementos disponibles:', document.querySelectorAll('button'));
        console.log('Formulario de categorías:', document.getElementById('category-form'));
    }
}

// Función para verificar el estado de la sesión
function verificarSesion() {
    const adminPanel = document.getElementById('admin-panel');
    const loginScreen = document.getElementById('login-screen');
    
    if (adminPanel && loginScreen) {
        if (adminPanel.classList.contains('hidden') && !loginScreen.classList.contains('hidden')) {
            // Sesión perdida, redirigir al login
            return false;
        }
        return true;
    }
    return false;
}

// Variables globales para almacenar colores e imágenes
let productColors = [];
let productImages = [];
let colorImageMappings = {}; // Nuevo: mapeo de colores a imágenes

// Configurar inputs dinámicos para colores e imágenes
function setupDynamicInputs() {
    // Variables globales para colores e imágenes
    window.productColors = window.productColors || [];
    window.colorImageMappings = window.colorImageMappings || {};
    window.productImages = window.productImages || [];
    window.productStock = window.productStock || {}; // Stock por color

    // Configurar botón de agregar color
    const addColorBtn = document.getElementById('add-color-btn');
    const colorInput = document.getElementById('product-colors');
    const colorsList = document.getElementById('colors-list');

            if (addColorBtn && colorInput && colorsList) {
        addColorBtn.addEventListener('click', function() {
            const color = colorInput.value.trim();
            if (color && !window.productColors.includes(color)) {
                window.productColors.push(color);
                renderColors();
                colorInput.value = '';
                colorInput.placeholder = 'Escribe otro color...';
                colorInput.focus();
                showNotification(`Color "${color}" agregado exitosamente`);
            } else if (!color) {
                showNotification('Por favor, escribe un nombre de color', 'error');
                colorInput.focus();
            } else {
                showNotification('Este color ya existe', 'error');
                colorInput.focus();
            }
        });

        // Permitir agregar color con Enter
        colorInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addColorBtn.click();
            }
        });
    }

    // Configurar sistema de stock por color
    const stockColorSelector = document.getElementById('stock-color-selector');
    const stockQuantityInput = document.getElementById('stock-quantity');
    const addStockBtn = document.getElementById('add-stock-btn');
    const stockList = document.getElementById('stock-list');

    if (stockColorSelector && stockQuantityInput && addStockBtn && stockList) {
        addStockBtn.addEventListener('click', function() {
            const selectedColor = stockColorSelector.value;
            const selectedSize = document.getElementById('stock-size-selector').value;
            const quantity = parseInt(stockQuantityInput.value);
            
            if (selectedColor && selectedSize && quantity > 0) {
                // Inicializar el color si no existe
                if (!window.productStock[selectedColor]) {
                    window.productStock[selectedColor] = {};
                }
                
                // Agregar o actualizar stock para la talla específica
                window.productStock[selectedColor][selectedSize] = quantity;
                
                renderStock();
                stockQuantityInput.value = '';
                stockColorSelector.value = '';
                document.getElementById('stock-size-selector').value = '';
                showNotification(`Stock agregado: ${quantity} unidades de ${selectedColor} talla ${selectedSize}`);
            } else {
                showNotification('Por favor, selecciona un color, talla y agrega una cantidad válida', 'error');
            }
        });

        // Permitir agregar con Enter
        stockQuantityInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addStockBtn.click();
            }
        });

        // Actualizar selector de tallas cuando se cambie el campo de tallas
        const productSizesInput = document.getElementById('product-sizes');
        if (productSizesInput) {
            productSizesInput.addEventListener('input', function() {
                updateStockSizeSelector();
            });
        }
    }

    // Configurar sistema de mapeo color-imagen
    const colorSelector = document.getElementById('color-selector');
    const colorImageUrlInput = document.getElementById('color-image-url');
    const addColorImageBtn = document.getElementById('add-color-image-btn');
    const colorImageMappingsContainer = document.getElementById('color-image-mappings');

    if (colorSelector && colorImageUrlInput && addColorImageBtn && colorImageMappingsContainer) {
        addColorImageBtn.addEventListener('click', function() {
            const selectedColor = colorSelector.value;
            const imageUrl = colorImageUrlInput.value.trim();
            
            if (selectedColor && imageUrl) {
                // Verificar que la imagen no esté ya asignada a otro color
                const existingColor = Object.keys(window.colorImageMappings).find(color => 
                    window.colorImageMappings[color] === imageUrl
                );
                
                if (existingColor && existingColor !== selectedColor) {
                    showNotification(`Esta imagen ya está asignada al color ${existingColor}`, 'error');
                    return;
                }
                
                // Validar la URL de la imagen
                validateImageUrl(imageUrl).then(result => {
                    if (result.valid) {
                        window.colorImageMappings[selectedColor] = imageUrl;
                        
                        // Solo agregar a productImages si no existe
                        if (!window.productImages.includes(imageUrl)) {
                            window.productImages.push(imageUrl);
                        }
                        
                        cleanDuplicateImages();
                        renderColorImageMappings();
                        renderImages();
                        colorImageUrlInput.value = '';
                        colorSelector.value = '';
                        showNotification(`Imagen agregada para el color ${selectedColor}`);
                    } else {
                        showNotification(`Error: ${result.error}`, 'error');
                    }
                });
            } else {
                showNotification('Por favor, selecciona un color y agrega una URL de imagen', 'error');
            }
        });

        // Permitir agregar con Enter
        colorImageUrlInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addColorImageBtn.click();
            }
        });
    }



    // Función para renderizar colores
    window.renderColors = function() {
        if (!colorsList) return;
        
        colorsList.innerHTML = '';
        window.productColors.forEach((color, index) => {
            const colorTag = document.createElement('div');
            colorTag.className = 'color-tag';
            const isWhite = color.toLowerCase() === 'blanco' || color.toLowerCase() === 'white';
            const borderStyle = isWhite ? 'border: 1px solid #ccc;' : '';
            colorTag.innerHTML = `
                <span>${color}</span>
                <div class="color-preview" style="background-color: ${getColorHex(color)}; ${borderStyle}"></div>
                <button type="button" class="remove-btn" data-index="${index}" title="Eliminar color">
                    <i class="fas fa-times"></i>
                </button>
            `;
            colorsList.appendChild(colorTag);
        });

        // Agregar event listeners para los botones de eliminar
        colorsList.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                console.log('Botón de eliminar color clickeado, índice:', index);
                
                // Eliminar color directamente
                if (index >= 0 && index < window.productColors.length) {
                    const removedColor = window.productColors[index];
                    window.productColors.splice(index, 1);
                    
                    // Remover mapeo de imagen si existe
                    if (window.colorImageMappings[removedColor]) {
                        delete window.colorImageMappings[removedColor];
                    }
                    
                    // Remover stock si existe
                    if (window.productStock[removedColor]) {
                        delete window.productStock[removedColor];
                    }
                    
                    // Actualizar interfaz
                    renderColors();
                    renderColorImageMappings();
                    renderStock();
                    updateColorSelector();
                    updateStockColorSelector();
                    
                    showNotification(`Color "${removedColor}" eliminado`);
                }
            });
        });

        // Actualizar el selector de colores
        updateColorSelector();
        updateStockColorSelector();
    };

    // Función para renderizar stock por color y talla
    window.renderStock = function() {
        if (!stockList) return;
        
        stockList.innerHTML = '';
        Object.entries(window.productStock).forEach(([color, sizes]) => {
            const stockTag = document.createElement('div');
            stockTag.className = 'stock-tag';
            
            let sizesHtml = '';
            Object.entries(sizes).forEach(([size, quantity]) => {
                sizesHtml += `
                    <div class="size-stock-item">
                        <span class="stock-size">${size}</span>
                        <span class="stock-quantity">${quantity}</span>
                        <button type="button" class="remove-size-stock-btn" data-color="${color}" data-size="${size}" title="Eliminar stock">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            });
            
            stockTag.innerHTML = `
                <div class="stock-color-header">${color}</div>
                <div class="stock-sizes">
                    ${sizesHtml}
                </div>
                <button type="button" class="remove-color-stock-btn" data-color="${color}" title="Eliminar todo el stock del color">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            stockList.appendChild(stockTag);
        });

        // Event listeners para botones de eliminar stock por talla
        stockList.querySelectorAll('.remove-size-stock-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const color = this.getAttribute('data-color');
                const size = this.getAttribute('data-size');
                removeSizeStock(color, size);
            });
        });

        // Event listeners para botones de eliminar todo el stock del color
        stockList.querySelectorAll('.remove-color-stock-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const color = this.getAttribute('data-color');
                removeStock(color);
            });
        });
    };

    // Función para eliminar stock por talla (global)
    window.removeSizeStock = function(color, size) {
        if (window.productStock[color] && window.productStock[color][size]) {
            const quantity = window.productStock[color][size];
            delete window.productStock[color][size];
            
            // Si no quedan tallas para este color, eliminar el color completo
            if (Object.keys(window.productStock[color]).length === 0) {
                delete window.productStock[color];
            }
            
            renderStock();
            updateStockColorSelector();
            updateStockSizeSelector();
            showNotification(`Stock eliminado: ${quantity} unidades de ${color} talla ${size}`);
        }
    };

    // Función para eliminar todo el stock de un color (global)
    window.removeStock = function(color) {
        if (window.productStock[color]) {
            delete window.productStock[color];
            renderStock();
            updateStockColorSelector();
            updateStockSizeSelector();
            showNotification(`Stock eliminado para el color ${color}`);
        }
    };

    // Función para actualizar el selector de colores para stock
    window.updateStockColorSelector = function() {
        if (stockColorSelector) {
            stockColorSelector.innerHTML = '<option value="">Seleccionar color...</option>';
            window.productColors.forEach(color => {
                const option = document.createElement('option');
                option.value = color;
                option.textContent = color;
                stockColorSelector.appendChild(option);
            });
        }
    };

    // Función para actualizar el selector de tallas para stock
    window.updateStockSizeSelector = function() {
        const stockSizeSelector = document.getElementById('stock-size-selector');
        if (stockSizeSelector) {
            stockSizeSelector.innerHTML = '<option value="">Seleccionar talla...</option>';
            const sizesInput = document.getElementById('product-sizes');
            if (sizesInput && sizesInput.value) {
                const sizes = sizesInput.value.split(',').map(s => s.trim());
                sizes.forEach(size => {
                    const option = document.createElement('option');
                    option.value = size;
                    option.textContent = size;
                    stockSizeSelector.appendChild(option);
                });
            }
        }
    };

    // Función para eliminar color (global)
    window.removeColor = function(index) {
        console.log('=== ELIMINAR COLOR ===');
        console.log('Índice recibido:', index);
        console.log('Tipo de índice:', typeof index);
        console.log('Colores actuales:', window.productColors);
        console.log('Longitud de colores:', window.productColors.length);
        
        // Convertir a número si es string
        const numericIndex = parseInt(index);
        console.log('Índice numérico:', numericIndex);
        
        if (numericIndex >= 0 && numericIndex < window.productColors.length) {
            const removedColor = window.productColors[numericIndex];
            console.log('Eliminando color:', removedColor);
            
            // Eliminar el color del array
            window.productColors.splice(numericIndex, 1);
            console.log('Colores después de eliminar:', window.productColors);
            
            // Remover también el mapeo de imagen si existe
            if (window.colorImageMappings[removedColor]) {
                delete window.colorImageMappings[removedColor];
                console.log('Mapeo de imagen eliminado para:', removedColor);
            }
            
            // Remover también el stock si existe
            if (window.productStock[removedColor]) {
                delete window.productStock[removedColor];
                console.log('Stock eliminado para:', removedColor);
            }
            
            // Actualizar la interfaz
            renderColors();
            renderColorImageMappings();
            renderStock();
            updateColorSelector();
            updateStockColorSelector();
            
            showNotification(`Color "${removedColor}" eliminado`);
            console.log('Color eliminado exitosamente');
        } else {
            console.error('Índice inválido para eliminar color:', numericIndex);
            console.error('Rango válido: 0 a', window.productColors.length - 1);
            showNotification('Error al eliminar color: índice inválido', 'error');
        }
        console.log('=== FIN ELIMINAR COLOR ===');
    };

    // Función para actualizar el selector de colores
    window.updateColorSelector = function() {
        if (colorSelector) {
            colorSelector.innerHTML = '<option value="">Seleccionar color...</option>';
            window.productColors.forEach(color => {
                if (!window.colorImageMappings[color]) { // Solo mostrar colores sin imagen asignada
                    const option = document.createElement('option');
                    option.value = color;
                    option.textContent = color;
                    colorSelector.appendChild(option);
                }
            });
        }
    };

    // Función para renderizar mapeos color-imagen
    window.renderColorImageMappings = function() {
        if (colorImageMappingsContainer) {
            colorImageMappingsContainer.innerHTML = '';
            
            Object.entries(window.colorImageMappings).forEach(([color, imageUrl]) => {
                const mappingItem = document.createElement('div');
                mappingItem.className = 'color-image-mapping-item';
                mappingItem.innerHTML = `
                    <img src="${imageUrl}" alt="${color}" class="color-image-preview" 
                         onerror="this.src='https://via.placeholder.com/100x100?text=Error'; this.style.border='2px solid #ff4444';"
                         onload="this.style.border='2px solid #4CAF50';">
                    <div class="color-image-info">
                        <div class="color-image-color">${color}</div>
                        <div class="color-image-url">${imageUrl}</div>
                    </div>
                    <div class="color-image-actions">
                        <button type="button" class="edit-btn" data-color="${color}">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button type="button" class="remove-btn" data-color="${color}">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                `;
                colorImageMappingsContainer.appendChild(mappingItem);
            });

            // Event listeners para botones de eliminar mapeo
            colorImageMappingsContainer.querySelectorAll('.remove-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const color = this.getAttribute('data-color');
                    removeColorImageMapping(color);
                });
            });
        }
    };

    // Función para eliminar mapeo color-imagen (global)
    window.removeColorImageMapping = function(color) {
        if (window.colorImageMappings[color]) {
            const imageUrl = window.colorImageMappings[color];
            
            // Remover del mapeo
            delete window.colorImageMappings[color];
            
            // Remover de productImages si no está siendo usado por otro color
            const isUsedByOtherColor = Object.values(window.colorImageMappings).includes(imageUrl);
            if (!isUsedByOtherColor) {
                const imageIndex = window.productImages.indexOf(imageUrl);
                if (imageIndex > -1) {
                    window.productImages.splice(imageIndex, 1);
                }
            }
            
            renderColorImageMappings();
            renderImages();
            updateColorSelector();
            showNotification(`Imagen eliminada para el color ${color}`);
        }
    };

    // Función para renderizar imágenes
    window.renderImages = function() {
        if (!imagesList) return;
        
        imagesList.innerHTML = '';
        
        // Filtrar imágenes duplicadas
        const uniqueImages = [...new Set(window.productImages)];
        
        uniqueImages.forEach((imageUrl, index) => {
            const imageTag = document.createElement('div');
            imageTag.className = 'image-tag';
            imageTag.innerHTML = `
                <img src="${imageUrl}" alt="Preview" class="image-preview" onerror="this.src='https://via.placeholder.com/40x40?text=Error'; this.onerror=null;">
                <div class="image-info">
                    <span>Imagen ${index + 1}</span>
                    <span class="image-url">${imageUrl}</span>
                </div>
                <button type="button" class="remove-btn" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            imagesList.appendChild(imageTag);
        });

        // Event listeners para botones de eliminar
        imagesList.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                const imageUrl = uniqueImages[index];
                removeImage(imageUrl);
            });
        });
    };

    // Función para eliminar imagen (global)
    window.removeImage = function(imageUrl) {
        // Remover de productImages
        const imageIndex = window.productImages.indexOf(imageUrl);
        if (imageIndex > -1) {
            window.productImages.splice(imageIndex, 1);
        }
        
        // Remover del mapeo de colores si existe
        Object.keys(window.colorImageMappings).forEach(color => {
            if (window.colorImageMappings[color] === imageUrl) {
                delete window.colorImageMappings[color];
            }
        });
        
        renderImages();
        renderColorImageMappings();
        updateColorSelector();
        showNotification('Imagen eliminada');
    };

    // Función para limpiar duplicados en productImages
    function cleanDuplicateImages() {
        window.productImages = [...new Set(window.productImages)];
    }

    // Prevenir que los cambios en campos del formulario reinicien los datos dinámicos
    const formFields = ['product-name', 'product-price', 'product-description', 'product-image', 'product-type', 'product-gender', 'product-sizes', 'product-material'];
    formFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('change', function() {
                // No hacer nada especial, solo prevenir que se reinicien los datos dinámicos
                console.log(`Campo ${fieldId} cambiado, manteniendo datos dinámicos`);
            });
        }
    });

    // Validación de imagen principal en tiempo real
    const mainImageInput = document.getElementById('product-image');
    if (mainImageInput) {
        let validationTimeout;
        
        mainImageInput.addEventListener('input', function() {
            clearTimeout(validationTimeout);
            const url = this.value.trim();
            
            if (url) {
                // Mostrar indicador de carga
                this.style.borderColor = '#ffa500';
                this.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%23ffa500\' d=\'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z\'/%3E%3C/svg%3E")';
                this.style.backgroundRepeat = 'no-repeat';
                this.style.backgroundPosition = 'right 10px center';
                this.style.paddingRight = '40px';
                
                validationTimeout = setTimeout(async () => {
                    const validation = await validateImageUrl(url);
                    if (validation.valid) {
                        this.style.borderColor = '#4CAF50';
                        this.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%234CAF50\' d=\'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z\'/%3E%3C/svg%3E")';
                        showNotification(`✅ Imagen válida (${validation.width}x${validation.height})`, 'success');
                    } else {
                        this.style.borderColor = '#f44336';
                        this.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%23f44336\' d=\'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z\'/%3E%3C/svg%3E")';
                        showNotification(`❌ ${validation.error}`, 'error');
                    }
                }, 1000); // Esperar 1 segundo después de que el usuario deje de escribir
            } else {
                this.style.borderColor = '';
                this.style.backgroundImage = '';
                this.style.paddingRight = '';
            }
        });
    }

    // Función para obtener el hex de un color por nombre
    window.getColorHex = function(colorName) {
        const colorMap = {
            'negro': '#000000',
            'blanco': '#FFFFFF',
            'rojo': '#FF0000',
            'azul': '#0000FF',
            'verde': '#008000',
            'amarillo': '#FFFF00',
            'naranja': '#FFA500',
            'morado': '#800080',
            'rosa': '#FFC0CB',
            'gris': '#808080',
            'marrón': '#A52A2A',
            'beige': '#F5F5DC',
            'celeste': '#87CEEB',
            'turquesa': '#40E0D0',
            'violeta': '#EE82EE',
            'coral': '#FF7F50',
            'salmon': '#FA8072',
            'lavanda': '#E6E6FA',
            'menta': '#98FF98',
            'ocre': '#CC7722',
            'carmesí': '#DC143C',
            'índigo': '#4B0082',
            'magenta': '#FF00FF',
            'cian': '#00FFFF',
            'lima': '#32CD32',
            'oliva': '#808000',
            'teal': '#008080',
            'navy': '#000080',
            'plata': '#C0C0C0',
            'dorado': '#FFD700',
            'bronce': '#CD7F32',
            'cobre': '#B87333',
            'chocolate': '#D2691E',
            'tomate': '#FF6347',
            'orquídea': '#DA70D6',
            'sienna': '#A0522D',
            'peru': '#CD853F',
            'sandybrown': '#F4A460',
            'wheat': '#F5DEB3',
            'tan': '#D2B48C',
            'burlywood': '#DEB887',
            'rosybrown': '#BC8F8F',
            'moccasin': '#FFE4B5',
            'navajowhite': '#FFDEAD',
            'peachpuff': '#FFDAB9',
            'mistyrose': '#FFE4E1',
            'lavenderblush': '#FFF0F5',
            'seashell': '#FFF5EE',
            'oldlace': '#FDF5E6',
            'linen': '#FAF0E6',
            'antiquewhite': '#FAEBD7',
            'papayawhip': '#FFEFD5',
            'blanchedalmond': '#FFEBCD',
            'bisque': '#FFE4C4',
            'cornsilk': '#FFF8DC',
            'ivory': '#FFFFF0',
            'honeydew': '#F0FFF0',
            'mintcream': '#F5FFFA',
            'azure': '#F0FFFF',
            'aliceblue': '#F0F8FF',
            'ghostwhite': '#F8F8FF',
            'whitesmoke': '#F5F5F5',
            'snow': '#FFFAFA',
            'black': '#000000',
            'white': '#FFFFFF',
            'red': '#FF0000',
            'blue': '#0000FF',
            'green': '#008000',
            'yellow': '#FFFF00',
            'orange': '#FFA500',
            'purple': '#800080',
            'pink': '#FFC0CB',
            'gray': '#808080',
            'brown': '#A52A2A'
        };
        
        const normalizedColor = colorName.toLowerCase().trim();
        return colorMap[normalizedColor] || colorName; // Si no encuentra el color, devuelve el nombre original
    };

    // Funciones globales para el formulario de productos
    window.getProductColors = function() {
        return [...productColors];
    };

    window.getProductImages = function() {
        return [...productImages];
    };

    window.getColorImageMappings = function() {
        return {...colorImageMappings};
    };

    window.clearProductData = function() {
        productColors = [];
        productImages = [];
        colorImageMappings = {};
        renderColors();
        renderImages();
        renderColorImageMappings();
        updateColorSelector();
    };

    window.loadProductData = function(product) {
        console.log('Cargando datos del producto:', product);
        
        // Cargar colores
        if (product.colores && Array.isArray(product.colores)) {
            window.productColors = [...product.colores];
            console.log('Colores cargados:', window.productColors);
        } else if (product.colores && typeof product.colores === 'string') {
            window.productColors = product.colores.split(',').map(c => c.trim()).filter(c => c);
            console.log('Colores cargados desde string:', window.productColors);
        } else {
            window.productColors = [];
        }
        
        // Cargar imágenes
        if (product.imagenes && Array.isArray(product.imagenes)) {
            window.productImages = [...product.imagenes];
            console.log('Imágenes cargadas:', window.productImages);
        } else {
            window.productImages = [];
        }

        // Cargar mapeo color-imagen si existe
        if (product.colorImageMappings) {
            window.colorImageMappings = { ...product.colorImageMappings };
            console.log('Mapeo color-imagen cargado:', window.colorImageMappings);
        } else {
            window.colorImageMappings = {};
        }

        // Cargar stock por color y talla si existe
        if (product.stock && typeof product.stock === 'object') {
            window.productStock = { ...product.stock };
            console.log('Stock por color y talla cargado:', window.productStock);
        } else {
            window.productStock = {};
        }

        // Renderizar todo
        renderColors();
        renderImages();
        renderColorImageMappings();
        renderStock();
        updateColorSelector();
        updateStockColorSelector();
        updateStockSizeSelector();
        
        console.log('Datos del producto cargados completamente');
    };

    // Función para validar URLs de imágenes
    function validateImageUrl(url) {
        return new Promise((resolve) => {
            // Validar formato básico de URL
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                resolve({
                    valid: false,
                    error: 'La URL debe comenzar con http:// o https://'
                });
                return;
            }
            
            // Validar extensiones de imagen (más flexible)
            const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp', '.tiff'];
            const hasValidExtension = validExtensions.some(ext => 
                url.toLowerCase().includes(ext)
            );
            
            // Permitir URLs que no tengan extensión pero contengan palabras clave de imagen
            const imageKeywords = ['image', 'img', 'photo', 'picture', 'avatar', 'icon'];
            const hasImageKeyword = imageKeywords.some(keyword => 
                url.toLowerCase().includes(keyword)
            );
            
            if (!hasValidExtension && !hasImageKeyword && !url.includes('placeholder.com')) {
                resolve({ 
                    valid: false, 
                    error: 'La URL debe ser una imagen válida o contener palabras clave de imagen' 
                });
                return;
            }
            
            // Crear una imagen temporal para verificar que se puede cargar
            const img = new Image();
            const timeout = setTimeout(() => {
                resolve({
                    valid: false,
                    error: 'La imagen no se pudo cargar (timeout de 10 segundos)'
                });
            }, 10000); // 10 segundos de timeout

            img.onload = function() {
                clearTimeout(timeout);
                resolve({
                    valid: true,
                    error: null,
                    width: this.width,
                    height: this.height
                });
            };

            img.onerror = function() {
                clearTimeout(timeout);
                resolve({
                    valid: false,
                    error: 'No se pudo cargar la imagen. Verifica que la URL sea correcta y accesible.'
                });
            };

            img.src = url;
        });
    }


// Función para limpiar completamente el formulario (nuevo producto)
window.clearFormForNewProduct = function() {
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('form-title').textContent = "Agregar Nuevo Producto";
    
    // Limpiar datos dinámicos
    if (window.clearProductData) {
        window.clearProductData();
    }
    
    showNotification('Formulario limpio para nuevo producto');
};

// Configurar eventos para las tarjetas del dashboard
function setupDashboardCards() {
    console.log('=== CONFIGURANDO TARJETAS DEL DASHBOARD ===');
    const productsCard = document.getElementById('dashboard-products-card');
    const stockCard = document.getElementById('dashboard-stock-card');
    const valueCard = document.getElementById('dashboard-value-card');
    const commentsCard = document.getElementById('dashboard-comments-card');
    
    console.log('Tarjeta de productos encontrada:', productsCard);
    console.log('Tarjeta de stock encontrada:', stockCard);
    console.log('Tarjeta de valor encontrada:', valueCard);
    console.log('Tarjeta de comentarios encontrada:', commentsCard);
    
    if (productsCard) {
        productsCard.addEventListener('click', function() {
            openModal('products-modal');
        });
    }
    
    if (stockCard) {
        stockCard.addEventListener('click', function() {
            openModal('stock-modal');
        });
    }
    
    if (valueCard) {
        valueCard.addEventListener('click', function() {
            openModal('value-modal');
        });
    }
    
    if (commentsCard) {
        commentsCard.addEventListener('click', function() {
            console.log('Tarjeta de comentarios clickeada');
            openModal('comments-modal');
            loadCommentsModalContent();
        });
    }
    
    console.log('=== FIN CONFIGURAR TARJETAS DEL DASHBOARD ===');
}

// Mostrar dashboard principal
window.showDashboard = function() {
    document.getElementById('section-dashboard').style.display = '';
    document.getElementById('section-dashboard-products').style.display = 'none';
    document.getElementById('section-dashboard-stock').style.display = 'none';
    document.getElementById('section-dashboard-value').style.display = 'none';
};

// Mostrar detalles de productos
function showDashboardProducts() {
    document.getElementById('section-dashboard').style.display = 'none';
    document.getElementById('section-dashboard-products').style.display = '';
    
    const container = document.getElementById('products-detail-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (productos.length === 0) {
        container.innerHTML = '<div class="empty-message">No hay productos registrados</div>';
        return;
    }
    
    productos.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-detail-card';
        productCard.innerHTML = `
            <img src="${product.imagen}" class="product-detail-image" alt="${product.nombre}" 
                 onerror="this.src='https://via.placeholder.com/300x200?text=Sin+Imagen'">
            <div class="product-detail-info">
                <h4>${product.nombre}</h4>
                <p><strong>Tipo:</strong> ${product.tipo}</p>
                <p><strong>Género:</strong> ${product.genero}</p>
                <p><strong>Material:</strong> ${product.material}</p>
                <p><strong>Tallas:</strong> ${product.tallas.join(', ')}</p>
                <p><strong>Colores:</strong> ${product.colores ? product.colores.join(', ') : 'No especificados'}</p>
                <div class="product-detail-price">S/ ${product.precio.toFixed(2)}</div>
            </div>
        `;
        container.appendChild(productCard);
    });
}

// Mostrar detalles de stock
function showDashboardStock() {
    document.getElementById('section-dashboard').style.display = 'none';
    document.getElementById('section-dashboard-stock').style.display = '';
    
    const container = document.getElementById('stock-detail-table');
    if (!container) return;
    
    let totalStock = 0;
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Color</th>
                    <th>Cantidad</th>
                    <th>Total por Producto</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    productos.forEach(product => {
        let productTotal = 0;
        if (product.stock && typeof product.stock === 'object') {
            Object.entries(product.stock).forEach(([color, quantity]) => {
                html += `
                    <tr>
                        <td>${product.nombre}</td>
                        <td>${color}</td>
                        <td class="stock-quantity">${quantity}</td>
                        <td></td>
                    </tr>
                `;
                productTotal += quantity;
                totalStock += quantity;
            });
        }
        
        if (productTotal > 0) {
            html += `
                <tr style="background: #f8f9fa;">
                    <td><strong>${product.nombre}</strong></td>
                    <td colspan="2"><strong>Total del producto:</strong></td>
                    <td class="stock-quantity"><strong>${productTotal}</strong></td>
                </tr>
            `;
        }
    });
    
    html += `
            <tr class="total-row">
                <td colspan="3"><strong>STOCK TOTAL</strong></td>
                <td class="stock-quantity"><strong>${totalStock}</strong></td>
            </tr>
        </tbody>
    </table>
    `;
    
    container.innerHTML = html;
}

// Mostrar detalles de valor
function showDashboardValue() {
    document.getElementById('section-dashboard').style.display = 'none';
    document.getElementById('section-dashboard-value').style.display = '';
    
    const container = document.getElementById('value-detail-table');
    if (!container) return;
    
    let totalValue = 0;
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Precio Unitario</th>
                    <th>Stock Total</th>
                    <th>Valor Total</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    productos.forEach(product => {
        let productStock = 0;
        if (product.stock && typeof product.stock === 'object') {
            productStock = Object.values(product.stock).reduce((sum, quantity) => sum + quantity, 0);
        }
        
        const productValue = product.precio * productStock;
        totalValue += productValue;
        
        html += `
            <tr>
                <td>${product.nombre}</td>
                <td>S/ ${product.precio.toFixed(2)}</td>
                <td class="stock-quantity">${productStock}</td>
                <td class="value-amount">S/ ${productValue.toFixed(2)}</td>
            </tr>
        `;
    });
    
    html += `
            <tr class="total-row">
                <td colspan="3"><strong>VALOR TOTAL DEL INVENTARIO</strong></td>
                <td class="value-amount"><strong>S/ ${totalValue.toFixed(2)}</strong></td>
            </tr>
        </tbody>
    </table>
    `;
    
    container.innerHTML = html;
}

// Funciones globales para obtener los valores actuales
window.getProductColors = function() {
    return window.productColors;
};

window.getProductImages = function() {
    return window.productImages;
};

window.getColorImageMappings = function() {
    return window.colorImageMappings;
};

window.getProductStock = function() {
    return window.productStock;
};

// Función para limpiar los datos dinámicos
window.clearProductData = function() {
    window.productColors = [];
    window.productImages = [];
    window.colorImageMappings = {};
    window.productStock = {};
    renderColors();
    renderImages();
    renderColorImageMappings();
    renderStock();
    updateStockSizeSelector();
};

// Función para limpiar completamente el formulario para nuevo producto
window.clearFormForNewProduct = function() {
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('form-title').textContent = "Agregar Nuevo Producto";
    window.clearProductData();
};

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando administración...');
    setupEventListeners();
    setupSidebarResponsive();
    verificarSesion();
    console.log('Inicialización completada');
});

// ===============================
// Funciones para manejar comentarios
// ===============================

// Función para cargar comentarios desde localStorage
function loadComments() {
    console.log('=== CARGANDO COMENTARIOS ===');
    const commentsData = localStorage.getItem('modastyle_comentarios');
    console.log('Datos raw de localStorage:', commentsData);
    
    let comments = [];
    try {
        comments = JSON.parse(commentsData) || [];
        console.log('Comentarios parseados:', comments);
    } catch (error) {
        console.error('Error al parsear comentarios:', error);
        comments = [];
    }
    
    console.log('=== FIN CARGAR COMENTARIOS ===');
    return comments;
}

// Función para obtener comentarios de un producto específico
function getProductComments(productId) {
    const allComments = loadComments();
    return allComments.filter(comment => comment.productoId == productId);
}

// Función para obtener información del producto por ID
function getProductById(productId) {
    return productos.find(product => product.id == productId);
}

// Función para cargar el modal de comentarios
function loadCommentsModalContent() {
    console.log('=== CARGANDO CONTENIDO DEL MODAL DE COMENTARIOS ===');
    const modalBody = document.getElementById('comments-modal-body');
    console.log('Modal body encontrado:', modalBody);
    
    const allComments = loadComments();
    console.log('Comentarios para mostrar:', allComments);
    
    if (allComments.length === 0) {
        console.log('No hay comentarios, mostrando estado vacío');
        modalBody.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comments" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
                <h3>No hay comentarios aún</h3>
                <p>Los comentarios de los clientes aparecerán aquí cuando comiencen a calificar los productos.</p>
            </div>
        `;
        return;
    }
    
    // Agrupar comentarios por producto
    const commentsByProduct = {};
    allComments.forEach(comment => {
        if (!commentsByProduct[comment.productoId]) {
            commentsByProduct[comment.productoId] = [];
        }
        commentsByProduct[comment.productoId].push(comment);
    });
    
    let html = '<div class="comments-container">';
    
    Object.keys(commentsByProduct).forEach(productId => {
        const product = getProductById(productId);
        const productComments = commentsByProduct[productId];
        
        if (product) {
            const averageRating = productComments.reduce((sum, c) => sum + c.calificacion, 0) / productComments.length;
            
            html += `
                <div class="product-comments-section">
                    <div class="product-header">
                        <div class="product-info">
                            <img src="${product.imagen || 'https://via.placeholder.com/60x60?text=Sin+Imagen'}" 
                                 alt="${product.nombre}" 
                                 class="product-thumbnail"
                                 onerror="this.src='https://via.placeholder.com/60x60?text=Error'">
                            <div class="product-details">
                                <h4>${product.nombre}</h4>
                                <div class="product-rating">
                                    <div class="stars">
                                        ${generateStarsHTML(averageRating)}
                                    </div>
                                    <span class="rating-text">${averageRating.toFixed(1)} (${productComments.length} comentarios)</span>
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-danger btn-sm" onclick="deleteProductComments(${productId})">
                            <i class="fas fa-trash"></i> Eliminar todos
                        </button>
                    </div>
                    <div class="comments-list">
                        ${productComments.map(comment => `
                            <div class="comment-item">
                                <div class="comment-header">
                                    <div class="comment-user">
                                        <i class="fas fa-user-circle"></i>
                                        <span class="user-name">${comment.nombre}</span>
                                        <div class="comment-stars">
                                            ${generateStarsHTML(comment.calificacion)}
                                        </div>
                                    </div>
                                    <div class="comment-meta">
                                        <span class="comment-date">${formatCommentDate(comment.fecha)}</span>
                                        <button class="btn btn-danger btn-xs" onclick="deleteComment(${comment.id})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="comment-text">
                                    ${comment.comentario}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    });
    
    html += '</div>';
    modalBody.innerHTML = html;
}

// Función para generar HTML de estrellas
function generateStarsHTML(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            html += '<i class="fas fa-star active"></i>';
        } else if (i - rating < 1) {
            html += '<i class="fas fa-star-half-alt active"></i>';
        } else {
            html += '<i class="far fa-star"></i>';
        }
    }
    return html;
}

// Función para formatear fecha de comentario
function formatCommentDate(fechaISO) {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Función para eliminar un comentario específico
function deleteComment(commentId) {
    if (confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
        const allComments = loadComments();
        const updatedComments = allComments.filter(comment => comment.id !== commentId);
        localStorage.setItem('modastyle_comentarios', JSON.stringify(updatedComments));
        
        showNotification('Comentario eliminado exitosamente', 'success');
        loadCommentsModalContent();
        updateDashboardComments();
    }
}

// Función para eliminar todos los comentarios de un producto
function deleteProductComments(productId) {
    if (confirm('¿Estás seguro de que quieres eliminar todos los comentarios de este producto?')) {
        const allComments = loadComments();
        const updatedComments = allComments.filter(comment => comment.productoId != productId);
        localStorage.setItem('modastyle_comentarios', JSON.stringify(updatedComments));
        
        showNotification('Comentarios del producto eliminados exitosamente', 'success');
        loadCommentsModalContent();
        updateDashboardComments();
    }
}

// Función para eliminar todos los comentarios
function deleteAllComments() {
    if (confirm('¿Estás seguro de que quieres eliminar TODOS los comentarios? Esta acción no se puede deshacer.')) {
        localStorage.removeItem('modastyle_comentarios');
        
        showNotification('Todos los comentarios han sido eliminados', 'success');
        loadCommentsModalContent();
        updateDashboardComments();
    }
}

// Función para exportar reporte de comentarios
function exportCommentsReport() {
    const allComments = loadComments();
    
    if (allComments.length === 0) {
        showNotification('No hay comentarios para exportar', 'error');
        return;
    }
    
    let report = 'REPORTE DE COMENTARIOS - ModaStyle\n';
    report += 'Fecha: ' + new Date().toLocaleDateString('es-ES') + '\n\n';
    
    // Agrupar por producto
    const commentsByProduct = {};
    allComments.forEach(comment => {
        if (!commentsByProduct[comment.productoId]) {
            commentsByProduct[comment.productoId] = [];
        }
        commentsByProduct[comment.productoId].push(comment);
    });
    
    Object.keys(commentsByProduct).forEach(productId => {
        const product = getProductById(productId);
        const productComments = commentsByProduct[productId];
        
        if (product) {
            const averageRating = productComments.reduce((sum, c) => sum + c.calificacion, 0) / productComments.length;
            
            report += `PRODUCTO: ${product.nombre}\n`;
            report += `Calificación promedio: ${averageRating.toFixed(1)}/5\n`;
            report += `Total de comentarios: ${productComments.length}\n`;
            report += 'Comentarios:\n';
            
            productComments.forEach(comment => {
                report += `- ${comment.nombre} (${comment.calificacion}/5) - ${formatCommentDate(comment.fecha)}\n`;
                report += `  "${comment.comentario}"\n\n`;
            });
            
            report += '─'.repeat(50) + '\n\n';
        }
    });
    
    // Crear y descargar archivo
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comentarios_modastyle_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Reporte de comentarios exportado exitosamente', 'success');
}

// Función para actualizar estadísticas de comentarios en el dashboard
function updateDashboardComments() {
    console.log('=== ACTUALIZANDO ESTADÍSTICAS DE COMENTARIOS ===');
    const allComments = loadComments();
    console.log('Comentarios cargados:', allComments);
    
    const totalCommentsElement = document.getElementById('total-comments');
    const averageRatingElement = document.querySelector('#dashboard-comments-card .card-info span');
    
    console.log('Elemento total-comments encontrado:', totalCommentsElement);
    console.log('Elemento averageRatingElement encontrado:', averageRatingElement);
    
    if (totalCommentsElement) {
        totalCommentsElement.textContent = allComments.length;
        console.log('Total de comentarios actualizado:', allComments.length);
    }
    
    if (averageRatingElement && allComments.length > 0) {
        const averageRating = allComments.reduce((sum, c) => sum + c.calificacion, 0) / allComments.length;
        averageRatingElement.textContent = `Calificación promedio: ${averageRating.toFixed(1)}`;
        console.log('Calificación promedio actualizada:', averageRating.toFixed(1));
    } else if (averageRatingElement) {
        averageRatingElement.textContent = 'Calificación promedio: 0.0';
        console.log('Calificación promedio establecida en 0.0');
    }
    
    console.log('=== FIN ACTUALIZAR ESTADÍSTICAS DE COMENTARIOS ===');
}

// Hacer las funciones disponibles globalmente
window.loadComments = loadComments;
window.getProductComments = getProductComments;
window.getProductById = getProductById;
window.loadCommentsModalContent = loadCommentsModalContent;
window.generateStarsHTML = generateStarsHTML;
window.formatCommentDate = formatCommentDate;
window.deleteComment = deleteComment;
window.deleteProductComments = deleteProductComments;
window.deleteAllComments = deleteAllComments;
window.exportCommentsReport = exportCommentsReport;
window.updateDashboardComments = updateDashboardComments;

// Función para forzar la carga de categorías en administración
function forzarCargarCategoriasAdmin() {
    console.log('=== FORZANDO CARGA DE CATEGORÍAS EN ADMIN ===');
    loadCategorias();
} 
}