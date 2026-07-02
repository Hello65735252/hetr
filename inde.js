(function() {
  const tariffsData = [
    { name: 'Москва – Санкт-Петербург', low: '9 500 ₽', mid: '14 200 ₽', high: '18 900 ₽', time: '1–2 дня' },
    { name: 'Москва – Екатеринбург', low: '21 000 ₽', mid: '29 500 ₽', high: '38 000 ₽', time: '3–4 дня' },
    { name: 'СПб – Новосибирск', low: '34 000 ₽', mid: '47 000 ₽', high: '59 000 ₽', time: '5–6 дней' },
    { name: 'Москва – Казань', low: '11 200 ₽', mid: '16 800 ₽', high: '22 500 ₽', time: '1–2 дня' },
    { name: 'Краснодар – Москва', low: '13 900 ₽', mid: '19 400 ₽', high: '26 000 ₽', time: '2–3 дня' },
    { name: 'Екатеринбург – Новосибирск', low: '18 500 ₽', mid: '25 000 ₽', high: '33 000 ₽', time: '2–3 дня' },
    { name: 'Москва – Владивосток', low: '55 000 ₽', mid: '72 000 ₽', high: '89 000 ₽', time: '8–10 дней' },
    { name: 'СПб – Калининград', low: '16 200 ₽', mid: '22 800 ₽', high: '29 500 ₽', time: '3–4 дня' }
  ];

  function populateTariffsTable() {
    const tbody = document.querySelector('#tariffsFullTable tbody');
    if (!tbody) return;
    tbody.innerHTML = tariffsData.map(t =>
      `<tr><td>${t.name}</td><td>${t.low}</td><td>${t.mid}</td><td>${t.high}</td><td>${t.time}</td></tr>`
    ).join('');
  }

  function updateMainTariffDetail(index) {
    const t = tariffsData[index];
    document.getElementById('tariffDetailMain').innerHTML =
      `до 500 кг: ${t.low} | 500–1500 кг: ${t.mid} | от 1500 кг: ${t.high} | Срок: ${t.time}`;
  }

  function showPage(pageId) {
    document.getElementById('homePage').style.display = pageId === 'home' ? 'block' : 'none';
    document.getElementById('tariffsPage').style.display = pageId === 'tariffs' ? 'block' : 'none';
    document.getElementById('trackingDetailPage').style.display = pageId === 'tracking' ? 'block' : 'none';

    document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active'));
    if (pageId === 'home') document.getElementById('navHome').classList.add('active');
    else if (pageId === 'tariffs') document.getElementById('navTariffsPage').classList.add('active');
    else if (pageId === 'tracking') document.getElementById('navTrackingPage').classList.add('active');

    if (pageId === 'tariffs') populateTariffsTable();
    if (pageId === 'tracking') setTimeout(initTrackingMap, 50);
  }

  document.getElementById('navHome').addEventListener('click', (e) => { e.preventDefault(); showPage('home'); });
  document.getElementById('navTariffsPage').addEventListener('click', (e) => { e.preventDefault(); showPage('tariffs'); });
  document.getElementById('navTrackingPage').addEventListener('click', (e) => { e.preventDefault(); showPage('tracking'); });
  document.getElementById('goTariffsFromHome').addEventListener('click', () => showPage('tariffs'));
  document.getElementById('goFullTrackingFromMain').addEventListener('click', () => showPage('tracking'));
  document.getElementById('backToHomeFromTariffs').addEventListener('click', () => showPage('home'));
  document.getElementById('backToHomeFromTracking').addEventListener('click', () => showPage('home'));
  document.getElementById('footerTariffs').addEventListener('click', (e) => { e.preventDefault(); showPage('tariffs'); });
  document.getElementById('footerTracking').addEventListener('click', (e) => { e.preventDefault(); showPage('tracking'); });

  document.getElementById('tariffSelectMain').addEventListener('change', function() {
    updateMainTariffDetail(parseInt(this.value));
  });
  updateMainTariffDetail(0);

  document.getElementById('calcMainBtn').addEventListener('click', () => {
    const from = document.getElementById('fromCityMain').value;
    const to = document.getElementById('toCityMain').value;
    const weight = parseFloat(document.getElementById('weightMain').value) || 0;
    let base = 4500;
    if (from === 'Москва' && to === 'Новосибирск') base = 22000;
    else if (from === 'Санкт-Петербург' && to === 'Новосибирск') base = 24000;
    const total = Math.round((base + weight * 12) / 50) * 50;
    document.getElementById('calcMainResult').innerHTML = `Ориентировочная стоимость: ${total.toLocaleString()} руб.`;
  });

  document.getElementById('trackMainBtn').addEventListener('click', () => {
    document.getElementById('trackMainResult').innerHTML = `
      <span class="track-status in-transit">В пути</span> Москва → СПб<br>Тверь, ожидается 03.07.2026`;
  });

  function initHomeMap() {
    const container = document.getElementById('homeBranchesMap');
    if (!container || container._leaflet_id) return;
    const map = L.map('homeBranchesMap').setView([57.5, 55.0], 4);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CartoDB'
    }).addTo(map);
    const branches = [
      [55.7558, 37.6173],
      [59.9343, 30.3351],
      [55.0415, 82.9346],
      [56.8389, 60.6057]
    ];
    branches.forEach(b => L.marker(b).addTo(map).bindPopup('Филиал Логист-Транс'));
    map.fitBounds(branches);
  }

  let trackingMap = null;

  function initTrackingMap() {
    const container = document.getElementById('trackingMap');
    if (!container) return;
    if (trackingMap) {
      trackingMap.invalidateSize();
      return;
    }
    trackingMap = L.map('trackingMap').setView([56.5, 37.5], 5);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CartoDB'
    }).addTo(trackingMap);
    loadTrackingRoute('LOG-2026-003');
  }

  function loadTrackingRoute(orderId) {
    if (!trackingMap) return;
    trackingMap.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) trackingMap.removeLayer(layer);
    });
    const routes = {
      'LOG-2026-003': {
        points: [
          [55.7558, 37.6173],
          [56.8587, 35.9176],
          [59.9343, 30.3351]
        ],
        names: ['Москва', 'Тверь', 'Санкт-Петербург'],
        timeline: ['Принят на складе', 'Транзит через Тверь', 'Прибыл в регион']
      }
    };
    const route = routes[orderId] || routes['LOG-2026-003'];
    L.polyline(route.points, { color: '#0b1a2e', weight: 4 }).addTo(trackingMap);
    route.points.forEach((p, i) => L.marker(p).addTo(trackingMap).bindPopup(route.names[i]));
    trackingMap.fitBounds(route.points);

    document.getElementById('timelineContainer').innerHTML = route.timeline.map((t, i) => `
      <div class="timeline-item">
        <div class="timeline-dot ${i === route.timeline.length - 1 ? 'active' : ''}"></div>
        <span>${t} – ${route.names[i]}</span>
      </div>`).join('');
  }

  document.getElementById('detailTrackBtn').addEventListener('click', () => {
    loadTrackingRoute(document.getElementById('detailTrackInput').value.trim() || 'LOG-2026-003');
  });

  window.addEventListener('load', () => {
    showPage('home');
    setTimeout(initHomeMap, 200);
  });
})();