document.addEventListener('DOMContentLoaded', function() {
  //Menú hamburguesa
  const menuBtn = document.getElementById('menuBtn');
  const mainNav = document.getElementById('mainNav');
  if (menuBtn && mainNav) {
    menuBtn.addEventListener('click', function() {
      mainNav.classList.toggle('open');
      menuBtn.classList.toggle('open');
    });
  }

  //LOGIN (login.html)
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const u = document.getElementById('username').value;
      const p = document.getElementById('password').value;
      if (u === 'admin' && p === 'barberia') {
        localStorage.setItem('isAdmin', 'true');
        window.location.href = 'admin.html';
      } else {
        alert('Credenciales inválidas');
      }
    });
    return;
  }

  // PROTECCIÓN DE RUTA ADMIN 
  if (window.location.pathname.endsWith('admin.html')) {
    if (localStorage.getItem('isAdmin') !== 'true') {
      window.location.href = 'login.html';
      return;
    }
  }

  // ADMIN: AGENDA (admin.html) 
  const agendaDate    = document.getElementById('agendaDate');
  const agendaTable   = document.getElementById('agendaTable')?.querySelector('tbody');
  const downloadBtn   = document.getElementById('downloadBtn');
  const logoutBtn     = document.getElementById('logoutBtn');
  let reservations    = JSON.parse(localStorage.getItem('reservations') || '[]');

  if (agendaDate && agendaTable) {
    
    // Fecha mínima = hoy
    const today = new Date().toISOString().split('T')[0];
    agendaDate.min  = today;
    agendaDate.value = today;

    function renderAgenda() {
      const sel = agendaDate.value;
      const rows = reservations
        .filter(r => r.date === sel)
        .map(r =>
          `<tr>
            <td>${r.service}</td>
            <td>${r.barber}</td>
            <td>${r.time}</td>
          </tr>`
        ).join('');
      agendaTable.innerHTML = rows || `<tr><td colspan="3">No hay reservas</td></tr>`;
    }

    agendaDate.addEventListener('change', renderAgenda);
    renderAgenda();

    downloadBtn.addEventListener('click', function() {
      const date = agendaDate.value;
      const lines = reservations
        .filter(r => r.date === date)
        .map(r => [r.service, r.barber, r.time].join(','));
      const csv = ['Servicio,Barbero,Hora', ...lines].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `agenda-${date}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });

    logoutBtn.addEventListener('click', function() {
      localStorage.removeItem('isAdmin');
      window.location.href = 'index.html';
    });

    return;
  }


  function formatFecha(fechaISO) {
    const d = new Date(fechaISO);
    return d.toLocaleDateString('es-UY', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }
  function generarSlots() {
    const slots = [];
    for (let h = 9; h < 18; h++) {
      slots.push(`${h}:00`, `${h}:30`);
    }
    return slots;
  }
  function diaDisponible(fechaISO) {
    const [year, month, day] = fechaISO.split('-').map(Number);
    const date = new Date(year, month - 1, day); // mes en base 0
    return date.getDay() !== 0;
  }

  reservations = JSON.parse(localStorage.getItem('reservations') || '[]');

  //Paso 1: reserva.html
  const cards = document.querySelectorAll('.reservation-card');
  if (cards.length) {
    cards.forEach(function(card) {
      card.addEventListener('click', function() {
        const svc = card.dataset.service;
        localStorage.setItem('service', svc);
        window.location.href = 'reserva2.html';
      });
    });
    return;
  }

  //Paso 2: reserva2.html
  const btnTo3 = document.getElementById('toStep3');
  if (btnTo3) {
    btnTo3.addEventListener('click', function() {
      const sel = document.getElementById('barberSelect');
      let elegido = sel.value;
      if (elegido === 'any') {
        const opciones = Array.from(sel.options)
          .filter(opt => opt.value !== 'any')
          .map(opt => opt.value);
        elegido = opciones[Math.floor(Math.random() * opciones.length)];
      }
      localStorage.setItem('barber', elegido);
      window.location.href = 'reserva3.html';
    });
    return;
  }

// Paso 3: reserva3.html
const chosenBarberEl = document.getElementById('chosenBarber');
const datePicker      = document.getElementById('datePicker');
const timeSelect      = document.getElementById('timeSelect');
const btnTo4          = document.getElementById('toStep4');

if (chosenBarberEl) {
  chosenBarberEl.textContent = localStorage.getItem('barber') || '';
}

if (datePicker) {
  const today    = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const maxDay   = new Date(today);
  maxDay.setDate(today.getDate() + 28);

  const minStr = tomorrow.toISOString().split('T')[0];
  const maxStr = maxDay.toISOString().split('T')[0];

  datePicker.min = minStr;
  datePicker.max = maxStr;

  datePicker.addEventListener('change', function() {
    timeSelect.innerHTML = '';

    if (!diaDisponible(this.value)) {
      alert('Ese día no hay turnos disponibles.');
      this.value = '';
      timeSelect.disabled = true;
      return;
    }

    let slots = generarSlots();

    const barber = localStorage.getItem('barber');
    const booked = reservations
      .filter(r => r.barber === barber && r.date === this.value)
      .map(r => r.time);
    const available = slots.filter(h => !booked.includes(h));

    if (!available.length) {
      alert(`No quedan turnos libres para ${barber} ese día.`);
      this.value = '';
      timeSelect.disabled = true;
      return;
    }

    available.forEach(h => {
      const opt = document.createElement('option');
      opt.value = h;
      opt.textContent = h;
      timeSelect.appendChild(opt);
    });
    timeSelect.disabled = false;
  });
}

if (btnTo4) {
  btnTo4.addEventListener('click', function() {
    if (!datePicker.value)   return alert('Selecciona una fecha.');
    if (timeSelect.disabled || !timeSelect.value)
                              return alert('Selecciona una hora.');
    localStorage.setItem('date', datePicker.value);
    localStorage.setItem('time', timeSelect.value);
    window.location.href = 'reserva4.html';
  });
  return;
}

  // Paso 4: reserva4.html
  const sumSvc = document.getElementById('sumService');
  if (sumSvc) {
    sumSvc.textContent = localStorage.getItem('service');
    document.getElementById('sumBarber').textContent = localStorage.getItem('barber');
    document.getElementById('sumDate').textContent   = formatFecha(localStorage.getItem('date'));
    document.getElementById('sumTime').textContent   = localStorage.getItem('time');

    const form  = document.getElementById('finalForm');
    const msg   = document.getElementById('successMessage');
    const exitB = document.getElementById('exitBtn');

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      // Registrar reserva
      reservations.push({
        service: localStorage.getItem('service'),
        barber:  localStorage.getItem('barber'),
        date:    localStorage.getItem('date'),
        time:    localStorage.getItem('time')
      });
      localStorage.setItem('reservations', JSON.stringify(reservations));

      form.style.display      = 'none';
      msg.style.display       = 'block';
    });

    exitB.addEventListener('click', function() {
      localStorage.removeItem('service');
      localStorage.removeItem('barber');
      localStorage.removeItem('date');
      localStorage.removeItem('time');
      window.location.href = 'index.html';
    });
  }
});
