
export function initializeMap(container) {
  // Original vanilla JS ported safely inside the container scope
  /* ============================================================
   Interactive India Map – Temple Explorer
   Application Logic
   ============================================================ */

// ── Temple Data ──
const templesByState = {
  'IN-RJ': [
    { name: 'Brahma Temple', deity: 'Lord Brahma', speciality: ['Visa', 'Wealth'], x: 45, y: 55 },
    { name: 'Karni Mata Temple', deity: 'Karni Mata', speciality: ['Health', 'House'], x: 65, y: 35 }
  ],
  'IN-MH': [
    { name: 'Siddhivinayak Temple', deity: 'Lord Ganesha', speciality: ['Visa', 'Education'], x: 35, y: 60 },
    { name: 'Trimbakeshwar', deity: 'Lord Shiva', speciality: ['Health', 'Wealth'], x: 55, y: 30 }
  ],
  'IN-TN': [
    { name: 'Meenakshi Temple', deity: 'Goddess Meenakshi', speciality: ['House', 'Health'], x: 45, y: 55 },
    { name: 'Ramanathaswamy', deity: 'Lord Shiva', speciality: ['Visa', 'Wealth'], x: 60, y: 75 }
  ],
  'IN-KA': [
    { name: 'Chamundeshwari', deity: 'Goddess Chamundi', speciality: ['Health', 'Education'], x: 50, y: 65 },
    { name: 'Udupi Krishna', deity: 'Lord Krishna', speciality: ['Wealth', 'House'], x: 30, y: 35 }
  ],
  'IN-KL': [
    { name: 'Padmanabhaswamy', deity: 'Lord Vishnu', speciality: ['Wealth', 'Visa'], x: 45, y: 75 },
    { name: 'Guruvayur Temple', deity: 'Lord Krishna', speciality: ['Health', 'Education'], x: 50, y: 30 }
  ],
  'IN-AP': [
    { name: 'Tirupati Balaji', deity: 'Lord Venkateswara', speciality: ['Visa', 'Wealth', 'Education'], x: 55, y: 40 },
    { name: 'Srikalahasti', deity: 'Lord Shiva', speciality: ['Health'], x: 60, y: 30 }
  ],
  'IN-TG': [
    { name: 'Yadadri Temple', deity: 'Lord Lakshmi Narasimha', speciality: ['House', 'Health'], x: 55, y: 45 },
    { name: 'Birla Mandir', deity: 'Lord Venkateswara', speciality: ['Visa', 'Education'], x: 40, y: 40 }
  ],
  'IN-UP': [
    { name: 'Kashi Vishwanath', deity: 'Lord Shiva', speciality: ['Visa', 'Wealth', 'Health'], x: 75, y: 55 },
    { name: 'Hanuman Garhi', deity: 'Lord Hanuman', speciality: ['House', 'Health'], x: 55, y: 65 }
  ],
  'IN-GJ': [
    { name: 'Somnath Temple', deity: 'Lord Shiva', speciality: ['Wealth', 'Visa'], x: 25, y: 70 },
    { name: 'Dwarkadhish', deity: 'Lord Krishna', speciality: ['Education', 'Health'], x: 15, y: 45 }
  ],
  'IN-WB': [
    { name: 'Dakshineswar Kali', deity: 'Goddess Kali', speciality: ['Health', 'House'], x: 70, y: 55 },
    { name: 'Kalighat Temple', deity: 'Goddess Kali', speciality: ['Visa', 'Wealth'], x: 65, y: 65 }
  ],
  'IN-MP': [
    { name: 'Mahakaleshwar', deity: 'Lord Shiva', speciality: ['Visa', 'Health'], x: 40, y: 55 },
    { name: 'Khajuraho Temples', deity: 'Various', speciality: ['Education', 'Wealth'], x: 65, y: 40 }
  ],
  'IN-BR': [
    { name: 'Mahavir Mandir', deity: 'Lord Hanuman', speciality: ['Health', 'House'], x: 50, y: 40 },
    { name: 'Vishnupad Temple', deity: 'Lord Vishnu', speciality: ['Visa', 'Wealth'], x: 45, y: 65 }
  ],
  'IN-OR': [
    { name: 'Jagannath Temple', deity: 'Lord Jagannath', speciality: ['Visa', 'Health', 'Wealth'], x: 65, y: 55 },
    { name: 'Lingaraj Temple', deity: 'Lord Shiva', speciality: ['Education'], x: 60, y: 45 }
  ],
  'IN-PB': [
    { name: 'Durgiana Temple', deity: 'Goddess Durga', speciality: ['Health', 'House'], x: 45, y: 40 },
    { name: 'Ram Tirath', deity: 'Lord Rama', speciality: ['Education', 'Visa'], x: 50, y: 55 }
  ],
  'IN-HR': [
    { name: 'Sthaneshwar Mahadev', deity: 'Lord Shiva', speciality: ['House', 'Health'], x: 50, y: 40 },
  ],
  'IN-UK': [
    { name: 'Kedarnath Temple', deity: 'Lord Shiva', speciality: ['Visa', 'Health'], x: 55, y: 35 },
    { name: 'Badrinath Temple', deity: 'Lord Vishnu', speciality: ['Wealth', 'Education'], x: 60, y: 25 }
  ],
  'IN-JH': [
    { name: 'Baidyanath Temple', deity: 'Lord Shiva', speciality: ['Health', 'Visa'], x: 50, y: 40 },
  ],
  'IN-CT': [
    { name: 'Danteshwari Temple', deity: 'Goddess Danteshwari', speciality: ['Health', 'House'], x: 45, y: 70 },
  ],
  'IN-AS': [
    { name: 'Kamakhya Temple', deity: 'Goddess Kamakhya', speciality: ['Visa', 'Health', 'Wealth'], x: 45, y: 45 },
  ],
  'IN-HP': [
    { name: 'Jwalamukhi Temple', deity: 'Goddess Jwala', speciality: ['Health', 'House'], x: 40, y: 55 },
  ],
  'IN-JK': [
    { name: 'Vaishno Devi', deity: 'Goddess Vaishno', speciality: ['Visa', 'Wealth', 'Health'], x: 50, y: 70 },
    { name: 'Amarnath Cave', deity: 'Lord Shiva', speciality: ['Health', 'Education'], x: 60, y: 45 }
  ],
  'IN-GA': [
    { name: 'Mangeshi Temple', deity: 'Lord Mangesh (Shiva)', speciality: ['House', 'Health'], x: 50, y: 40 },
  ],
  'IN-NL': [
    { name: 'Shiva Temple Kohima', deity: 'Lord Shiva', speciality: ['Health'], x: 50, y: 50 },
  ],
  'IN-MN': [
    { name: 'Govindajee Temple', deity: 'Lord Krishna', speciality: ['Education', 'Visa'], x: 50, y: 50 },
  ],
  'IN-ML': [
    { name: 'Nartiang Durga', deity: 'Goddess Durga', speciality: ['Health', 'House'], x: 50, y: 50 },
  ],
  'IN-TR': [
    { name: 'Tripura Sundari', deity: 'Goddess Tripura Sundari', speciality: ['Wealth', 'Visa'], x: 50, y: 50 },
  ],
  'IN-MZ': [
    { name: 'Solomon Temple', deity: 'Various', speciality: ['Education'], x: 50, y: 50 },
  ],
  'IN-AR': [
    { name: 'Parashuram Kund', deity: 'Lord Parashuram', speciality: ['Visa', 'Health'], x: 50, y: 50 },
  ],
  'IN-SK': [
    { name: 'Kirateshwar Mahadev', deity: 'Lord Shiva', speciality: ['Health', 'House'], x: 50, y: 50 },
  ],
  'IN-DL': [
    { name: 'Akshardham', deity: 'Swaminarayan', speciality: ['Education', 'Visa'], x: 55, y: 50 },
    { name: 'Lotus Temple', deity: 'Bahá\'í Faith', speciality: ['Health', 'House'], x: 50, y: 60 }
  ],
};

// ── State name mapping ──
const stateNames = {
  'IN-RJ': 'Rajasthan', 'IN-MH': 'Maharashtra', 'IN-TN': 'Tamil Nadu',
  'IN-KA': 'Karnataka', 'IN-KL': 'Kerala', 'IN-AP': 'Andhra Pradesh',
  'IN-TG': 'Telangana', 'IN-UP': 'Uttar Pradesh', 'IN-GJ': 'Gujarat',
  'IN-WB': 'West Bengal', 'IN-MP': 'Madhya Pradesh', 'IN-BR': 'Bihar',
  'IN-OR': 'Odisha', 'IN-PB': 'Punjab', 'IN-HR': 'Haryana',
  'IN-UK': 'Uttarakhand', 'IN-JH': 'Jharkhand', 'IN-CT': 'Chhattisgarh',
  'IN-AS': 'Assam', 'IN-HP': 'Himachal Pradesh', 'IN-JK': 'Jammu & Kashmir',
  'IN-GA': 'Goa', 'IN-NL': 'Nagaland', 'IN-MN': 'Manipur',
  'IN-ML': 'Meghalaya', 'IN-TR': 'Tripura', 'IN-MZ': 'Mizoram',
  'IN-AR': 'Arunachal Pradesh', 'IN-SK': 'Sikkim', 'IN-DL': 'Delhi',
  'IN-LA': 'Ladakh', 'IN-CH': 'Chandigarh', 'IN-AN': 'Andaman & Nicobar',
  'IN-DN': 'Dadra & Nagar Haveli', 'IN-DD': 'Daman & Diu',
  'IN-LD': 'Lakshadweep', 'IN-PY': 'Puducherry'
};

// ── App State ──
let selectedState = null;
let activeTempleCard = null;

// ── DOM References ──
const mapContainer = container.querySelector("#" + 'map-container');
const stateOverlay = container.querySelector("#" + 'state-overlay');
const overlayInner = container.querySelector("#" + 'state-overlay-inner');
const stateNameTooltip = container.querySelector("#" + 'state-name-tooltip');
const templeCardOverlay = container.querySelector("#" + 'temple-card-overlay');

// ── Initialize ──
init();

function init() {
  const statePaths = container.querySelectorAll('.state-path');

  statePaths.forEach(path => {
    // Hover: raise effect + state name tooltip
    path.addEventListener('mouseenter', handleStateHover);
    path.addEventListener('mousemove', handleStateMouseMove);
    path.addEventListener('mouseleave', handleStateLeave);

    // Click: open state overlay
    path.addEventListener('click', handleStateClick);
  });

  // Back button
  container.querySelector("#" + 'btn-back').addEventListener('click', closeOverlay);

  // Close overlay on backdrop click
  stateOverlay.addEventListener('click', (e) => {
    if (e.target === stateOverlay) closeOverlay();
  });

  // Close temple card overlay on backdrop click
  templeCardOverlay.addEventListener('click', (e) => {
    if (e.target === templeCardOverlay) closeTempleCard();
  });

  // Keyboard escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (activeTempleCard) closeTempleCard();
      else if (selectedState) closeOverlay();
    }
  });
}

