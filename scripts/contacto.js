// Crear partículas animadas
function createParticles() {
    const container = document.getElementById('particles');
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        // Tamaño aleatorio
        const size = Math.random() * 50 + 10;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        // Posición aleatoria
        const left = Math.random() * 100;
        const top = Math.random() * 100 + 100;
        particle.style.left = `${left}%`;
        particle.style.top = `${top}%`;

        // Color aleatorio
        const colors = ['#6C63FF', '#FF6584', '#4A5568', '#E2E8F0'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        particle.style.backgroundColor = color;

        // Animación aleatoria
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 5;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${delay}s`;

        container.appendChild(particle);
    }
}

// Efecto ripple en botón
function createRipple(event) {
    const button = event.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
    circle.classList.add("ripple");

    const ripple = button.getElementsByClassName("ripple")[0];
    if (ripple) ripple.remove();

    button.appendChild(circle);
}
// Validacion
function validateForm(event) {
    event.preventDefault();  // Evita el envío del formulario hasta que la validación se complete

    const name = document.getElementById('name').value;  // Obtiene el valor del campo "nombre"
    const email = document.getElementById('email').value;  // Obtiene el valor del campo "correo electrónico"
    const message = document.getElementById('message').value;  // Obtiene el valor del campo "mensaje"

    // Verifica que todos los campos obligatorios estén llenos
    if (!name || !email || !message) {
        alert('Por favor completa todos los campos obligatorios');  // Alerta si falta algún campo
        return;  // Detiene la ejecución si algún campo está vacío
    }

    // Verifica que el correo electrónico tenga un formato válido utilizando una expresión regular
    if (!validateEmail(email)) {
        alert('Por favor ingresa un correo electrónico válido');  // Alerta si el formato del correo es incorrecto
        return;  // Detiene la ejecución si el correo no es válido
    }

    // Si la validación es exitosa, muestra una retroalimentación visual de éxito
    const submitBtn = document.getElementById('submitBtn');  // Obtiene el botón de envío
    submitBtn.innerHTML = '<i class="fas fa-check"></i> Mensaje Enviado';  // Cambia el texto del botón
    submitBtn.style.background = 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)';  // Cambia el estilo del botón

    // Restaura el formulario y el estilo del botón después de 3 segundos
    setTimeout(() => {
        document.getElementById('contactForm').reset();  // Restaura el formulario
        submitBtn.innerHTML = 'Enviar Mensaje';  // Vuelve a cambiar el texto del botón
        submitBtn.style.background = 'linear-gradient(135deg, var(--primary) 0%, #8a83ff 100%)';  // Restaura el estilo del botón
    }, 3000);
}

// Función para validar el formato del correo electrónico
function validateEmail(email) {
    const re = /^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());  // Devuelve true si el correo tiene un formato válido
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    createParticles();

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.addEventListener('click', createRipple);
    submitBtn.addEventListener('click', validateForm);

    // Animación de entrada para las cajas de información
    const infoBoxes = document.querySelectorAll('.info-box');
    infoBoxes.forEach((box, index) => {
        box.style.animation = `fadeIn 0.5s ease-out ${index * 0.2}s forwards`;
        box.style.opacity = '0';
    });
});