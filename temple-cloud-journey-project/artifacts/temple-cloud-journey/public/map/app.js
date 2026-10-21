/* ============================================================
   Interactive India Map – Temple Explorer
   Application Logic
   ============================================================ */

// ── Temple Data (100 Verified North Indian Temples) ──
const templesByState = (typeof window !== 'undefined' && window.NORTH_INDIA_TEMPLES_BY_STATE)
  ? window.NORTH_INDIA_TEMPLES_BY_STATE
  : {};

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
const mapContainer = document.getElementById('map-container');
const stateOverlay = document.getElementById('state-overlay');
const overlayInner = document.getElementById('state-overlay-inner');
const stateNameTooltip = document.getElementById('state-name-tooltip');
const templeCardOverlay = document.getElementById('temple-card-overlay');

// ── Initialize ──
document.addEventListener('DOMContentLoaded', init);

function init() {
  initJourney();
  initSearch();
  initAIChat();
  const statePaths = document.querySelectorAll('.state-path');

  statePaths.forEach(path => {
    // Hover: raise effect + state name tooltip
    path.addEventListener('mouseenter', handleStateHover);
    path.addEventListener('mousemove', handleStateMouseMove);
    path.addEventListener('mouseleave', handleStateLeave);

    // Click: open state overlay
    path.addEventListener('click', handleStateClick);
  });

  // Back button
  document.getElementById('btn-back').addEventListener('click', closeOverlay);

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
  const header = document.getElementById('overlay-state-name');
  header.innerHTML = `${name} <span class="temple-count">${temples.length} temple${temples.length !== 1 ? 's' : ''}</span>`;

  // Clone state path into overlay SVG
  const overlaySvgContainer = document.getElementById('overlay-state-svg');
  overlaySvgContainer.innerHTML = '';

  const listContainer = document.getElementById('overlay-temple-list');
  if (listContainer) listContainer.innerHTML = '';

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

  if (temples.length === 0) {
    if (listContainer) {
      listContainer.innerHTML = `
        <div class="overlay-no-temples">
          <p><strong>${escapeHtml(name)}</strong> is currently outside our <strong>North Indian Temples Dataset</strong> (100 verified shrines across 10 Northern states & regions).</p>
          <p class="sub-hint">Click on <em>Jammu & Kashmir, Uttarakhand, Himachal Pradesh, Punjab, Haryana, Delhi NCR, Uttar Pradesh, Rajasthan, Madhya Pradesh, or Bihar</em> to discover their sacred temples!</p>
        </div>
      `;
    }
    return;
  }

  // Render temple pins at their exact locations
  temples.forEach((temple, idx) => {
    const pin = document.createElement('div');
    pin.className = 'temple-pin';
    pin.style.left = temple.x + '%';
    pin.style.top = temple.y + '%';

    const shortDeity = temple.deity ? temple.deity.split('.')[0] : (temple.speciality || []).join(', ');

    pin.innerHTML = `
      <div class="temple-pin-pulse"></div>
      <div class="temple-pin-dot"></div>
      <div class="pin-tooltip" id="tip-${stateId}-${idx}">
        <span class="tip-name">${escapeHtml(temple.name)}</span>
        <span class="tip-spec">${escapeHtml(shortDeity)}</span>
      </div>
    `;

    // Pin hover
    pin.addEventListener('mouseenter', () => {
      const tt = pin.querySelector('.pin-tooltip');
      if (tt) tt.classList.add('visible');
    });
    pin.addEventListener('mouseleave', () => {
      const tt = pin.querySelector('.pin-tooltip');
      if (tt) tt.classList.remove('visible');
    });

    // Pin click → card
    pin.addEventListener('click', (e) => {
      e.stopPropagation();
      openTempleCard(temple);
    });

    pinsContainer.appendChild(pin);
  });

  // Render scrollable temple cards list below the state map
  if (listContainer) {
    listContainer.innerHTML = temples.map((temple, idx) => `
      <div class="overlay-temple-card" data-idx="${idx}">
        <div class="overlay-temple-info">
          <div class="overlay-temple-icon">🕉</div>
          <div class="overlay-temple-text">
            <h4>${escapeHtml(temple.name)}</h4>
            <p>${escapeHtml(temple.deity ? temple.deity.split('.')[0] : '')}</p>
          </div>
        </div>
        <div class="overlay-temple-action">
          <span>View Details</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>
    `).join('');

    // Attach click events on items
    const cards = listContainer.querySelectorAll('.overlay-temple-card');
    cards.forEach((c, idx) => {
      c.addEventListener('click', () => {
        openTempleCard(temples[idx]);
      });
    });
  }
}