// ── Hover Handlers ──
function handleStateHover(e) {
  if (selectedState) return;
  const stateId = this.getAttribute('data-state');
  const name = stateNames[stateId] || stateId;
  stateNameTooltip.textContent = name;
  stateNameTooltip.classList.add('visible');
}

function handleStateMouseMove(e) {
  if (selectedState) return;
  stateNameTooltip.style.left = e.clientX + 14 + 'px';
  stateNameTooltip.style.top = e.clientY - 36 + 'px';
}

function handleStateLeave() {
  stateNameTooltip.classList.remove('visible');
}

// ── State Click → Open Overlay ──
function handleStateClick(e) {
  if (selectedState) return;
  const stateId = this.getAttribute('data-state');
  const name = stateNames[stateId] || stateId;
  const temples = templesByState[stateId] || [];

  selectedState = stateId;

  // Dim base map
  mapContainer.classList.add('dimmed');

  // Build overlay content
  buildOverlay(stateId, name, temples, this);

  // Show overlay
  requestAnimationFrame(() => {
    stateOverlay.classList.add('active');
  });

  stateNameTooltip.classList.remove('visible');
}

// ── Build Overlay Panel ──
function buildOverlay(stateId, name, temples, pathEl) {
  // Set header
  const header = container.querySelector("#" + 'overlay-state-name');
  header.innerHTML = `${name} <span class="temple-count">${temples.length} temple${temples.length !== 1 ? 's' : ''}</span>`;

  // Clone state path into overlay SVG
  const overlaySvgContainer = container.querySelector("#" + 'overlay-state-svg');
  overlaySvgContainer.innerHTML = '';

  // Get the original path's bounding box
  const bbox = pathEl.getBBox();
  const padding = 15;
  const vbX = bbox.x - padding;
  const vbY = bbox.y - padding;
  const vbW = bbox.width + padding * 2;
  const vbH = bbox.height + padding * 2;

  // Create a new SVG with the state shape
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `${vbX} ${vbY} ${vbW} ${vbH}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.style.width = '100%';
  svg.style.height = 'auto';
  svg.style.maxHeight = '350px';

  const clonedPath = pathEl.cloneNode(true);
  clonedPath.classList.remove('state-path');
  clonedPath.classList.add('overlay-state-shape');
  clonedPath.removeAttribute('data-state');
  svg.appendChild(clonedPath);

  overlaySvgContainer.appendChild(svg);

  // Add pins container  
  const pinsContainer = document.createElement('div');
  pinsContainer.className = 'pins-container';
  overlaySvgContainer.appendChild(pinsContainer);

  // Render temple pins
  temples.forEach((temple, idx) => {
    const pin = document.createElement('div');
    pin.className = 'temple-pin';
    pin.style.left = temple.x + '%';
    pin.style.top = temple.y + '%';

    pin.innerHTML = `
      <div class="temple-pin-pulse"></div>
      <div class="temple-pin-dot"></div>
      <div class="pin-tooltip" id="tip-${stateId}-${idx}">
        <span class="tip-name">${temple.name}</span>
        <span class="tip-spec">${temple.speciality.join(', ')}</span>
      </div>
    `;

    // Pin hover
    pin.addEventListener('mouseenter', () => {
      pin.querySelector('.pin-tooltip').classList.add('visible');
    });
    pin.addEventListener('mouseleave', () => {
      pin.querySelector('.pin-tooltip').classList.remove('visible');
    });

    // Pin click → card
    pin.addEventListener('click', (e) => {
      e.stopPropagation();
      openTempleCard(temple);
    });

    pinsContainer.appendChild(pin);
  });
}

// ── Temple Card ──
function openTempleCard(temple) {
  activeTempleCard = temple; window.activeTempleCardGlobal = temple;

  const chipClass = {
    'Visa': 'visa', 'Health': 'health', 'House': 'house',
    'Education': 'education', 'Wealth': 'wealth'
  };

  const chipsHTML = temple.speciality.map(s =>
    `<span class="chip ${chipClass[s] || ''}">${s}</span>`
  ).join('');

  const cardContainer = container.querySelector("#" + 'temple-card-content');
  cardContainer.innerHTML = `
    <button class="btn-close-card" onclick="window.closeTempleCardGlobal()" aria-label="Close">✕</button>
    <div class="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 flex-shrink-0 border-2 border-[#C89B3C]/50 shadow-md"><img class="w-full h-full object-cover" src="${window.templeDatabase?.[temple.name]?.images?.[0] || '/temple_architecture.png'}" alt="${temple.name}" /></div>
    <h3>${temple.name}</h3>
    <p class="deity">${temple.deity}</p>
    <div class="chips">${chipsHTML}</div>
    <button class="btn-explore" onclick="window.dispatchEvent(new CustomEvent('openDeepModal', {detail: window.activeTempleCardGlobal}))">
      Explore details
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </button>
  `;

  requestAnimationFrame(() => {
    templeCardOverlay.classList.add('active');
  });
}

function closeTempleCard() {
  activeTempleCard = null;
  templeCardOverlay.classList.remove('active');
}

// ── Close Overlay ──
function closeOverlay() {
  if (activeTempleCard) closeTempleCard();

  selectedState = null;
  stateOverlay.classList.remove('active');

  setTimeout(() => {
    mapContainer.classList.remove('dimmed');
  }, 300);
}

  
  // Attach the global hook unconditionally!
  window.closeTempleCardGlobal = closeTempleCard;
  
  // Return a cleanup function for React
  return () => {
    // Basic cleanup
    delete window.closeTempleCardGlobal;
  };
}
