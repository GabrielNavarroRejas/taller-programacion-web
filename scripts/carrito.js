document.addEventListener('DOMContentLoaded', () => {
    // Obtener el carrito del localStorage
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    console.log('Carrito cargado:', carrito);
    const contenedor = document.querySelector('.cart-items');
    
    // Actualizar el contador del carrito
    actualizarContadorCarrito();
    
    if (carrito.length === 0) {
        contenedor.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Tu carrito está vacío</h3>
                <p>Añade algunos productos para comenzar</p>
                <a href="catalogo.html" class="btn">Ver Catálogo</a>
            </div>
        `;
        return;
    }
    
    // Mostrar los productos del carrito
    contenedor.innerHTML = carrito.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <img src="${item.imagen}" alt="${item.nombre}">
            <div class="item-details">
                <h3>${item.nombre}</h3>
                <p class="item-price">S/ ${item.precio.toFixed(2)}</p>
            </div>
            <div class="quantity-controls">
                <button class="decrease">-</button>
                <span>${item.cantidad}</span>
                <button class="increase">+</button>
            </div>
            <div class="item-total">S/ ${(item.precio * item.cantidad).toFixed(2)}</div>
            <button class="remove-item"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');
    
    // Inicializar los totales
    updateTotal();
    
    // Agregar event listeners a los botones
    initializeCartButtons();
});

function initializeCartButtons(carrito) {
    // Funcionalidad para los botones de cantidad
    document.querySelectorAll('.quantity-controls button').forEach(button => {
        button.addEventListener('click', function() {
            const carrito = JSON.parse(localStorage.getItem('carrito')) || []; // Obtenemos carrito actualizado
            const itemElement = this.closest('.cart-item');
            const itemId = parseInt(itemElement.dataset.id);
            const span = this.parentElement.querySelector('span');
            let quantity = parseInt(span.textContent);
            
            if (this.classList.contains('increase')) {
                quantity++;
            } else if (this.classList.contains('decrease') && quantity > 1) {
                quantity--;
            }
            
            // Actualizar cantidad inmediatamente
            span.textContent = quantity;
            
            // Actualizar el item en localStorage
            const itemIndex = carrito.findIndex(item => item.id === itemId);
            if (itemIndex !== -1) {
                carrito[itemIndex].cantidad = quantity;
                localStorage.setItem('carrito', JSON.stringify(carrito));
            }
            
            // Actualizar totales
            updateItemTotal(itemElement);
            updateTotal();
        });
    });

    // Funcionalidad para eliminar items
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
            let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
            const itemElement = this.closest('.cart-item');
            const itemId = parseInt(itemElement.dataset.id);
            
            const updatedCarrito = carrito.filter(item => item.id !== itemId);
            localStorage.setItem('carrito', JSON.stringify(updatedCarrito));
            
            // Actualizar el contador
            actualizarContadorCarrito();
            
            // Agregar clase de animación
            itemElement.classList.add('removing');
            
            // Eliminar el elemento después de la animación
            setTimeout(() => {
                itemElement.remove();
                
                // Verificar si el carrito está vacío
                const remainingItems = document.querySelectorAll('.cart-item');
                if (remainingItems.length === 0) {
                    const contenedor = document.querySelector('.cart-items');
                    contenedor.innerHTML = `
                        <div class="empty-cart">
                            <i class="fas fa-shopping-cart"></i>
                            <h3>Tu carrito está vacío</h3>
                            <p>Añade algunos productos para comenzar</p>
                            <a href="catalogo.html" class="btn">Ver Catálogo</a>
                        </div>
                    `;
                } else {
                    // Si aún hay items, actualizar los totales
                    updateTotal();
                }
            }, 300);
        });
    });
}

function updateLocalStorage() {
    const items = Array.from(document.querySelectorAll('.cart-item')).map(item => ({
        nombre: item.querySelector('h3').textContent,
        precio: parseFloat(item.querySelector('.item-price').textContent.replace('S/ ', '')),
        imagen: item.querySelector('img').src,
        cantidad: parseInt(item.querySelector('.quantity-controls span').textContent)
    }));
    
    if (items.length === 0) {
        localStorage.removeItem('carrito');
    } else {
        localStorage.setItem('carrito', JSON.stringify(items));
    }
    // Actualizar el contador inmediatamente
    actualizarContadorCarrito();
}

function updateItemTotal(item) {
    const price = parseFloat(item.querySelector('.item-details .item-price').textContent.replace('S/ ', ''));
    const quantity = parseInt(item.querySelector('.quantity-controls span').textContent);
    const total = price * quantity;
    
    let totalElement = item.querySelector('.item-total');
    if (!totalElement) {
        totalElement = document.createElement('div');
        totalElement.className = 'item-total';
        item.insertBefore(totalElement, item.querySelector('.remove-item'));
    }
    
    totalElement.textContent = `S/ ${total.toFixed(2)}`;
    totalElement.classList.add('price-update');
    
    // Actualizar totales inmediatamente
    updateTotal();
    
    setTimeout(() => {
        totalElement.classList.remove('price-update');
    }, 300);
}

function updateTotal() {
    const cartItems = document.querySelectorAll('.cart-item');
    let subtotal = 0;
    
    if (cartItems.length === 0) {
        // Si no hay items, establecer totales a 0
        const subtotalElement = document.querySelector('.summary-row:nth-child(1) span:last-child');
        const totalElement = document.querySelector('.summary-row.total span:last-child');
        const shippingElement = document.querySelector('.summary-row:nth-child(2) span:last-child');
        
        subtotalElement.textContent = 'S/ 0.00';
        shippingElement.textContent = 'S/ 0.00';
        totalElement.textContent = 'S/ 0.00';
        return;
    }

    // Calcular subtotal
    cartItems.forEach(item => {
        const price = parseFloat(item.querySelector('.item-details .item-price').textContent.replace('S/ ', ''));
        const quantity = parseInt(item.querySelector('.quantity-controls span').textContent);
        subtotal += price * quantity;
    });

    // Calcular envío y total
    const shipping = subtotal > 0 ? 15.00 : 0.00;
    const total = subtotal + shipping;

    // Actualizar elementos en el DOM
    const subtotalElement = document.querySelector('.summary-row:nth-child(1) span:last-child');
    const totalElement = document.querySelector('.summary-row.total span:last-child');
    const shippingElement = document.querySelector('.summary-row:nth-child(2) span:last-child');

    // Actualizar los totales inmediatamente
    subtotalElement.textContent = `S/ ${subtotal.toFixed(2)}`;
    shippingElement.textContent = `S/ ${shipping.toFixed(2)}`;
    totalElement.textContent = `S/ ${total.toFixed(2)}`;

    // Agregar animación después de actualizar
    subtotalElement.classList.add('price-update');
    totalElement.classList.add('price-update');

    setTimeout(() => {
        subtotalElement.classList.remove('price-update');
        totalElement.classList.remove('price-update');
    }, 300);
}

document.querySelector('.checkout-btn').addEventListener('click', function(e) {
    e.preventDefault();
    this.style.transform = 'scale(0.95)';
    setTimeout(() => {
        this.style.transform = 'scale(1)';
    }, 200);
});



document.querySelectorAll('.cart-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
        item.style.transform = 'translateY(-5px)';
        item.style.boxShadow = 'var(--shadow-lg)';
    });
    
    item.addEventListener('mouseleave', () => {
        item.style.transform = 'translateY(0)';
        item.style.boxShadow = 'var(--shadow-md)';
    });
});

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
}


// Función para agregar producto al carrito
function addToCart(producto) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const existingItem = carrito.find(item => item.nombre === producto.nombre);
    
    if (existingItem) {
        existingItem.cantidad += 1;
    } else {
        carrito.push({
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagen,
            cantidad: 1
        });
    }
    
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
}

// Función para eliminar producto del carrito
function removeItem(nombre) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    carrito = carrito.filter(item => item.nombre !== nombre);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    updateCartCount();
}

// Función para actualizar cantidad de un producto
function updateItemQuantity(nombre, newQuantity) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const item = carrito.find(item => item.nombre === nombre);
    if (item) {
        item.cantidad = newQuantity;
        localStorage.setItem('carrito', JSON.stringify(carrito));
        updateCartCount();
    }
}

// Inicializar el contador al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    // Agregar event listeners para los botones de agregar al carrito
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productCard = e.target.closest('.product-card');
            const product = {
                id: productCard.dataset.id,
                name: productCard.querySelector('.product-title').textContent,
                price: parseFloat(productCard.querySelector('.product-price').textContent.replace('S/.', '')),
                image: productCard.querySelector('.product-image').src
            };
            addToCart(product);
        });
    });
});

// Función para actualizar el contador del carrito
function updateCartCount() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

function validarTelefono(telefono) {
    // Eliminar espacios y guiones
    const numero = telefono.replace(/\s+/g, '').replace(/-/g, '');
    // Validar que sean 9 dígitos y empiece con 9
    return /^9\d{8}$/.test(numero);
}

// Reemplazar el evento del botón de checkout
document.querySelector('.checkout-btn').addEventListener('click', function(e) {
    e.preventDefault();
    const phoneInput = document.getElementById('phone');
    const phoneError = document.getElementById('phone-error');
    const telefono = phoneInput.value.trim();
    
    // Validar teléfono
    if (!telefono) {
        phoneError.textContent = 'Por favor, ingresa tu número de teléfono.';
        phoneError.style.display = 'block';
        return;
    }
    
    if (!validarTelefono(telefono)) {
        phoneError.textContent = 'Por favor, ingresa un número válido de 9 dígitos que comience con 9.';
        phoneError.style.display = 'block';
        return;
    }
    
    // Limpiar mensaje de error
    phoneError.style.display = 'none';
    
    // Obtener carrito
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    
    // Construir mensaje
    let mensaje = '¡Hola! Quiero comprar los siguientes productos:%0A%0A';
    carrito.forEach(item => {
        mensaje += `- ${item.nombre} (Cantidad: ${item.cantidad}, Precio: S/ ${item.precio.toFixed(2)})%0A`;
    });
    
    // Calcular total
    const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const envio = 15.00;
    const total = subtotal + envio;
    
    mensaje += `%0ASubtotal: S/ ${subtotal.toFixed(2)}%0A`;
    mensaje += `Envío: S/ ${envio.toFixed(2)}%0A`;
    mensaje += `*Total: S/ ${total.toFixed(2)}*%0A%0A`;
    mensaje += `Mi número de contacto es: ${telefono}`;
    
    // Número del vendedor (sin espacios)
    const numeroVendedor = '51922684873';
    
    // Determinar si es dispositivo móvil
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    let urlWhatsapp;
    
    if (isMobile) {
        urlWhatsapp = `whatsapp://send?phone=${numeroVendedor}&text=${mensaje}`;
    } else {
        urlWhatsapp = `https://web.whatsapp.com/send?phone=${numeroVendedor}&text=${mensaje}`;
    }
    
    // Redirigir a WhatsApp
    window.location.href = urlWhatsapp;
});