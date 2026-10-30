
/* ================================================
   INVITACIÓN DE ELIAM RAFAEL
   app.js - Versión actualizada
   13 capítulos: Mes 0 al Mes 12
   ================================================ */

(() => {
  'use strict';

  // CONFIGURACIÓN
  const config = {
    date: '',
    time: '',
    place: '',
    address: '',
    mapsUrl: '',
    whatsapp: '',
    wishesEmail: 'eliam.rafael@outlook.com',
    musicSrc: '',
    musicData: '',
    musicName: '',
    months: [],
    ...(window.INVITATION_CONFIG || {})
  };

  const $ = selector => document.querySelector(selector);
  const $$ = selector => document.querySelectorAll(selector);

  const on = (selector, event, handler, options) => {
    $(selector)?.addEventListener(event, handler, options);
  };

  let toastTimer;
  let importingMusic = false;

  // ================================================
  // 1. NOTIFICACIONES
  // ================================================

  function toast(message) {
    const node = $('#toast');
    if (!node) return;

    node.textContent = message;
    node.classList.add('show');

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      node.classList.remove('show');
    }, 4100);
  }

  // ================================================
  // 2. REPRODUCTOR MUSICAL FLOTANTE
  // ================================================

  const audio = $('#partyAudio');
  const musicButton = $('#musicBtn');

  function currentMusic() {
    return config.musicData || config.musicSrc || '';
  }

  function updateMusicButton() {
    if (!audio || !musicButton) return;

    const playing = Boolean(currentMusic()) && !audio.paused;

    musicButton.classList.toggle('playing', playing);
    musicButton.setAttribute('aria-pressed', String(playing));

    musicButton.setAttribute(
      'aria-label',
      playing ? 'Pausar música' : 'Reproducir música'
    );

    const icon = $('#musicIcon');
    if (icon) {
      icon.textContent = playing ? '❚❚' : '▶';
    }

    const text = $('#musicBtnText');
    if (text) {
      text.textContent = playing ? 'Pausar' : 'Escuchar';
    }
  }

  function updateMusicState() {
    const state = $('#musicState');

    if (state) {
      state.textContent = currentMusic()
        ? `✓ Canción seleccionada: ${
            config.musicName ||
            config.musicSrc ||
            'música personalizada'
          }`
        : 'Todavía no se ha seleccionado una canción.';
    }

    const removeButton = $('#removeMusicBtn');

    if (removeButton) {
      removeButton.hidden = !currentMusic();
    }
  }

  function syncMusic() {
    if (!audio) return;

    audio.pause();
    audio.removeAttribute('src');

    if (currentMusic()) {
      audio.src = currentMusic();
      audio.load();
    }

    updateMusicButton();
    updateMusicState();
  }

  if (audio) {
    audio.volume = 0.48;

    ['play', 'pause', 'ended'].forEach(event => {
      audio.addEventListener(event, updateMusicButton);
    });
  }

  on('#musicBtn', 'click', async () => {
    if (!audio || !currentMusic()) {
      toast('La música todavía no está configurada.');
      return;
    }

    if (!audio.paused) {
      audio.pause();
      return;
    }

    try {
      await audio.play();
    } catch (error) {
      toast(
        'No se pudo reproducir la música. Revisa la ruta del audio.'
      );
    }
  });

  // IMPORTAR MÚSICA (SI CONSERVAS EL FORMULARIO)

  on('#musicInput', 'change', event => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop().toLowerCase();

    if (!['mp3', 'm4a', 'ogg', 'wav'].includes(extension)) {
      toast('Elige un archivo MP3, M4A, OGG o WAV.');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      toast('El archivo debe pesar menos de 12 MB.');
      return;
    }

    importingMusic = true;

    if ($('#downloadBtn')) {
      $('#downloadBtn').disabled = true;
    }

    const reader = new FileReader();

    reader.onload = () => {
      config.musicData = String(reader.result || '');
      config.musicSrc = '';
      config.musicName = file.name;

      importingMusic = false;

      if ($('#downloadBtn')) {
        $('#downloadBtn').disabled = false;
      }

      syncMusic();

      toast('Canción agregada. Usa el botón circular.');
    };

    reader.onerror = () => {
      importingMusic = false;

      if ($('#downloadBtn')) {
        $('#downloadBtn').disabled = false;
      }

      toast('No se pudo cargar el audio.');
    };

    reader.readAsDataURL(file);
  });

  on('#removeMusicBtn', 'click', () => {
    config.musicData = '';
    config.musicSrc = '';
    config.musicName = '';

    if ($('#musicInput')) {
      $('#musicInput').value = '';
    }

    syncMusic();
    toast('Se quitó la canción.');
  });

  // ================================================
  // 3. FECHAS Y CUENTA REGRESIVA
  // ================================================

  function displayDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) {
      return 'Por confirmar';
    }

    const date = new Date(`${value}T12:00:00Z`);

    if (Number.isNaN(date.getTime())) {
      return 'Por confirmar';
    }

    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(date);
  }

  function displayTime(value) {
    if (!/^\d{2}:\d{2}$/.test(value || '')) {
      return 'Por confirmar';
    }

    const [hours, minutes] = value.split(':').map(Number);

    return new Intl.DateTimeFormat('es-MX', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    }).format(
      new Date(Date.UTC(2026, 0, 1, hours, minutes))
    );
  }

  function updateCountdown() {
    const countdown = $('#countdown');
    const pending = $('#countdownPending');

    if (!countdown || !pending) return;

    if (!config.date) {
      countdown.hidden = true;
      pending.hidden = false;

      pending.textContent =
        'La cuenta regresiva comenzará cuando confirmemos la fecha.';

      return;
    }

    // Horario de Veracruz: UTC-06:00
    const target = new Date(
      `${config.date}T${config.time || '00:00'}:00-06:00`
    );

    if (Number.isNaN(target.getTime())) {
      countdown.hidden = true;
      pending.hidden = false;
      pending.textContent = 'Revisa la fecha y hora del evento.';
      return;
    }

    const difference = target.getTime() - Date.now();

    if (difference <= 0) {
      countdown.hidden = true;
      pending.hidden = false;
      pending.textContent = '¡Llegó el gran día de Eliam Rafael!';
      return;
    }

    countdown.hidden = false;
    pending.hidden = true;

    const parts = {
      '#d': Math.floor(difference / 86400000),
      '#h': Math.floor((difference % 86400000) / 3600000),
      '#m': Math.floor((difference % 3600000) / 60000),
      '#s': Math.floor((difference % 60000) / 1000)
    };

    Object.entries(parts).forEach(([selector, number]) => {
      if ($(selector)) {
        $(selector).textContent =
          String(number).padStart(2, '0');
      }
    });
  }

  // ================================================
  // 4. CARRUSEL CINEMATOGRÁFICO
  // ================================================

  let cinemaIndex = 0;
  let cinemaFrame = 0;
  let cinemaLightboxIndex = 0;
  let cinemaPreviousFocus = null;
  let cinemaPhotos = [];

  // ACTUALIZAR CAPÍTULO ACTIVO

  function highlightCinema(index) {
    const track = $('#monthsGrid');
    if (!track) return;

    const cards = [...track.children];
    if (!cards.length) return;

    cinemaIndex = Math.max(
      0,
      Math.min(index, cards.length - 1)
    );

    cards.forEach((card, i) => {
      card.classList.toggle(
        'is-active',
        i === cinemaIndex
      );

      card.dataset.side =
        i < cinemaIndex
          ? 'left'
          : i > cinemaIndex
            ? 'right'
            : 'center';

      card.setAttribute(
        'aria-current',
        String(i === cinemaIndex)
      );
    });

    // INDICADOR AUTOMÁTICO 01/13 ... 13/13

    if ($('#cinemaCounter')) {
      $('#cinemaCounter').textContent =
        `${String(cinemaIndex + 1).padStart(2, '0')} / ` +
        `${String(cards.length).padStart(2, '0')}`;
    }

    // BARRA DE PROGRESO

    if ($('#cinemaProgressFill')) {
      $('#cinemaProgressFill').style.width =
        `${((cinemaIndex + 1) / cards.length) * 100}%`;
    }

    if ($('#cinemaProgress')) {
      $('#cinemaProgress').setAttribute(
        'aria-valuenow',
        String(cinemaIndex + 1)
      );

      $('#cinemaProgress').setAttribute(
        'aria-valuemax',
        String(cards.length)
      );
    }

    // CONTROL DE FLECHAS

    if ($('#cinemaPrev')) {
      $('#cinemaPrev').disabled = cinemaIndex === 0;
    }

    if ($('#cinemaNext')) {
      $('#cinemaNext').disabled =
        cinemaIndex === cards.length - 1;
    }
  }

  // DESPLAZAMIENTO CINEMATOGRÁFICO

  function moveCinemaTo(index) {
    const track = $('#monthsGrid');
    if (!track) return;

    const cards = [...track.children];
    if (!cards.length) return;

    const next = Math.max(
      0,
      Math.min(index, cards.length - 1)
    );

    const card = cards[next];

    const trackBox = track.getBoundingClientRect();
    const box = card.getBoundingClientRect();

    const delta =
      (box.left + box.width / 2) -
      (trackBox.left + trackBox.width / 2);

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    track.scrollTo({
      left: track.scrollLeft + delta,
      behavior: reducedMotion ? 'auto' : 'smooth'
    });

    highlightCinema(next);
  }

  // DETECTAR TARJETA CENTRAL AL DESLIZAR

  function syncCinemaFromScroll() {
    cancelAnimationFrame(cinemaFrame);

    cinemaFrame = requestAnimationFrame(() => {
      const track = $('#monthsGrid');

      if (!track || !track.children.length) return;

      const center =
        track.getBoundingClientRect().left +
        track.clientWidth / 2;

      const cards = [...track.children];

      const distances = cards.map(card => {
        const rect = card.getBoundingClientRect();

        return Math.abs(
          rect.left + rect.width / 2 - center
        );
      });

      const closest = distances.indexOf(
        Math.min(...distances)
      );

      highlightCinema(closest);
    });
  }

  // ================================================
  // 5. VISUALIZADOR DE FOTOGRAFÍAS
  // ================================================

  function updateCinemaLightbox() {
    const month = cinemaPhotos[cinemaLightboxIndex];
    if (!month) return;

    if ($('#cinemaLightboxImage')) {
      $('#cinemaLightboxImage').src = month.photo;

      $('#cinemaLightboxImage').alt =
        `Eliam Rafael · ${month.title}`;
    }

    if ($('#cinemaLightboxCaption')) {
      $('#cinemaLightboxCaption').textContent =
        `${month.title} · ${month.caption}`;
    }

    if ($('#cinemaLightboxPrev')) {
      $('#cinemaLightboxPrev').disabled =
        !cinemaPhotos
          .slice(0, cinemaLightboxIndex)
          .some(photo => photo.photo);
    }

    if ($('#cinemaLightboxNext')) {
      $('#cinemaLightboxNext').disabled =
        !cinemaPhotos
          .slice(cinemaLightboxIndex + 1)
          .some(photo => photo.photo);
    }
  }

  function openCinemaPhoto(index) {
    if (
      !cinemaPhotos[index]?.photo ||
      !$('#cinemaLightbox')
    ) return;

    cinemaPreviousFocus = document.activeElement;
    cinemaLightboxIndex = index;

    updateCinemaLightbox();

    $('#cinemaLightbox').hidden = false;
    $('#cinemaLightboxClose')?.focus();
  }

  function moveCinemaLightbox(direction) {
    let next = cinemaLightboxIndex + direction;

    while (
      next >= 0 &&
      next < cinemaPhotos.length &&
      !cinemaPhotos[next].photo
    ) {
      next += direction;
    }

    if (next < 0 || next >= cinemaPhotos.length) {
      return;
    }

    cinemaLightboxIndex = next;

    updateCinemaLightbox();
    moveCinemaTo(next);
  }

  function closeCinemaLightbox() {
    const lightbox = $('#cinemaLightbox');

    if (!lightbox || lightbox.hidden) return;

    lightbox.hidden = true;

    $('#cinemaLightboxImage')?.removeAttribute('src');

    cinemaPreviousFocus?.focus?.();
  }

  // ================================================
  // 6. GENERAR LOS 13 CAPÍTULOS
  // ================================================

  function renderMonths() {
    const track = $('#monthsGrid');
    if (!track) return;

    track.replaceChildren();

    const months = Array.isArray(config.months)
      ? config.months
      : [];

    // MES 0 A MES 12 = 13 CAPÍTULOS
    const totalChapters = months.length;

    cinemaPhotos = Array.from(
      { length: totalChapters },
      (_, i) => ({
        title: months[i]?.title || `Mes ${i}`,

        headline: months[i]?.headline || (
          i === 0
            ? 'Aquí comienza mi historia'
            : months[i]?.title === 'Mes 12'
              ? '¡Mi primer añito!'
              : `Mi aventura ${String(i).padStart(2, '0')}`
        ),

        caption: months[i]?.caption ||
          'Un recuerdo inolvidable.',

        photo: String(months[i]?.photo || '').trim()
      })
    );

    cinemaPhotos.forEach((month, index) => {

      // TARJETA PRINCIPAL

      const card = document.createElement('article');
      card.className = 'cinema-card';
      card.tabIndex = 0;

      card.setAttribute('role', 'group');

      card.setAttribute(
        'aria-label',
        `Capítulo ${index + 1} de ${totalChapters}: ${month.title}`
      );

      // CONTENEDOR DE IMAGEN

      const cover = document.createElement('div');
      cover.className = 'cinema-cover';

      // ETIQUETA DE CAPÍTULO

      const label = document.createElement('span');
      label.className = 'cinema-cover-label';

      label.textContent =
        `CAPÍTULO ${String(index + 1).padStart(2, '0')}`;

      cover.appendChild(label);

      // IMAGEN PROVISIONAL

      const placeholder = document.createElement('div');
      placeholder.className = 'cinema-placeholder';

      const number = document.createElement('strong');

      number.textContent =
        String(index + 1).padStart(2, '0');

      placeholder.appendChild(number);
      cover.appendChild(placeholder);

      // FOTOGRAFÍA REAL

      if (month.photo) {
        const image = document.createElement('img');

        image.loading = index < 3 ? 'eager' : 'lazy';

        image.alt =
          `Fotografía de Eliam Rafael · ${month.title}`;

        image.src = month.photo;

        image.addEventListener('load', () => {
          placeholder.remove();
        });

        image.addEventListener('error', () => {
          image.remove();
          month.photo = '';
        });

        cover.appendChild(image);
      }

      // TEXTOS DEL CAPÍTULO

      const copy = document.createElement('div');
      copy.className = 'cinema-card-copy';

      const episode = document.createElement('p');
      episode.className = 'cinema-month';
      episode.textContent = month.title;

      const heading = document.createElement('h3');
      heading.className = 'cinema-title';
      heading.textContent = month.headline;

      const caption = document.createElement('p');
      caption.className = 'cinema-desc';
      caption.textContent = month.caption;

      copy.append(
        episode,
        heading,
        caption
      );

      card.append(cover, copy);

      // INTERACCIÓN CON TARJETAS

      const activateCard = () => {
        if (cinemaIndex !== index) {
          moveCinemaTo(index);
        } else if (month.photo) {
          openCinemaPhoto(index);
        }
      };

      card.addEventListener('click', activateCard);

      card.addEventListener('keydown', event => {
        if (
          event.key === 'Enter' ||
          event.key === ' '
        ) {
          event.preventDefault();
          activateCard();
        }
      });

      track.appendChild(card);
    });

    // INICIAR EN MES 0

    if (totalChapters > 0) {
      highlightCinema(0);

      requestAnimationFrame(() => {
        moveCinemaTo(0);
      });
    }
  }

  // ================================================
  // 7. CONTROLES DEL CARRUSEL
  // ================================================

  on('#cinemaPrev', 'click', () => {
    moveCinemaTo(cinemaIndex - 1);
  });

  on('#cinemaNext', 'click', () => {
    moveCinemaTo(cinemaIndex + 1);
  });

  on(
    '#monthsGrid',
    'scroll',
    syncCinemaFromScroll,
    { passive: true }
  );

  // NAVEGACIÓN CON TECLADO

  on('#monthsGrid', 'keydown', event => {
    if (
      event.key === 'ArrowRight' ||
      event.key === 'ArrowLeft'
    ) {
      event.preventDefault();

      moveCinemaTo(
        cinemaIndex +
        (event.key === 'ArrowRight' ? 1 : -1)
      );
    }
  });

  // CENTRAR EN CAMBIOS DE PANTALLA

  window.addEventListener('resize', () => {
    moveCinemaTo(cinemaIndex);
  });

  // CONTROLES DEL VISUALIZADOR

  on(
    '#cinemaLightboxClose',
    'click',
    closeCinemaLightbox
  );

  on('#cinemaLightbox', 'click', event => {
    if (event.target.id === 'cinemaLightbox') {
      closeCinemaLightbox();
    }
  });

  on('#cinemaLightboxPrev', 'click', () => {
    moveCinemaLightbox(-1);
  });

  on('#cinemaLightboxNext', 'click', () => {
    moveCinemaLightbox(1);
  });

  document.addEventListener('keydown', event => {
    if ($('#cinemaLightbox')?.hidden !== false) {
      return;
    }

    if (event.key === 'Escape') {
      closeCinemaLightbox();
    }

    if (event.key === 'ArrowLeft') {
      moveCinemaLightbox(-1);
    }

    if (event.key === 'ArrowRight') {
      moveCinemaLightbox(1);
    }
  });

  // ================================================
  // 8. INFORMACIÓN DE LA CELEBRACIÓN
  // ================================================

  function render() {

    if ($('#displayDate')) {
      $('#displayDate').textContent =
        displayDate(config.date);
    }

    if ($('#displayTime')) {
      $('#displayTime').textContent =
        displayTime(config.time);
    }

    if ($('#displayPlace')) {
      $('#displayPlace').textContent =
        config.place || 'Por confirmar';
    }

    if ($('#displayAddress')) {
      $('#displayAddress').textContent =
        config.address || '';
    }

    // GOOGLE MAPS

    const link = $('#mapsLink');

    if (link) {
      const fallback = config.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.address)}`
        : '';

      const url = config.mapsUrl || fallback;

      if (/^https:\/\//i.test(url)) {
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';

        link.setAttribute(
          'aria-disabled',
          'false'
        );
      } else {
        link.href = '#detalles';
        link.removeAttribute('target');

        link.setAttribute(
          'aria-disabled',
          'true'
        );
      }
    }

    // WHATSAPP

    if ($('#waHint')) {
      $('#waHint').textContent = config.whatsapp
        ? 'La confirmación se preparará para enviar por WhatsApp a la familia.'
        : 'Aún no se ha configurado un número. Podrás elegir el chat en WhatsApp.';
    }

    updateCountdown();
    renderMonths();
  }

  // ================================================
  // 9. VENTANAS EMERGENTES
  // ================================================

  function openModal(id) {
    const modal = $(`#${id}`);
    if (!modal) return;

    modal.classList.add('open');

    document.body.style.overflow = 'hidden';

    modal.querySelector('input')?.focus();
  }

  function closeModal(id) {
    const modal = $(`#${id}`);
    if (!modal) return;

    modal.classList.remove('open');

    document.body.style.overflow = '';
  }

  $$('[data-close]').forEach(button => {
    button.addEventListener('click', () => {
      closeModal(button.dataset.close);
    });
  });

  $$('.overlay').forEach(overlay => {
    overlay.addEventListener('click', event => {
      if (event.target === overlay) {
        closeModal(overlay.id);
      }
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      $$('.overlay.open').forEach(overlay => {
        closeModal(overlay.id);
      });
    }
  });

  // ================================================
  // 10. PERSONALIZACIÓN OPCIONAL
  // ================================================

  const fields = [
    ['dateInput', 'date'],
    ['timeInput', 'time'],
    ['placeInput', 'place'],
    ['addressInput', 'address'],
    ['mapsInput', 'mapsUrl'],
    ['phoneInput', 'whatsapp']
  ];

  function captureFields() {
    fields.forEach(([id, key]) => {
      const field = $(`#${id}`);

      if (field) {
        config[key] = field.value.trim();
      }
    });

    config.whatsapp =
      String(config.whatsapp).replace(/\D/g, '');
  }

  // El botón Personalizar puede estar eliminado.
  on('#editBtn', 'click', () => {
    fields.forEach(([id, key]) => {
      if ($(`#${id}`)) {
        $(`#${id}`).value = config[key] || '';
      }
    });

    updateMusicState();
    openModal('editModal');
  });

  on('#editForm', 'submit', event => {
    event.preventDefault();

    captureFields();
    render();
    closeModal('editModal');

    toast('Cambios aplicados a la vista previa.');
  });

  // EXPORTAR CONFIGURACIÓN

  on('#downloadBtn', 'click', () => {
    if (importingMusic) return;

    captureFields();
    render();

    const json = JSON.stringify(config, null, 2)
      .replace(/</g, '\\u003c')
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');

    const output =
      `// Configuración de Eliam Rafael.\n` +
      `window.INVITATION_CONFIG = ${json};\n`;

    const url = URL.createObjectURL(
      new Blob([output], {
        type: 'text/javascript;charset=utf-8'
      })
    );

    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = 'config.js';

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 5000);

    toast('Configuración descargada.');
  });

  // ================================================
  // 11. CONFIRMACIÓN DE ASISTENCIA
  // ================================================

  on('#rsvpBtn', 'click', () => {
    openModal('rsvpModal');
  });

  on('#rsvpForm', 'submit', event => {
    event.preventDefault();

    const name =
      $('#guestName')?.value.trim() || '';

    const guests =
      $('#guestCount')?.value || '1';

    if (!name) return;

    const message =
      `¡Hola! Confirmo mi asistencia al primer cumpleaños de Eliam Rafael.\n` +
      `Nombre: ${name}\n` +
      `Personas: ${guests}\n` +
      `¡Nos vemos!`;

    const base = config.whatsapp
      ? `https://wa.me/${String(config.whatsapp).replace(/\D/g, '')}`
      : 'https://api.whatsapp.com/send';

    const target =
      `${base}?text=${encodeURIComponent(message)}`;

    window.open(
      target,
      '_blank',
      'noopener,noreferrer'
    );

    closeModal('rsvpModal');
  });

  on('#mapsLink', 'click', event => {
    if (
      event.currentTarget.getAttribute('aria-disabled') === 'true'
    ) {
      event.preventDefault();
    }
  });

  // ================================================
  // 12. LIBRO DE BUENOS DESEOS
  // ================================================

  function wishData() {
    const name =
      $('#wishName')?.value.trim() || '';

    const relation =
      $('#wishRelation')?.value.trim() || '';

    const message =
      $('#wishMessage')?.value.trim() || '';

    if (!name || !message) {
      return null;
    }

    const subject =
      'Buenos deseos para Eliam Rafael';

    const body = [
      'Hola Eliam Rafael,',
      '',
      'Te comparto este mensaje con mucho cariño:',
      '',
      message,
      '',
      'Con cariño,',
      name,
      relation ? `(${relation})` : ''
    ].join('\n');

    return { subject, body };
  }

  // ENVIAR POR EMAIL

  on('#wishForm', 'submit', event => {
    event.preventDefault();

    const wish = wishData();

    if (!wish) {
      toast('Escribe tu nombre y un deseo para Eliam.');
      return;
    }

    const address =
      config.wishesEmail ||
      'eliam.rafael@outlook.com';

    window.location.href =
      `mailto:${address}` +
      `?subject=${encodeURIComponent(wish.subject)}` +
      `&body=${encodeURIComponent(wish.body)}`;

    toast(
      'Tu correo está preparado. Pulsa Enviar en tu aplicación de correo.'
    );
  });

  // COPIAR MENSAJE

  on('#copyWishBtn', 'click', async () => {
    const wish = wishData();

    if (!wish) {
      toast('Escribe tu nombre y tu deseo para copiarlo.');
      return;
    }

    const text =
      `${wish.subject}\n\n${wish.body}`;

    try {
      await navigator.clipboard.writeText(text);

      toast('Mensaje copiado.');
    } catch (error) {
      const area = document.createElement('textarea');

      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';

      document.body.appendChild(area);
      area.select();

      const copied = document.execCommand('copy');

      area.remove();

      toast(
        copied
          ? 'Mensaje copiado.'
          : 'Selecciona el mensaje y cópialo manualmente.'
      );
    }
  });


  // ================================================
  // 13. INICIALIZACIÓN Y MÚSICA AUTOMÁTICA
  // ================================================

  function iniciarMusica() {
    if (!audio || !currentMusic() || !audio.paused) {
      return;
    }

    audio.play()
      .then(() => {
        quitarActivacionInicial();
        updateMusicButton();
      })
      .catch(() => {
        // El navegador requiere interacción del usuario.
        // La música comenzará con el primer toque.
      });
  }

  function quitarActivacionInicial() {
    document.removeEventListener(
      'pointerdown',
      activarEnPrimeraInteraccion
    );

    document.removeEventListener(
      'keydown',
      activarEnPrimeraInteraccion
    );
  }

  function activarEnPrimeraInteraccion(event) {
    // Evitar que un toque al reproductor
    // reproduzca y pause la canción a la vez.
    const esBotonMusica =
      event.target instanceof Element &&
      event.target.closest('#musicBtn');

    quitarActivacionInicial();

    if (!esBotonMusica) {
      iniciarMusica();
    }
  }

  // Cargar configuración y página.
  syncMusic();
  render();

  setInterval(updateCountdown, 1000);

  // Reproducir al abrir la página si está permitido.
  iniciarMusica();

  // Alternativa para navegadores que bloquean autoplay.
  document.addEventListener(
    'pointerdown',
    activarEnPrimeraInteraccion
  );

  document.addEventListener(
    'keydown',
    activarEnPrimeraInteraccion
  );

})();
