// Manejo del inicio de sesión
document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === 'admin' && password === 'admin123') {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
    } else {
        document.getElementById('login-error').style.display = 'block';
        const form = document.getElementById('login-form');
        form.classList.add('shake');
        setTimeout(() => form.classList.remove('shake'), 500);
    }
});

// Base de datos de productos (simulada con localStorage)
let productos = [];
let currentEditId = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners();
});

// Función para cargar productos
function loadProducts() {
    fetch('productos.json')
        .then(response => response.json())
        .then(data => {
            productos = data;
            saveProducts();
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
    localStorage.setItem('modastyle_products', JSON.stringify(productos));
    updateDashboard();
}

// Actualizar el dashboard con estadísticas
function updateDashboard() {
    const totalProducts = document.getElementById('total-products');
    const totalStock = document.getElementById('total-stock');
    const totalValue = document.getElementById('total-value');

    if (totalProducts && totalStock && totalValue) {
        totalProducts.textContent = productos.length;
        const stock = productos.reduce((sum, product) => sum + product.stock, 0);
        totalStock.textContent = stock;
        const value = productos.reduce((sum, product) => sum + (product.precio * product.stock), 0);
        totalValue.textContent = `S/ ${value.toFixed(2)}`;
    } else {
        console.error('One or more dashboard elements not found');
    }
}

// Renderizar lista de productos
function renderProducts() {
    const container = document.getElementById('product-list');
    if (!container) return;

    container.innerHTML = '';

    if (productos.length === 0) {
        container.innerHTML = '<div class="empty-message">No hay productos registrados</div>';
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

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = parseInt(this.getAttribute('data-id'));
            editProduct(id);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = parseInt(this.getAttribute('data-id'));
            deleteProduct(id);
        });
    });
}

// Editar producto
function editProduct(id) {
    const product = productos.find(p => p.id === id);
    if (!product) return;

    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.nombre;
    document.getElementById('product-price').value = product.precio;
    document.getElementById('product-description').value = product.descripcion;
    document.getElementById('product-image').value = product.imagen;
    document.getElementById('product-type').value = product.tipo;
    document.getElementById('product-gender').value = product.genero;
    document.getElementById('product-colors').value = product.colores.join(', ');
    document.getElementById('product-sizes').value = product.tallas.join(', ');
    document.getElementById('product-material').value = product.material;
    document.getElementById('product-stock').value = product.stock;
    document.getElementById('product-images').value = product.imagenes ? product.imagenes.join(', ') : '';

    document.getElementById('form-title').textContent = "Editar Producto";
    document.getElementById('product-form').scrollIntoView({ behavior: 'smooth' });

    showNotification('Producto cargado para edición');
}

// Eliminar producto
function deleteProduct(id) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    productos = productos.filter(p => p.id !== id);
    saveProducts();
    renderProducts();
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
            loadProducts();
        } else {
            document.getElementById('login-error').style.display = 'block';
            const form = document.getElementById('login-form');
            form.classList.add('shake');
            setTimeout(() => form.classList.remove('shake'), 500);
        }
    });

    document.getElementById('product-form').addEventListener('submit', function (e) {
        e.preventDefault();

        const id = document.getElementById('product-id').value;
        const productData = {
            id: id ? parseInt(id) : generarNuevoId(),
            nombre: document.getElementById('product-name').value,
            descripcion: document.getElementById('product-description').value,
            precio: parseFloat(document.getElementById('product-price').value),
            imagen: document.getElementById('product-image').value,
            imagenes: document.getElementById('product-images').value
                ? document.getElementById('product-images').value.split(',').map(url => url.trim())
                : [],
            tipo: document.getElementById('product-type').value,
            genero: document.getElementById('product-gender').value,
            colores: document.getElementById('product-colors').value.split(',').map(c => c.trim()),
            tallas: document.getElementById('product-sizes').value.split(',').map(s => s.trim()),
            material: document.getElementById('product-material').value,
            stock: parseInt(document.getElementById('product-stock').value)
        };

        if (id) {
            const index = productos.findIndex(p => p.id === parseInt(id));
            if (index !== -1) {
                productos[index] = productData;
            }
        } else {
            productos.push(productData);
        }

        saveProducts();
        renderProducts();
        this.reset();
        document.getElementById('product-id').value = '';
        document.getElementById('form-title').textContent = "Agregar Nuevo Producto";

        showNotification('Producto guardado exitosamente!');
    });

    document.getElementById('floating-btn').addEventListener('click', function () {
        document.getElementById('product-form').reset();
        document.getElementById('product-id').value = '';
        document.getElementById('form-title').textContent = "Agregar Nuevo Producto";
        document.getElementById('product-form').scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('add-product-btn').addEventListener('click', function () {
        document.getElementById('product-form').reset();
        document.getElementById('product-id').value = '';
        document.getElementById('form-title').textContent = "Agregar Nuevo Producto";
        document.getElementById('product-form').scrollIntoView({ behavior: 'smooth' });
    });
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
    document.getElementById('product-form').reset();
    document.getElementById('form-title').textContent = "Agregar Nuevo Producto";
    document.getElementById('product-form').scrollIntoView({ behavior: 'smooth' });
}