// ── Detailed Temple Card ──
function openTempleCard(temple) {
  activeTempleCard = temple;

  const chipsHTML = (temple.speciality || []).map(s =>
    `<span class="chip">${escapeHtml(s)}</span>`
  ).join('');

  const cardContainer = document.getElementById('temple-card-content');
  cardContainer.innerHTML = `
    <button class="btn-close-card" onclick="closeTempleCard()" aria-label="Close">✕</button>
    <div class="temple-card-header">
      <div class="temple-icon">🕉</div>
      <div style="flex: 1;">
        <h3>${escapeHtml(temple.name)}</h3>
        ${temple.fullName && temple.fullName !== temple.name ? `<p class="temple-fullname">${escapeHtml(temple.fullName)}</p>` : ''}
        <p class="deity"><strong>Presiding Deity:</strong> ${escapeHtml(temple.deity || '')}</p>
        <p class="location-badge">📍 ${escapeHtml(temple.location || '')}</p>
      </div>
    </div>

    <!-- Quick Speciality Chips -->
    <div class="chips">${chipsHTML}</div>

    <!-- Unique Highlight -->
    ${temple.uniqueness ? `
      <div class="temple-highlight-box">
        <span class="highlight-label">✨ Sacred Uniqueness</span>
        <p>${escapeHtml(temple.uniqueness)}</p>
      </div>
    ` : ''}

    <!-- Structured Sections -->
    <div class="temple-details-grid">
      ${temple.architecture ? `
        <div class="temple-detail-section">
          <h5>🏛 Architecture</h5>
          <p>${escapeHtml(temple.architecture)}</p>
        </div>
      ` : ''}

      ${temple.history ? `
        <div class="temple-detail-section">
          <h5>📜 History & Heritage</h5>
          <p>${escapeHtml(temple.history)}</p>
        </div>
      ` : ''}

      ${(temple.ritual || temple.festival) ? `
        <div class="temple-detail-section">
          <h5>🪔 Daily Rituals & Festivals</h5>
          ${temple.ritual ? `<p><strong>Rituals:</strong> ${escapeHtml(temple.ritual)}</p>` : ''}
          ${temple.festival ? `<p><strong>Festivals:</strong> ${escapeHtml(temple.festival)}</p>` : ''}
        </div>
      ` : ''}

      ${temple.belief ? `
        <div class="temple-detail-section">
          <h5>🙏 Beliefs & Traditions</h5>
          <p>${escapeHtml(temple.belief)}</p>
        </div>
      ` : ''}

      ${temple.visitorInfo ? `
        <div class="temple-detail-section visitor-info">
          <h5>ℹ️ Visitor Information</h5>
          <p>${escapeHtml(temple.visitorInfo)}</p>
        </div>
      ` : ''}
    </div>

    <!-- Action Buttons -->
    <div class="temple-card-actions">
      ${temple.mapUrl ? `
        <a href="${temple.mapUrl}" target="_blank" rel="noopener noreferrer" class="btn-gmap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          Google Maps
        </a>
      ` : ''}
      <button class="btn-explore" id="btn-card-explore" onclick="exploreTempleWithAI('${escapeHtml(temple.name)}')">
        <span class="ai-sparkle">✨</span> Explore with Gemini AI
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
    </div>

    ${temple.source ? `
      <div class="temple-source-badge">
        <span>Verified Source: ${escapeHtml(temple.source)}</span>
      </div>
    ` : ''}

    <div id="temple-card-ai-container"></div>
  `;

  requestAnimationFrame(() => {
    templeCardOverlay.classList.add('active');
  });
}

