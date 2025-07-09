// Script para poblar localStorage con pedidos demo en fechas relativas a hoy, semana, mes y año
(function() {
  function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }
  function formatDateLocal(date) {
    // Devuelve YYYY-MM-DDTHH:mm:ss en local
    const pad = n => n.toString().padStart(2, '0');
    return date.getFullYear() + '-' + pad(date.getMonth()+1) + '-' + pad(date.getDate()) + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
  }
  const now = new Date();
  // Forzar el mes a julio (mes 6, porque en JS enero=0)
  const mesJulio = 6;
  function fechaEnJulio(diasAtras) {
    const d = new Date(now);
    d.setMonth(mesJulio);
    d.setDate(now.getDate() - diasAtras);
    return formatDateLocal(d);
  }
  const pedidosDemo = [
    // Pedido de hoy (julio)
    {
      productos: [
        { nombre: "Polo Tommy", cantidad: 2 },
        { nombre: "Camisa Blanca", cantidad: 1 }
      ],
      cliente: { nombre: "Juan Pérez", dni: "12345678", telefono: "912345678", email: "juan@mail.com" },
      direccion: "Calle 123, Ica",
      referencia: "Frente a la plaza",
      subtotal: 180,
      envio: 15,
      total: 195,
      fecha: fechaEnJulio(0),
      estado: "Pendiente",
      pago: { name: "Juan Pérez", number: "4111111111111111", expiry: "12/25", cvv: "123" }
    },
    // Pedido de hace 2 días (julio)
    {
      productos: [
        { nombre: "Polera Mujer", cantidad: 1 }
      ],
      cliente: { nombre: "Ana Torres", dni: "87654321", telefono: "987654321", email: "ana@mail.com" },
      direccion: "Av. Lima 456, Ica",
      referencia: "Cerca al parque",
      subtotal: 120,
      envio: 15,
      total: 135,
      fecha: fechaEnJulio(2),
      estado: "Completado",
      pago: { name: "Ana Torres", number: "4111111111111111", expiry: "11/25", cvv: "456" }
    },
    // Pedido de hace 10 días (julio)
    {
      productos: [
        { nombre: "Polo Tommy", cantidad: 1 },
        { nombre: "Camisa Celeste", cantidad: 2 }
      ],
      cliente: { nombre: "Carlos Ruiz", dni: "11223344", telefono: "923456789", email: "carlos@mail.com" },
      direccion: "Jr. Arequipa 789, Ica",
      referencia: "Edificio azul",
      subtotal: 200,
      envio: 15,
      total: 215,
      fecha: fechaEnJulio(10),
      estado: "Pendiente",
      pago: { name: "Carlos Ruiz", number: "4111111111111111", expiry: "10/25", cvv: "789" }
    },
    // Pedido de hace 20 días (julio)
    {
      productos: [
        { nombre: "Polo Blanco", cantidad: 3 }
      ],
      cliente: { nombre: "Lucía Gómez", dni: "55667788", telefono: "934567890", email: "lucia@mail.com" },
      direccion: "Calle Los Olivos 321, Ica",
      referencia: "Tienda verde",
      subtotal: 90,
      envio: 15,
      total: 105,
      fecha: fechaEnJulio(20),
      estado: "Completado",
      pago: { name: "Lucía Gómez", number: "4111111111111111", expiry: "09/25", cvv: "321" }
    },
    // Pedido de hace 25 días (julio)
    {
      productos: [
        { nombre: "Camisa Azul Marino", cantidad: 1 }
      ],
      cliente: { nombre: "Pedro Salas", dni: "99887766", telefono: "945678901", email: "pedro@mail.com" },
      direccion: "Av. San Martín 654, Ica",
      referencia: "Cerca al hospital",
      subtotal: 70,
      envio: 15,
      total: 85,
      fecha: fechaEnJulio(25),
      estado: "Completado",
      pago: { name: "Pedro Salas", number: "4111111111111111", expiry: "08/25", cvv: "654" }
    }
  ];
  // --- AGREGAR pedidos demo a los existentes, sin sobrescribir ---
  const pedidosExistentes = JSON.parse(localStorage.getItem('pedidos')) || [];
  // Evitar duplicados por fecha, cliente y total
  const pedidosUnicos = [...pedidosExistentes];
  pedidosDemo.forEach(demo => {
    const yaExiste = pedidosExistentes.some(p => p.fecha === demo.fecha && p.total === demo.total && p.cliente?.dni === demo.cliente?.dni);
    if (!yaExiste) pedidosUnicos.push(demo);
  });
  localStorage.setItem('pedidos', JSON.stringify(pedidosUnicos));
  alert('Pedidos demo agregados a los existentes en localStorage. ¡Prueba los filtros de día, semana, mes y año!');
})();

// --- SCRIPT PARA CORREGIR FECHAS DE PEDIDOS A HOY ---
window.cambiarFechasPedidosAHoy = function() {
  const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
  const hoy = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const fechaHoy = hoy.getFullYear() + '-' + pad(hoy.getMonth()+1) + '-' + pad(hoy.getDate());
  pedidos.forEach(pedido => {
    // Mantener la hora original si existe
    let hora = '12:00:00';
    if (pedido.fecha && pedido.fecha.includes('T')) {
      hora = pedido.fecha.split('T')[1].slice(0,8);
    }
    pedido.fecha = fechaHoy + 'T' + hora;
  });
  localStorage.setItem('pedidos', JSON.stringify(pedidos));
  alert('¡Fechas de todos los pedidos cambiadas a hoy! Ahora puedes probar los filtros.');
}

// --- SCRIPT PARA BORRAR TODOS LOS PEDIDOS ---
window.borrarTodosLosPedidos = function() {
  localStorage.removeItem('pedidos');
  alert('¡Todos los pedidos han sido borrados!');
} 