const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'archive', 'frontend', 'src', 'data', 'templeDatabase.js');
let dbStr = fs.readFileSync(dbPath, 'utf8');

// Parse current DB properly
const dbMatch = dbStr.match(/export const templeDatabase = (\{[\s\S]*?\});/m);
let templeDatabase;
eval('templeDatabase = ' + dbMatch[1]);

const finalUrls = [
    '/temple_architecture.png',
    '/temple_nagaram.png',
    '/temple_shore.png'
];

let idx = 0;
for (const key in templeDatabase) {
    templeDatabase[key].images = [finalUrls[idx % finalUrls.length]];
    idx++;
}

fs.writeFileSync(dbPath, 'export const templeDatabase = ' + JSON.stringify(templeDatabase, null, 2) + ';\n', 'utf8');
console.log('Fixed images for ' + idx + ' temples.');
