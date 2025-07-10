// Este script maneja la lógica del carrito de compras, cargando los productos almacenados en localStorage y mostrando su contenido

document.addEventListener('DOMContentLoaded', () => {
    // Obtener el carrito del localStorage
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    console.log('Carrito cargado:', carrito);

    const contenedor = document.querySelector('.cart-items');
    // Actualizar el contador del carrito
    actualizarContadorCarrito();

    // Mostrar los productos del carrito o mensaje vacío
    if (carrito.length === 0) {
        contenedor.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Tu carrito está vacío</h3>
                <p>Añade algunos productos para comenzar</p>
                <a href="catalogo.html" class="btn">Ver Catálogo</a>
            </div>
        `;
    } else {
        contenedor.innerHTML = carrito.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.imagen}" alt="${item.nombre}">
                <div class="item-details">
                    <h3>${item.nombre}</h3>
                    <p class="item-price">S/ ${item.precio.toFixed(2)}</p>
                    <div class="item-specs-container">
                        ${item.talla ? `<span class="item-specs"><strong>Talla:</strong> <span>${item.talla}</span></span>` : ''}
                        ${item.color ? `<span class="item-specs"><strong>Color:</strong> <span>${item.color}</span></span>` : ''}
                    </div>
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
    }
    // Inicializar los totales y botones SIEMPRE
    updateTotal();
    initializeCartButtons();

    // --- HABILITAR/DESHABILITAR BOTÓN DE PAGO SEGÚN CARRITO ---
    function actualizarEstadoCheckoutBtn() {
        const btn = document.querySelector('.checkout-btn');
        const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
        if (btn) {
            if (carrito.length === 0) {
                btn.disabled = true;
                btn.classList.add('disabled');
            } else {
                btn.disabled = false;
                btn.classList.remove('disabled');
            }
        }
    }
    actualizarEstadoCheckoutBtn();
    // Actualizar estado cada vez que cambie el carrito
    window.addEventListener('storage', actualizarEstadoCheckoutBtn);
    document.addEventListener('carritoActualizado', actualizarEstadoCheckoutBtn);

    // --- INICIALIZACIÓN DE MODALES Y BOTÓN DE PAGO ---
    // (esto va fuera del if para que siempre funcione)
    const customerModal = document.getElementById('customer-modal');
    const closeCustomerModal = document.getElementById('close-customer-modal');
    const customerForm = document.getElementById('customer-form');
    const customerError = document.getElementById('customer-error');
    let datosCliente = {};

    const paymentModal = document.getElementById('payment-modal');
    const closePaymentModal = document.getElementById('close-payment-modal');
    const paymentForm = document.getElementById('payment-form');
    const paymentError = document.getElementById('payment-error');
    const addressModal = document.getElementById('address-modal');
    const closeAddressModal = document.getElementById('close-address-modal');
    const addressForm = document.getElementById('address-form');
    const addressError = document.getElementById('address-error');
    const backToPaymentBtn = document.getElementById('back-to-payment');
    let datosPago = {};
    let datosDireccion = {};

    // --- MODAL CLIENTE ---
    function showCustomerModal(onSuccess) {
        customerModal.style.display = 'flex';
        customerError.style.display = 'none';
        customerForm.reset();
        customerForm.onsubmit = function(e) {
            e.preventDefault();
            const nombre = document.getElementById('customer-name').value.trim();
            const dni = document.getElementById('customer-dni').value.trim();
            const telefono = document.getElementById('customer-phone').value.trim();
            const email = document.getElementById('customer-email').value.trim();
            if (!nombre) {
                customerError.textContent = 'Por favor, ingresa tu nombre.';
                customerError.style.display = 'block';
                return;
            }
            if (!dni || !/^\d{8}$/.test(dni)) {
                customerError.textContent = 'DNI inválido (8 dígitos).';
                customerError.style.display = 'block';
                return;
            }
            if (!telefono || !/^9\d{8}$/.test(telefono)) {
                customerError.textContent = 'Teléfono inválido (9 dígitos, empieza con 9).';
                customerError.style.display = 'block';
                return;
            }
            customerError.style.display = 'none';
            datosCliente = { nombre, dni, telefono, email };
            hideCustomerModal();
            if (typeof onSuccess === 'function') onSuccess();
        };
    }
    function hideCustomerModal() { customerModal.style.display = 'none'; }
    if (closeCustomerModal) closeCustomerModal.addEventListener('click', hideCustomerModal);
    customerModal.addEventListener('click', (e) => { if (e.target === customerModal) hideCustomerModal(); });

    // --- MODAL DIRECCIÓN ---
    function showAddressModal(onSuccess) {
        addressModal.style.display = 'flex';
        addressError.style.display = 'none';
        addressForm.reset();
        addressForm.onsubmit = function(e) {
            e.preventDefault();
            const direccion = document.getElementById('delivery-address').value.trim();
            const referencia = document.getElementById('delivery-reference').value.trim();
            if (!direccion) {
                addressError.textContent = 'Por favor, ingresa la dirección de entrega.';
                addressError.style.display = 'block';
                return;
            }
            addressError.style.display = 'none';
            datosDireccion = { direccion, referencia };
            hideAddressModal();
            if (typeof onSuccess === 'function') onSuccess();
        };
    }
    function hideAddressModal() { addressModal.style.display = 'none'; }
    if (closeAddressModal) closeAddressModal.addEventListener('click', hideAddressModal);
    if (backToPaymentBtn) backToPaymentBtn.addEventListener('click', function() {
        hideAddressModal();
        showPaymentModal(() => showAddressModal(() => showPaymentModal()));
    });
    addressModal.addEventListener('click', (e) => { if (e.target === addressModal) hideAddressModal(); });

    // --- MODAL PAGO ---
    function showPaymentModal(onSuccess) {
        paymentModal.style.display = 'flex';
        paymentError.style.display = 'none';
        paymentForm.reset();
        paymentForm.onsubmit = function(e) {
            e.preventDefault();
            const name = document.getElementById('card-name').value.trim();
            const number = document.getElementById('card-number').value.replace(/\s+/g, '');
            const expiry = document.getElementById('card-expiry').value.trim();
            const cvv = document.getElementById('card-cvv').value.trim();
            if (!name || number.length < 13 || number.length > 19 || !/^[0-9]+$/.test(number)) {
                paymentError.textContent = 'Número de tarjeta inválido.';
                paymentError.style.display = 'block';
                return;
            }
            if (!/^\d{2}\/\d{2}$/.test(expiry)) {
                paymentError.textContent = 'Fecha de vencimiento inválida (MM/AA).';
                paymentError.style.display = 'block';
                return;
            }
            if (!/^\d{3,4}$/.test(cvv)) {
                paymentError.textContent = 'CVV inválido.';
                paymentError.style.display = 'block';
                return;
            }
            paymentError.style.display = 'none';
            paymentForm.querySelector('button').textContent = 'Procesando...';
            paymentForm.querySelector('button').disabled = true;
            datosPago = { name, number, expiry, cvv };
            setTimeout(() => {
                paymentForm.querySelector('button').textContent = 'Confirmar Pago';
                paymentForm.querySelector('button').disabled = false;
                hidePaymentModal();
                procesarPagoYMostrarExito();
            }, 1200);
        };
    }
    function hidePaymentModal() { paymentModal.style.display = 'none'; }
    if (closePaymentModal) closePaymentModal.addEventListener('click', hidePaymentModal);
    paymentModal.addEventListener('click', (e) => { if (e.target === paymentModal) hidePaymentModal(); });

    // Delegación de eventos para el botón de pago (por si el HTML cambia dinámicamente)
    document.body.addEventListener('click', function(e) {
        const btn = e.target.closest('.checkout-btn');
        if (btn) {
            e.preventDefault();
            const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
            if (carrito.length === 0) {
                // No abrir el modal si el carrito está vacío
                return;
            }
            showCustomerModal(() => showAddressModal(() => showPaymentModal()));
        }
    });

    // --- PROCESAR PEDIDO Y MOSTRAR ÉXITO ---
    function procesarPagoYMostrarExito() {
        // Obtener carrito
        const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
        // Guardar pedido en localStorage para administración
        const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
        const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        const envio = 15.00;
        const total = subtotal + envio;
        const nuevoPedido = {
            productos: carrito,
            cliente: datosCliente,
            direccion: datosDireccion.direccion,
            referencia: datosDireccion.referencia,
            subtotal: subtotal,
            envio: envio,
            total: total,
            // Guardar fecha en formato ISO local compatible con los filtros
            fecha: (function() {
                const now = new Date();
                const pad = n => n.toString().padStart(2, '0');
                return now.getFullYear() + '-' + pad(now.getMonth()+1) + '-' + pad(now.getDate()) + 'T' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
            })(),
            estado: 'Pendiente',
            pago: datosPago
        };
        pedidos.push(nuevoPedido);
        localStorage.setItem('pedidos', JSON.stringify(pedidos));
        
        //Genera una boleta
        generarYDescargarBoletaPDF(nuevoPedido);

        
        // Disparar evento para actualizar estadísticas en admin
        window.dispatchEvent(new CustomEvent('pedidosActualizados', {
            detail: { pedidos: pedidos }
        }));
        
        // Limpiar carrito
        localStorage.removeItem('carrito');
        actualizarContadorCarrito();
        // Mostrar modal de éxito
        showSuccessModal();
    }

    // --- MODAL DE ÉXITO ---
    function showSuccessModal() {
        let modal = document.getElementById('success-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'success-modal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content success-modal-content">
                    <div class="success-icon"><i class="fas fa-check-circle"></i></div>
                    <h2>¡Pago realizado con éxito!</h2>
                    <p>Tu pedido ha sido registrado correctamente.<br>Pronto nos pondremos en contacto contigo.</p>
                    <button class="btn btn-primary" id="success-close-btn">Volver al Catálogo</button>
                </div>
            `;
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';
        document.getElementById('success-close-btn').onclick = function() {
            modal.style.display = 'none';
            window.location.href = 'catalogo.html';
        };
        modal.onclick = function(e) { if (e.target === modal) modal.style.display = 'none'; };
    }
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
            
            // Obtener talla y color del elemento
            const tallaElement = itemElement.querySelector('.item-specs:first-of-type');
            const colorElement = itemElement.querySelector('.item-specs:last-of-type');
            const talla = tallaElement ? tallaElement.textContent.replace('Talla: ', '') : null;
            const color = colorElement ? colorElement.textContent.replace('Color: ', '') : null;
            
            // Actualizar el item en localStorage considerando talla y color
            const itemIndex = carrito.findIndex(item => {
                if (item.id === itemId) {
                    // Si el item tiene talla y color, verificar que coincidan
                    if (talla && color) {
                        return item.talla === talla && item.color === color;
                    }
                    // Si no tiene talla y color, solo verificar ID
                    return !item.talla && !item.color;
                }
                return false;
            });
            
            if (itemIndex !== -1) {
                carrito[itemIndex].cantidad = quantity;
                localStorage.setItem('carrito', JSON.stringify(carrito));
                
                // Mostrar notificación de cantidad actualizada
                mostrarNotificacionCantidad(quantity);
            }
            
            // Actualizar totales
            updateItemTotal(itemElement);
            updateTotal();
            document.dispatchEvent(new Event('carritoActualizado'));
        });
    });

    // Funcionalidad para eliminar items
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
            let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
            const itemElement = this.closest('.cart-item');
            const itemId = parseInt(itemElement.dataset.id);
            
            // Obtener talla y color del elemento
            const tallaElement = itemElement.querySelector('.item-specs:first-of-type');
            const colorElement = itemElement.querySelector('.item-specs:last-of-type');
            const talla = tallaElement ? tallaElement.textContent.replace('Talla: ', '') : null;
            const color = colorElement ? colorElement.textContent.replace('Color: ', '') : null;
            
            // Filtrar el carrito considerando talla y color
            const updatedCarrito = carrito.filter(item => {
                if (item.id === itemId) {
                    // Si el item tiene talla y color, verificar que coincidan
                    if (talla && color) {
                        return !(item.talla === talla && item.color === color);
                    }
                    // Si no tiene talla y color, solo verificar ID
                    return !(!item.talla && !item.color);
                }
                return true;
            });
            
            localStorage.setItem('carrito', JSON.stringify(updatedCarrito));
            
            // Mostrar notificación de producto eliminado
            mostrarNotificacionEliminado();
            
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
                    updateTotal(); // <-- Aseguro que los totales se actualicen a cero
                } else {
                    // Si aún hay items, actualizar los totales
                    updateTotal();
                }
                document.dispatchEvent(new Event('carritoActualizado'));
            }, 300);
        });
    });
}

