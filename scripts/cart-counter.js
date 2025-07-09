// Este script maneja el contador de artículos en el carrito, mostrando el total de productos en el ícono del carrito

// Script para actualizar el contador del carrito en todas las páginas
class CartCounter {
    constructor() {
        this.cartCountElement = document.getElementById('cart-count');
        this.init();
    }

    init() {
        // Actualizar contador al cargar la página
        this.updateCartCount();
        
        // Escuchar cambios en el carrito desde otras páginas
        window.addEventListener('storage', (e) => {
            if (e.key === 'carrito') {
                this.updateCartCount();
            }
        });

        // Escuchar eventos personalizados de cambios en el carrito
        window.addEventListener('carritoActualizado', () => {
            this.updateCartCount();
        });

        // Actualizar cada 2 segundos como respaldo
        setInterval(() => {
            this.updateCartCount();
        }, 2000);
    }

    updateCartCount() {
        if (!this.cartCountElement) return;

        try {
            const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
            const totalItems = carrito.reduce((total, item) => total + (item.cantidad || 1), 0);

            // Obtener el valor anterior para comparar
            const previousValue = parseInt(this.cartCountElement.textContent) || 0;

            // Actualizar el número
            this.cartCountElement.textContent = totalItems;

            // Mostrar/ocultar el contador
            if (totalItems > 0) {
                this.cartCountElement.classList.remove('hidden');
                
                // Animar solo si el valor cambió
                if (totalItems !== previousValue) {
                    // Si el valor aumentó, usar animación especial
                    if (totalItems > previousValue) {
                        this.cartCountElement.classList.add('increase');
                        setTimeout(() => {
                            this.cartCountElement.classList.remove('increase');
                        }, 800);
                    } else {
                        // Si el valor disminuyó, usar animación normal
                        this.cartCountElement.classList.add('animate');
                        setTimeout(() => {
                            this.cartCountElement.classList.remove('animate');
                        }, 600);
                    }
                }
            } else {
                this.cartCountElement.classList.add('hidden');
            }

            console.log('Contador del carrito actualizado:', totalItems, 'anterior:', previousValue);
        } catch (error) {
            console.error('Error al actualizar contador del carrito:', error);
        }
    }

    // Método para animar el contador cuando se agrega un producto
    animateAdd() {
        if (this.cartCountElement) {
            this.cartCountElement.classList.add('animate');
            setTimeout(() => {
                this.cartCountElement.classList.remove('animate');
            }, 600);
        }
    }
}

// Inicializar el contador cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new CartCounter();
});

// Función global para actualizar el contador desde otros scripts
window.updateCartCounter = function() {
    const counter = new CartCounter();
    counter.updateCartCount();
};

// Función para animar cuando se agrega un producto
window.animateCartCounter = function() {
    const counter = new CartCounter();
    counter.animateAdd();
};