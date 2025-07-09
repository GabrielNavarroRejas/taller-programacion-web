document.addEventListener('DOMContentLoaded', () => {
    const track = document.querySelector('.carousel-track');
    const cards = document.querySelectorAll('.testimonial-card');
    const speed = 0.8; // Velocidad en pixeles por frame (ajustar según necesidad)

    // Clonar tarjetas para efecto infinito
    const clones = [];
    cards.forEach(card => {
        const clone = card.cloneNode(true);
        clone.classList.add('clone');
        clones.push(clone);
    });
    clones.forEach(clone => track.appendChild(clone));

    let position = 0;
    let animationFrame;

    const animate = () => {
        position -= speed;
        const firstCard = track.children[0];
        const cardWidth = firstCard.offsetWidth + parseInt(getComputedStyle(firstCard).marginRight);

        // Reiniciar posición cuando se alcanza el final
        if (-position >= (track.scrollWidth / 2) + 10) {
            position = 0;
            track.style.transition = 'none';
        } else {
            track.style.transition = 'transform 0.05s linear';
        }

        track.style.transform = `translateX(${position}px)`;
        animationFrame = requestAnimationFrame(animate);
    };

    // Control de hover
    track.addEventListener('mouseenter', () => {
        cancelAnimationFrame(animationFrame);
    });

    track.addEventListener('mouseleave', () => {
        animate();
    });

    // Iniciar animación
    animate();

    // Botones de control
    const controls = document.createElement('div');
    controls.className = 'carousel-controls';
    controls.innerHTML = `
        <button class="carousel-btn prev">‹</button>
        <button class="carousel-btn next">›</button>
    `;
    track.parentElement.appendChild(controls);

    document.querySelector('.prev').addEventListener('click', () => {
        position += (track.children[0].offsetWidth + 24) * 3;
    });

    document.querySelector('.next').addEventListener('click', () => {
        position -= (track.children[0].offsetWidth + 24) * 3;
    });
});