function updateLocalStorage() {
    const items = Array.from(document.querySelectorAll('.cart-item')).map(item => {
        const itemData = {
            id: parseInt(item.dataset.id),
            nombre: item.querySelector('h3').textContent,
            precio: parseFloat(item.querySelector('.item-price').textContent.replace('S/ ', '')),
            imagen: item.querySelector('img').src,
            cantidad: parseInt(item.querySelector('.quantity-controls span').textContent)
        };
        
        // Agregar talla y color si existen
        const tallaElement = item.querySelector('.item-specs:first-of-type');
        const colorElement = item.querySelector('.item-specs:last-of-type');
        
        if (tallaElement) {
            itemData.talla = tallaElement.textContent.replace('Talla: ', '');
        }
        
        if (colorElement) {
            itemData.color = colorElement.textContent.replace('Color: ', '');
        }
        
        return itemData;
    });
    
    if (items.length === 0) {
        localStorage.removeItem('carrito');
    } else {
        localStorage.setItem('carrito', JSON.stringify(items));
    }
    // Actualizar el contador inmediatamente
    actualizarContadorCarrito();
    document.dispatchEvent(new Event('carritoActualizado'));
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

function validarTelefono(telefono) {
    // Eliminar espacios y guiones
    const numero = telefono.replace(/\s+/g, '').replace(/-/g, '');
    // Validar que sean 9 dígitos y empiece con 9
    return /^9\d{8}$/.test(numero);
}

// Función para mostrar notificación de cantidad actualizada
function mostrarNotificacionCantidad(cantidad) {
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion cantidad-notificacion';
    notificacion.innerHTML = `
        <i class="fas fa-shopping-cart"></i>
        <span>Cantidad actualizada: ${cantidad}</span>
    `;
    document.body.appendChild(notificacion);
    
    // Animar la notificación
    setTimeout(() => {
        notificacion.classList.add('mostrar');
    }, 100);
    
    // Eliminar la notificación después de 2 segundos
    setTimeout(() => {
        notificacion.classList.remove('mostrar');
        setTimeout(() => {
            notificacion.remove();
        }, 300);
    }, 2000);
}

// Función para mostrar notificación de producto eliminado
function mostrarNotificacionEliminado() {
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion eliminado-notificacion';
    notificacion.innerHTML = `
        <i class="fas fa-trash"></i>
        <span>Producto eliminado del carrito</span>
    `;
    document.body.appendChild(notificacion);
    
    // Animar la notificación
    setTimeout(() => {
        notificacion.classList.add('mostrar');
    }, 100);
    
    // Eliminar la notificación después de 2 segundos
    setTimeout(() => {
        notificacion.classList.remove('mostrar');
        setTimeout(() => {
            notificacion.remove();
        }, 300);
    }, 2000);
}

function generarYDescargarBoletaPDF(pedido) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const fechaFormateada = new Date(pedido.fecha).toLocaleString('es-PE', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    // Encabezado tipo logo en texto
    doc.setFontSize(20);
    doc.setTextColor(33, 37, 41); // Gris oscuro
    doc.setFont('helvetica', 'bold');
    doc.text('ShopData', 15, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Boleta de Venta', 15, 28);
    doc.text(`Fecha: ${fechaFormateada}`, 150, 28, { align: 'right' });

    doc.setLineWidth(0.5);
    doc.line(10, 32, 200, 32); // línea separadora

    // Datos del cliente
    let y = 40;
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text('Datos del Cliente', 15, y);
    y += 6;
    const cliente = pedido.cliente;
    doc.setFontSize(10);
    doc.text(`Nombre: ${cliente.nombre}`, 15, y); y += 5;
    doc.text(`DNI: ${cliente.dni}`, 15, y); y += 5;
    doc.text(`Teléfono: ${cliente.telefono}`, 15, y); y += 5;
    if (cliente.email) {
        doc.text(`Email: ${cliente.email}`, 15, y); y += 5;
    }
    doc.text(`Dirección: ${pedido.direccion}`, 15, y); y += 5;
    if (pedido.referencia) {
        doc.text(`Referencia: ${pedido.referencia}`, 15, y); y += 8;
    }

    // Tabla de productos
    const productos = pedido.productos.map((p, i) => [
        i + 1,
        p.nombre,
        p.talla || '-',
        p.color || '-',
        p.cantidad,
        `S/ ${p.precio.toFixed(2)}`,
        `S/ ${(p.precio * p.cantidad).toFixed(2)}`
    ]);

    doc.autoTable({
        startY: y,
        head: [['#', 'Producto', 'Talla', 'Color', 'Cant.', 'Precio', 'Total']],
        body: productos,
        theme: 'striped',
        styles: {
            fontSize: 9,
            cellPadding: 2,
        },
        headStyles: {
            fillColor: [52, 152, 219], // azul elegante
            textColor: [255, 255, 255],
        },
    });

    let finalY = doc.lastAutoTable.finalY + 10;

    // Totales
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Subtotal: S/ ${pedido.subtotal.toFixed(2)}`, 150, finalY, { align: 'right' }); finalY += 6;
    doc.text(`Envío: S/ ${pedido.envio.toFixed(2)}`, 150, finalY, { align: 'right' }); finalY += 6;
    doc.setFontSize(12);
    doc.setTextColor(0, 100, 0);
    doc.text(`TOTAL: S/ ${pedido.total.toFixed(2)}`, 150, finalY, { align: 'right' }); finalY += 10;

    // Estado del pedido
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(`Estado del pedido: ${pedido.estado}`, 15, finalY); finalY += 8;

    // Mensaje final
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text('Gracias por confiar en ShopData. ¡Te esperamos pronto!', 15, finalY);

    const nombreArchivo = `Boleta_ShopData_${pedido.cliente.dni}_${Date.now()}.pdf`;
    doc.save(nombreArchivo);
}
