const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(indexPath, 'utf-8');

const replacement = `<svg viewBox="0 0 1200 1200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="mandalaPattern" x="0" y="0" width="300" height="300" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="var(--accent-gold)" stroke-width="0.7">
            <!-- Concentric Framework -->
            <circle cx="150" cy="150" r="145" stroke-dasharray="6 6"/>
            <circle cx="150" cy="150" r="130"/>
            <circle cx="150" cy="150" r="90" stroke-width="1.2"/>
            <circle cx="150" cy="150" r="50"/>
            
            <!-- Outer Lotus Petals -->
            <path d="M150 20 Q190 70 150 110 Q110 70 150 20" stroke-width="0.8"/>
            <path d="M150 20 Q190 70 150 110 Q110 70 150 20" transform="rotate(45 150 150)"/>
            <path d="M150 20 Q190 70 150 110 Q110 70 150 20" transform="rotate(90 150 150)"/>
            <path d="M150 20 Q190 70 150 110 Q110 70 150 20" transform="rotate(135 150 150)"/>
            <path d="M150 20 Q190 70 150 110 Q110 70 150 20" transform="rotate(180 150 150)"/>
            <path d="M150 20 Q190 70 150 110 Q110 70 150 20" transform="rotate(225 150 150)"/>
            <path d="M150 20 Q190 70 150 110 Q110 70 150 20" transform="rotate(270 150 150)"/>
            <path d="M150 20 Q190 70 150 110 Q110 70 150 20" transform="rotate(315 150 150)"/>

            <!-- Diagonal Bell/Drop Motifs -->
            <!-- Top Right -->
            <g transform="translate(150, 150) rotate(22.5) translate(0, -110)">
              <path d="M0 0 L0 15 Q5 25 0 30 Q-5 25 0 15" fill="var(--accent-gold)" fill-opacity="0.2"/>
            </g>
            <g transform="translate(150, 150) rotate(67.5) translate(0, -110)"><path d="M0 0 L0 15 Q5 25 0 30 Q-5 25 0 15" fill="var(--accent-gold)" fill-opacity="0.2"/></g>
            <g transform="translate(150, 150) rotate(112.5) translate(0, -110)"><path d="M0 0 L0 15 Q5 25 0 30 Q-5 25 0 15" fill="var(--accent-gold)" fill-opacity="0.2"/></g>
            <g transform="translate(150, 150) rotate(157.5) translate(0, -110)"><path d="M0 0 L0 15 Q5 25 0 30 Q-5 25 0 15" fill="var(--accent-gold)" fill-opacity="0.2"/></g>
            <g transform="translate(150, 150) rotate(202.5) translate(0, -110)"><path d="M0 0 L0 15 Q5 25 0 30 Q-5 25 0 15" fill="var(--accent-gold)" fill-opacity="0.2"/></g>
            <g transform="translate(150, 150) rotate(247.5) translate(0, -110)"><path d="M0 0 L0 15 Q5 25 0 30 Q-5 25 0 15" fill="var(--accent-gold)" fill-opacity="0.2"/></g>
            <g transform="translate(150, 150) rotate(292.5) translate(0, -110)"><path d="M0 0 L0 15 Q5 25 0 30 Q-5 25 0 15" fill="var(--accent-gold)" fill-opacity="0.2"/></g>
            <g transform="translate(150, 150) rotate(337.5) translate(0, -110)"><path d="M0 0 L0 15 Q5 25 0 30 Q-5 25 0 15" fill="var(--accent-gold)" fill-opacity="0.2"/></g>

            <!-- Sacred Geometry / Rangoli Star -->
            <polygon points="150,100 162,138 200,138 168,162 180,200 150,175 120,200 132,162 100,138 138,138" stroke-width="0.5"/>
            <polygon points="150,100 162,138 200,138 168,162 180,200 150,175 120,200 132,162 100,138 138,138" transform="rotate(22.5 150 150)" stroke-width="0.5"/>
            <polygon points="150,100 162,138 200,138 168,162 180,200 150,175 120,200 132,162 100,138 138,138" transform="rotate(45 150 150)" stroke-width="0.5"/>
          </g>
        </pattern>
      </defs>
      <rect width="1200" height="1200" fill="url(#mandalaPattern)"/>
    </svg>`;

content = content.replace(/<svg viewBox="0 0 800 800" xmlns="http:\/\/www\.w3\.org\/2000\/svg">[\s\S]*?<\/svg>/, replacement);

fs.writeFileSync(indexPath, content, 'utf-8');
console.log("Updated index.html");
