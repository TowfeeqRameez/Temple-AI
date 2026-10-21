const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'archive', 'frontend', 'src', 'data', 'templeDatabase.js');
let dbStr = fs.readFileSync(dbPath, 'utf8');

// Parse current DB
const dbMatch = dbStr.match(/export const templeDatabase = (\{[\s\S]*?\});/m);
let templeDatabase;
eval('templeDatabase = ' + dbMatch[1]);

// 1. Precise real images for major ones
const exactMatches = {
    "Meenakshi Temple": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Madurai_Meenakshi_Temple.jpg/1024px-Madurai_Meenakshi_Temple.jpg",
    "Tirupati Balaji": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Venkateshwara_Tirupati_Temple.jpg/1024px-Venkateshwara_Tirupati_Temple.jpg",
    "Somnath Temple": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Somnath_temple_panorama.jpg/1024px-Somnath_temple_panorama.jpg",
    "Kashi Vishwanath": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Kashi_Vishwanath_Temple_Banaras.jpg/1024px-Kashi_Vishwanath_Temple_Banaras.jpg",
    "Mahakaleshwar": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Mahakaleshwar_Jyotirlinga_Ujjain.jpg/1024px-Mahakaleshwar_Jyotirlinga_Ujjain.jpg",
    "Jagannath Puri": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Jagannath_Temple_Puri.jpg/1024px-Jagannath_Temple_Puri.jpg",
    "Badrinath": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Badrinath_Temple_India.jpg/1024px-Badrinath_Temple_India.jpg",
    "Kedarnath": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Kedarnath_Temple_Garhwal_Himalayas.jpg/1024px-Kedarnath_Temple_Garhwal_Himalayas.jpg",
    "Sringeri Sharadamba": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Sringeri_Temple_Main.jpg/1024px-Sringeri_Temple_Main.jpg",
    "Golden Temple": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Golden_Temple_India.jpg/1024px-Golden_Temple_India.jpg",
    "Dwarkadhish": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Dwarkadhish_Temple_Gujarat.jpg/1024px-Dwarkadhish_Temple_Gujarat.jpg"
};

// 2. Beautiful massive Unsplash Array for everything else (10 heavily distinct gorgeous images)
const unsplashArray = [
    "https://images.unsplash.com/photo-1582510003544-4d00b7f7415e?auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1623134114400-3b4c107beee6?auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1600100397608-f010f4188f6c?auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1544971587-f83b632669ab?auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1580227918360-15bd9b5e82ac?auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1614088015383-c28892ca8499?auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1560179406-1c6c60e0eee1?auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1621213032545-2e6ca6f9a039?auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1614088015349-f9c49d443c7b?auto=format&fit=crop&w=1000&q=80"
];

let idx = 0;
for (const key in templeDatabase) {
    if (exactMatches[key]) {
        templeDatabase[key].images = [exactMatches[key]];
    } else {
        templeDatabase[key].images = [unsplashArray[idx % unsplashArray.length]];
        idx++;
    }
}

fs.writeFileSync(dbPath, 'export const templeDatabase = ' + JSON.stringify(templeDatabase, null, 2) + ';\n', 'utf8');
console.log('Successfully mapped remote internet photography to ' + Object.keys(templeDatabase).length + ' temples.');
