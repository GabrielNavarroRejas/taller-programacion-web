// Este script maneja el contador de artículos en el carrito, mostrando el total de productos en el ícono del carrito

function actualizarContadorCarrito() {
    // Obtener el carrito almacenado en localStorage
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    // Calcular el total de artículos en el carrito (sumando las cantidades de cada producto)
    const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);

    // Actualizar el contador en todos los elementos con la clase '.cart-count'
    document.querySelectorAll('.cart-count').forEach(contador => {
        contador.textContent = totalItems;  // Actualiza el número de artículos
        contador.style.display = totalItems > 0 ? 'flex' : 'none';  // Si no hay artículos, ocultamos el contador
    });
}

// Llamada a la función para actualizar el contador al cargar la página
document.addEventListener('DOMContentLoaded', actualizarContadorCarrito);