async function exploreTempleWithAI(templeName) {
  const container = document.getElementById('temple-card-ai-container');
  const btnExplore = document.getElementById('btn-card-explore');
  if (!container) return;

  if (btnExplore) {
    btnExplore.disabled = true;
    btnExplore.innerHTML = `
      <span class="ai-sparkle">✨</span> Consulting Gemini AI...
    `;
  }

  container.innerHTML = `
    <div class="temple-ai-insights-box">
      <div class="temple-ai-insights-header">
        <span class="temple-ai-insights-badge">🕉️ TempleVerse AI Intelligence</span>
      </div>
      <div class="temple-ai-insights-text">
        <div class="ai-typing-indicator">
          <span class="ai-typing-dot"></span>
          <span class="ai-typing-dot"></span>
          <span class="ai-typing-dot"></span>
        </div>
        <p style="margin: 0.3rem 0; font-size: 0.85rem; color: #78350f;">Retrieving architectural, ritual & historical insights for ${escapeHtml(templeName)}...</p>
      </div>
    </div>
  `;

  try {
    let result = '';
    if (window.templeVerseGemini && typeof window.templeVerseGemini.askGemini === 'function') {
      result = await window.templeVerseGemini.askGemini(
        `Provide an inspiring and deep architectural, historical, and spiritual exploration of ${templeName}, highlighting its sacred deity, rituals, architecture style, and pilgrim guidelines.`,
        activeTempleCard
      );
    } else {
      result = `**${templeName}** is revered for its ancient sanctity, sacred rituals, and architectural marvels. Dedicated to ${activeTempleCard?.deity || 'the Supreme Divine'}, pilgrims visit to experience blessings of ${activeTempleCard?.speciality?.join(', ') || 'peace'}.`;
    }

    container.innerHTML = `
      <div class="temple-ai-insights-box">
        <div class="temple-ai-insights-header">
          <span class="temple-ai-insights-badge">✨ Gemini Temple Intelligence</span>
        </div>
        <div class="temple-ai-insights-text">
          ${formatMarkdownToHTML(result)}
        </div>
        <div style="margin-top: 10px; text-align: right;">
          <button type="button" class="btn-search-ai" onclick="openAIChatWithQuery('Tell me more sacred stories about ${escapeHtml(templeName)}')">
            <span>Ask follow-up in TempleVerse AI</span> 💬
          </button>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `
      <div class="temple-ai-insights-box">
        <div class="temple-ai-insights-text" style="color: #b91c1c;">
          Could not load insights at this moment. You can still ask in the TempleVerse AI Assistant.
        </div>
      </div>
    `;
  } finally {
    if (btnExplore) {
      btnExplore.disabled = false;
      btnExplore.innerHTML = `
        <span class="ai-sparkle">✨</span> Refresh AI Insights
      `;
    }
  }
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

// ══════════════════════════════════════════════════════════════
// ── Temple Journey Motion Webpage Controller ──
// ══════════════════════════════════════════════════════════════
const JOURNEY_LENGTH = 5000;
const CHAPTERS = [
  { at: 0, stage: 'distance', title: 'A distant view', num: '01' },
  { at: 650, stage: 'approach', title: 'Drawing near', num: '02' },
  { at: 3700, stage: 'arrival', title: 'At the temple', num: '03' },
  { at: 4200, stage: 'door', title: 'At the temple door', num: '04' },
];

let journeyElapsed = 0;
let journeyPlaying = true;
let journeyTimer = null;
let journeyCompleted = false;

function initJourney() {
  const journeySection = document.getElementById('temple-journey');
  if (!journeySection) return;

  const btnPlayback = document.getElementById('btn-journey-playback');
  const btnSkip = document.getElementById('btn-skip-journey');
  const btnEnter = document.getElementById('btn-enter-temple');
  const btnReplay = document.getElementById('btn-replay-journey');

  if (btnPlayback) btnPlayback.addEventListener('click', toggleJourneyPlayback);
  if (btnSkip) btnSkip.addEventListener('click', () => transitionToMap(true));
  if (btnEnter) btnEnter.addEventListener('click', () => transitionToMap(false));
  if (btnReplay) btnReplay.addEventListener('click', replayJourney);

  startJourney();
}

function startJourney() {
  journeyPlaying = true;
  journeyCompleted = false;
  journeyElapsed = 0;
  updateJourneyUI();

  const journeySection = document.getElementById('temple-journey');
  if (journeySection) {
    journeySection.classList.remove('completed');
    journeySection.setAttribute('data-paused', 'false');
  }

  const portalFlash = document.getElementById('portal-flash');
  if (portalFlash) portalFlash.classList.remove('active');

  clearInterval(journeyTimer);
  const startedAt = Date.now() - journeyElapsed;
  journeyTimer = setInterval(() => {
    if (!journeyPlaying) return;
    journeyElapsed = Math.min(Date.now() - startedAt, JOURNEY_LENGTH);
    updateJourneyUI();

    if (journeyElapsed >= JOURNEY_LENGTH) {
      clearInterval(journeyTimer);
      journeyPlaying = false;
      onJourneyFinished();
    }
  }, 50);
}

function updateJourneyUI() {
  const journeySection = document.getElementById('temple-journey');
  if (!journeySection) return;

  // Find active chapter
  let currentChapter = CHAPTERS[0];
  for (let i = CHAPTERS.length - 1; i >= 0; i--) {
    if (journeyElapsed >= CHAPTERS[i].at) {
      currentChapter = CHAPTERS[i];
      break;
    }
  }

  journeySection.setAttribute('data-stage', currentChapter.stage);

  // Chapter number & title
  const chapterNumberEl = document.querySelector('#journey-chapter .chapter-number');
  const chapterTitleEl = document.getElementById('chapter-title');
  if (chapterNumberEl) chapterNumberEl.textContent = currentChapter.num;
  if (chapterTitleEl) chapterTitleEl.textContent = currentChapter.title;

  // Timecode
  const seconds = Math.floor(journeyElapsed / 1000);
  const minutes = Math.floor(seconds / 60);
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const timecodeCurrent = document.getElementById('timecode-current');
  if (timecodeCurrent) timecodeCurrent.textContent = formatted;

  // Progress bar
  const progressRatio = Math.min(journeyElapsed / JOURNEY_LENGTH, 1);
  const progressFill = document.getElementById('progress-fill');
  if (progressFill) progressFill.style.transform = `scaleX(${progressRatio})`;

  // Play/pause/replay icons & labels
  const iconPause = document.getElementById('icon-pause');
  const iconPlay = document.getElementById('icon-play');
  const iconReplay = document.getElementById('icon-replay');
  const transportLabel = document.getElementById('transport-label');

  if (journeyElapsed >= JOURNEY_LENGTH) {
    if (iconPause) iconPause.style.display = 'none';
    if (iconPlay) iconPlay.style.display = 'none';
    if (iconReplay) iconReplay.style.display = 'block';
    if (transportLabel) transportLabel.textContent = 'Replay passage';
  } else if (journeyPlaying) {
    if (iconPause) iconPause.style.display = 'block';
    if (iconPlay) iconPlay.style.display = 'none';
    if (iconReplay) iconReplay.style.display = 'none';
    if (transportLabel) transportLabel.textContent = 'Pause journey';
  } else {
    if (iconPause) iconPause.style.display = 'none';
    if (iconPlay) iconPlay.style.display = 'block';
    if (iconReplay) iconReplay.style.display = 'none';
    if (transportLabel) transportLabel.textContent = 'Continue';
  }
}

function toggleJourneyPlayback() {
  if (journeyElapsed >= JOURNEY_LENGTH) {
    startJourney();
    return;
  }
  journeyPlaying = !journeyPlaying;
  const journeySection = document.getElementById('temple-journey');
  if (journeySection) {
    journeySection.setAttribute('data-paused', journeyPlaying ? 'false' : 'true');
  }
  updateJourneyUI();
}

function onJourneyFinished() {
  updateJourneyUI();
  // Automatically trigger golden bloom & transition after reaching the door
  setTimeout(() => {
    if (!journeyCompleted) {
      transitionToMap(false);
    }
  }, 1400);
}

function transitionToMap(immediate = false) {
  if (journeyCompleted) return;
  journeyCompleted = true;
  clearInterval(journeyTimer);

  const portalFlash = document.getElementById('portal-flash');
  const journeySection = document.getElementById('temple-journey');

  if (immediate) {
    if (journeySection) journeySection.classList.add('completed');
    return;
  }

  // Divine portal flash effect
  if (portalFlash) portalFlash.classList.add('active');

  setTimeout(() => {
    if (journeySection) journeySection.classList.add('completed');
    setTimeout(() => {
      if (portalFlash) portalFlash.classList.remove('active');
    }, 700);
  }, 700);
}

function replayJourney() {
  const journeySection = document.getElementById('temple-journey');
  if (!journeySection) return;
  journeySection.classList.remove('completed');
  startJourney();
}

// ══════════════════════════════════════════════════════════════
// ── Search & Filter Bar Controller (Top of India Map) ──
// ══════════════════════════════════════════════════════════════
function getAllTemplesList() {
  const list = [];
  for (const [stateId, temples] of Object.entries(templesByState)) {
    const sName = stateNames[stateId] || stateId;
    temples.forEach(t => {
      list.push({
        ...t,
        stateId,
        stateName: sName
      });
    });
  }
  return list;
}

function initSearch() {
  const searchInput = document.getElementById('temple-search-input');
  const btnClear = document.getElementById('btn-clear-search');
  const dropdown = document.getElementById('search-results-dropdown');
  const filterChips = document.querySelectorAll('.search-filter-chip');

  if (!searchInput) return;

  const allTemples = getAllTemplesList();

  // Input typing listener
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    if (!query) {
      if (btnClear) btnClear.style.display = 'none';
      if (dropdown) dropdown.classList.remove('visible');
      clearMapHighlights();
      return;
    }

    if (btnClear) btnClear.style.display = 'flex';
    performSearch(query, allTemples);
  });

  // Clear button
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      searchInput.value = '';
      btnClear.style.display = 'none';
      if (dropdown) dropdown.classList.remove('visible');
      clearMapHighlights();
      resetActiveFilterChips();
    });
  }

  // Filter chips click
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const filterType = chip.getAttribute('data-filter');
      if (filterType === 'all') {
        searchInput.value = '';
        if (btnClear) btnClear.style.display = 'none';
        if (dropdown) dropdown.classList.remove('visible');
        clearMapHighlights();
      } else {
        searchInput.value = filterType;
        if (btnClear) btnClear.style.display = 'flex';
        performSearch(filterType.toLowerCase(), allTemples);
      }
    });
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#temple-search-section')) {
      if (dropdown) dropdown.classList.remove('visible');
    }
  });
}

function resetActiveFilterChips() {
  const filterChips = document.querySelectorAll('.search-filter-chip');
  filterChips.forEach(c => {
    if (c.getAttribute('data-filter') === 'all') c.classList.add('active');
    else c.classList.remove('active');
  });
}

function clearMapHighlights() {
  const highlighted = document.querySelectorAll('.state-path.search-highlight');
  highlighted.forEach(el => el.classList.remove('search-highlight'));
}

function performSearch(query, allTemples) {
  const dropdown = document.getElementById('search-results-dropdown');
  if (!dropdown) return;

  clearMapHighlights();

  const matched = allTemples.filter(t => {
    const inName = (t.name || '').toLowerCase().includes(query);
    const inFull = (t.fullName || '').toLowerCase().includes(query);
    const inDeity = (t.deity || '').toLowerCase().includes(query);
    const inState = (t.stateName || '').toLowerCase().includes(query);
    const inLoc = (t.location || '').toLowerCase().includes(query);
    const inUnique = (t.uniqueness || '').toLowerCase().includes(query);
    const inArch = (t.architecture || '').toLowerCase().includes(query);
    const inFest = (t.festival || '').toLowerCase().includes(query);
    const inSpec = (t.speciality || []).some(s => s.toLowerCase().includes(query));
    return inName || inFull || inDeity || inState || inLoc || inUnique || inArch || inFest || inSpec;
  });

  // Highlight matching states on the India map!
  const matchedStateIds = new Set(matched.map(m => m.stateId));
  matchedStateIds.forEach(stId => {
    const pathEl = document.getElementById(stId);
    if (pathEl) pathEl.classList.add('search-highlight');
  });

  if (matched.length === 0) {
    dropdown.innerHTML = `<div class="search-empty">No temples found matching "<b>${escapeHtml(query)}</b>". Try searching by deity (Shiva, Vishnu, Krishna, Durga), city (Varanasi, Mathura, Haridwar), or blessing (Wishes, Health, Wealth).</div>`;
    dropdown.classList.add('visible');
    return;
  }

  dropdown.innerHTML = matched.map((t, idx) => {
    const chipsHTML = (t.speciality || []).map(s =>
      `<span class="chip" style="font-size:10px; padding:2px 7px;">${escapeHtml(s)}</span>`
    ).join('');

    const shortLoc = t.location ? (t.location.split(';')[1] || t.location).trim() : '';

    return `
      <div class="search-result-item" data-index="${idx}">
        <div class="res-left">
          <span class="res-om">🕉</span>
          <div class="res-info">
            <span class="res-name">${escapeHtml(t.name)}</span>
            <span class="res-deity">${escapeHtml(t.deity ? t.deity.split('.')[0] : '')} ${shortLoc ? '• ' + escapeHtml(shortLoc) : ''}</span>
          </div>
        </div>
        <div class="res-right">
          <span class="res-state-badge">${escapeHtml(t.stateName)}</span>
          <div class="res-chips">${chipsHTML}</div>
        </div>
      </div>
    `;
  }).join('');

  dropdown.classList.add('visible');

  // Add click handlers on result items to open on map directly
  const items = dropdown.querySelectorAll('.search-result-item');
  items.forEach((item, idx) => {
    item.addEventListener('click', () => {
      const targetTemple = matched[idx];
      dropdown.classList.remove('visible');

      // Find state on map
      const pathEl = document.getElementById(targetTemple.stateId);
      if (pathEl) {
        // Trigger state overlay open
        handleStateClick.call(pathEl);

        // After overlay opens, open this temple card
        setTimeout(() => {
          openTempleCard(targetTemple);
        }, 400);
      }
    });
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ══════════════════════════════════════════════════════════════
// ── TempleVerse Gemini AI Assistant Controller ──
// ══════════════════════════════════════════════════════════════
function formatMarkdownToHTML(text) {
  if (!text) return '';
  let html = escapeHtml(text);

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h4 style="margin:0.7rem 0 0.3rem; color:#78350f; font-size:0.95rem;">$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3 style="margin:0.8rem 0 0.4rem; color:#451a03; font-size:1.02rem;">$1</h3>');
  // Lists
  html = html.replace(/^\s*[-•]\s+(.*$)/gim, '<li style="margin-left:1.2rem; list-style-type:disc;">$1</li>');
  // Paragraphs
  html = html.replace(/\n\n+/g, '</p><p style="margin:0.5rem 0;">');
  html = html.replace(/\n/g, '<br/>');

  return `<p style="margin:0;">${html}</p>`;
}

function openAIChatWithQuery(query) {
  const drawer = document.getElementById('ai-drawer');
  const chatInput = document.getElementById('ai-user-input');
  if (!drawer) return;

  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');

  if (query && chatInput) {
    chatInput.value = query;
    const form = document.getElementById('ai-chat-form');
    if (form) {
      setTimeout(() => {
        form.dispatchEvent(new Event('submit', { cancelable: true }));
      }, 200);
    }
  }
}

function initAIChat() {
  const btnToggleAI = document.getElementById('btn-toggle-ai');
  const btnCloseAI = document.getElementById('btn-close-ai');
  const btnSearchAI = document.getElementById('btn-search-ai');
  const drawer = document.getElementById('ai-drawer');
  const chatForm = document.getElementById('ai-chat-form');
  const chatInput = document.getElementById('ai-user-input');
  const chatBody = document.getElementById('ai-chat-body');
  const suggestionChips = document.querySelectorAll('.ai-prompt-chip');
  const templeSearchInput = document.getElementById('temple-search-input');

  if (!drawer) return;

  // Toggle drawer open
  if (btnToggleAI) {
    btnToggleAI.addEventListener('click', () => {
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      if (chatInput) chatInput.focus();
    });
  }

  // Close drawer
  if (btnCloseAI) {
    btnCloseAI.addEventListener('click', () => {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
    });
  }

  // Top search bar "Ask AI" button
  if (btnSearchAI) {
    btnSearchAI.addEventListener('click', () => {
      const query = templeSearchInput ? templeSearchInput.value.trim() : '';
      if (query) {
        openAIChatWithQuery(`Tell me about the history, architecture, and sacred traditions of ${query}`);
      } else {
        openAIChatWithQuery('Which famous temples should I visit in India and what are their spiritual blessings?');
      }
    });
  }

  // Quick suggestion chips
  suggestionChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.getAttribute('data-query');
      if (q) openAIChatWithQuery(q);
    });
  });

  // Handle form submission
  if (chatForm && chatInput && chatBody) {
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userText = chatInput.value.trim();
      if (!userText) return;

      chatInput.value = '';

      // Append User message
      appendChatMessage(chatBody, 'user', userText);

      // Append typing indicator
      const typingEl = appendTypingIndicator(chatBody);

      try {
        let aiResponse = '';
        if (window.templeVerseGemini && typeof window.templeVerseGemini.askGemini === 'function') {
          aiResponse = await window.templeVerseGemini.askGemini(userText);
        } else {
          aiResponse = "Welcome to TempleVerse. Gemini AI is currently connecting to the knowledge base.";
        }

        // Remove typing indicator and append bot message
        typingEl.remove();
        appendChatMessage(chatBody, 'bot', aiResponse);
      } catch (err) {
        typingEl.remove();
        appendChatMessage(chatBody, 'bot', "I apologize, but I encountered an error while consulting the archives. Please try asking again.");
      }
    });
  }
}

function appendChatMessage(container, sender, text) {
  const msgEl = document.createElement('div');
  msgEl.className = `ai-message ${sender === 'user' ? 'ai-user-message' : 'ai-bot-message'}`;

  const avatar = sender === 'user' ? '🙏' : '✨';
  const formattedContent = sender === 'user'
    ? `<p>${escapeHtml(text)}</p>`
    : formatMarkdownToHTML(text);

  msgEl.innerHTML = `
    <div class="ai-msg-avatar">${avatar}</div>
    <div class="ai-msg-content">${formattedContent}</div>
  `;

  container.appendChild(msgEl);
  container.scrollTop = container.scrollHeight;
  return msgEl;
}

function appendTypingIndicator(container) {
  const typingEl = document.createElement('div');
  typingEl.className = 'ai-message ai-bot-message';
  typingEl.innerHTML = `
    <div class="ai-msg-avatar">✨</div>
    <div class="ai-msg-content" style="background:#fefce8; padding: 0.6rem 0.9rem;">
      <div class="ai-typing-indicator">
        <span class="ai-typing-dot"></span>
        <span class="ai-typing-dot"></span>
        <span class="ai-typing-dot"></span>
      </div>
    </div>
  `;
  container.appendChild(typingEl);
  container.scrollTop = container.scrollHeight;
  return typingEl;
}
