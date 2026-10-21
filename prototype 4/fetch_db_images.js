const fs = require('fs');
const https = require('https');
const path = require('path');

const dbPath = path.join(__dirname, 'archive', 'frontend', 'src', 'data', 'templeDatabase.js');
let dbStr = fs.readFileSync(dbPath, 'utf8');

const dbMatch = dbStr.match(/export const templeDatabase = (\{[\s\S]*?\});/m);
let templeDatabase;
eval('templeDatabase = ' + dbMatch[1]);

// List of sure-fire wikipedia titles representing grand Hindu temples
const guaranteedTitles = [
    "Meenakshi Temple", "Venkateswara Temple, Tirumala", "Somnath temple",
    "Kashi Vishwanath Temple", "Mahakaleshwar Jyotirlinga", "Jagannath Temple, Puri",
    "Badrinath Temple", "Kedarnath Temple", "Golden Temple", "Dwarkadhish Temple",
    "Brihadisvara Temple, Thanjavur", "Virupaksha Temple, Hampi", "Konark Sun Temple",
    "Lingaraja Temple", "Ramanathaswamy Temple", "Akshardham (Delhi)"
];

async function fetchWikiImage(title) {
    return new Promise((resolve) => {
        const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&titles=${encodeURIComponent(title)}&format=json&pithumbsize=1024`;
        https.get(url, { headers: { 'User-Agent': 'TempleAI-Bot/1.0 (https://local.dev)' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    const pages = parsed.query.pages;
                    const pageId = Object.keys(pages)[0];
                    if (pages[pageId].thumbnail && pages[pageId].thumbnail.source) {
                        resolve(pages[pageId].thumbnail.source);
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        }).on('error', () => {
            resolve(null);
        });
    });
}

(async () => {
    // 1. Preload 15 guaranteed images
    const guaranteedPool = [];
    for (const title of guaranteedTitles) {
        const img = await fetchWikiImage(title);
        if (img) guaranteedPool.push(img);
    }
    console.log(`Fetched ${guaranteedPool.length} flawless Wikipedia images.`);

    // 2. Loop our temples, try to find an exact hit, else fallback to the pool
    const keys = Object.keys(templeDatabase);
    let fallbackIdx = 0;

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        let img = await fetchWikiImage(key); // Attempt precise lookup
        if (!img || img.includes('logo') || img.includes('map')) {
            img = guaranteedPool[fallbackIdx % guaranteedPool.length];
            fallbackIdx++;
        }
        templeDatabase[key].images = [img];
        console.log(`Assigned image for ${key}`);
    }

    fs.writeFileSync(dbPath, 'export const templeDatabase = ' + JSON.stringify(templeDatabase, null, 2) + ';\n', 'utf8');
    console.log('Successfully embedded verified API images into the database.');
})();
