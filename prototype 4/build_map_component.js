const fs = require('fs');
const path = require('path');

const root = path.join(__dirname);
const archiveSrc = path.join(root, 'archive', 'frontend', 'src');
const mapCompDir = path.join(archiveSrc, 'components', 'InteractiveMap');

if (!fs.existsSync(mapCompDir)) {
  fs.mkdirSync(mapCompDir, { recursive: true });
}

// 1. Process CSS
let cssContent = fs.readFileSync(path.join(root, 'style.css'), 'utf-8');
// Richer temple card to handle "monotone" complaints
cssContent = cssContent.replace(
  '.temple-card {',
  '.temple-card {\n  background: linear-gradient(135deg, #FAF6EE 0%, #F5EADD 100%);\n  border: 4px solid #C89B3C;\n  box-shadow: 0 10px 40px rgba(122,31,43,0.2), inset 0 0 20px rgba(200,155,60,0.1);\n  transform: scale(0.95);\n  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);'
);
// Namespace global styles so it doesn't break Tailwind
cssContent = cssContent.replace('html, body {', '.map-wrapper {\n  position: relative;\n  /* Removed fixed sizing so it can fill parent */');
fs.writeFileSync(path.join(mapCompDir, 'InteractiveMap.css'), cssContent, 'utf-8');

// 2. Process JS
let jsContent = fs.readFileSync(path.join(root, 'app.js'), 'utf-8');
// Convert DOM queries to scoped queries
jsContent = jsContent.replace(/document\.querySelector\(/g, 'container.querySelector(');
jsContent = jsContent.replace(/document\.querySelectorAll\(/g, 'container.querySelectorAll(');
jsContent = jsContent.replace(/document\.getElementById\((["'].*?["'])\)/g, 'container.querySelector("#" + $1)');
jsContent = jsContent.replace(/document\.getElementById\(/g, 'container.querySelector("#" + ');

// FIX: We can't rely on global DOMContentLoaded inside React's lifecycle.
jsContent = jsContent.replace(/document\.addEventListener\('DOMContentLoaded', init\);/, 'init();');

jsContent = jsContent.replace(
  'activeTempleCard = temple;',
  'activeTempleCard = temple; window.activeTempleCardGlobal = temple;'
);

// Safely modify close button logic so it hooks cleanly on window
jsContent = jsContent.replace(
  'class="btn-close-card" onclick="closeTempleCard()"',
  'class="btn-close-card" onclick="window.closeTempleCardGlobal()"'
);
jsContent = jsContent.replace(
  '<div class="temple-icon">🕉</div>',
  '<div class="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 flex-shrink-0 border-2 border-[#C89B3C]/50 shadow-md"><img class="w-full h-full object-cover" src="${window.templeDatabase?.[temple.name]?.images?.[0] || \'/temple_architecture.png\'}" alt="${temple.name}" /></div>'
);
jsContent = jsContent.replace(
  /class="btn-explore" onclick="alert\('Explore: \$\{temple\.name\}'\)"/g,
  'class="btn-explore" onclick="window.dispatchEvent(new CustomEvent(\'openDeepModal\', {detail: window.activeTempleCardGlobal}))"'
);

const exportedJs = `
export function initializeMap(container) {
  // Original vanilla JS ported safely inside the container scope
  ${jsContent}
  
  // Attach the global hook unconditionally!
  window.closeTempleCardGlobal = closeTempleCard;
  
  // Return a cleanup function for React
  return () => {
    // Basic cleanup
    delete window.closeTempleCardGlobal;
  };
}
`;
fs.writeFileSync(path.join(mapCompDir, 'mapLogic.js'), exportedJs, 'utf-8');

// 3. Process HTML
let htmlContent = fs.readFileSync(path.join(root, 'index.html'), 'utf-8');
// Extract everything inside <section class="map-section"> ... </section>
const startIndex = htmlContent.indexOf('<section class="map-section">');
const endIndex = htmlContent.indexOf('</section>', startIndex) + '</section>'.length;
let mapHtml = htmlContent.substring(startIndex, endIndex);

// Remove the overlapping duplicate Title container present in the vanilla index HTML
const headerStart = mapHtml.indexOf('<header class="map-header">');
const headerEnd = mapHtml.indexOf('</header>', headerStart);
if (headerStart !== -1 && headerEnd !== -1) {
  mapHtml = mapHtml.slice(0, headerStart) + mapHtml.slice(headerEnd + '</header>'.length);
}

// Escape backticks for JS template literal
mapHtml = mapHtml.replace(/`/g, '\\`');

const jsxContent = `
import React, { useEffect, useRef } from 'react';
import './InteractiveMap.css';
import { initializeMap } from './mapLogic';

export default function InteractiveMap() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      // Small timeout to allow dangerouslySetInnerHTML to mount fully before binding listeners
      const timer = setTimeout(() => {
        initializeMap(containerRef.current);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div 
      className="map-wrapper w-full h-auto min-h-screen relative overflow-auto" 
      ref={containerRef} 
      dangerouslySetInnerHTML={{ __html: \`${mapHtml}\` }} 
    />
  );
}
`;
fs.writeFileSync(path.join(mapCompDir, 'InteractiveMap.jsx'), jsxContent, 'utf-8');

console.log('Successfully compiled Map into React Component!');
