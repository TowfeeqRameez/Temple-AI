const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'app.js');
let content = fs.readFileSync(indexPath, 'utf-8');

const newTemples = `const templesByState = {
  'IN-RJ': [
    { name: 'Brahma Temple', deity: 'Lord Brahma', speciality: ['Visa', 'Wealth'], x: 55, y: 55 },
    { name: 'Dilwara Temples', deity: 'Tirthankara Adinath', speciality: ['Health', 'House'], x: 30, y: 75 }
  ],
  'IN-MH': [
    { name: 'Siddhivinayak Temple', deity: 'Lord Ganesha', speciality: ['Visa', 'Education'], x: 10, y: 65 },
    { name: 'Trimbakeshwar', deity: 'Lord Shiva', speciality: ['Health', 'Wealth'], x: 25, y: 35 }
  ],
  'IN-TN': [
    { name: 'Meenakshi Temple', deity: 'Goddess Meenakshi', speciality: ['House', 'Health'], x: 45, y: 70 },
    { name: 'Ramanathaswamy', deity: 'Lord Shiva', speciality: ['Visa', 'Wealth'], x: 70, y: 80 }
  ],
  'IN-KA': [
    { name: 'Chamundeshwari', deity: 'Goddess Chamundi', speciality: ['Health', 'Education'], x: 50, y: 80 },
    { name: 'Sringeri Sharada Peetham', deity: 'Goddess Saraswati', speciality: ['Wealth', 'House'], x: 35, y: 60 }
  ],
  'IN-KL': [
    { name: 'Padmanabhaswamy', deity: 'Lord Vishnu', speciality: ['Wealth', 'Visa'], x: 55, y: 90 },
    { name: 'Guruvayur Temple', deity: 'Lord Krishna', speciality: ['Health', 'Education'], x: 35, y: 40 }
  ],
  'IN-AP': [
    { name: 'Tirupati Balaji', deity: 'Lord Venkateswara', speciality: ['Visa', 'Wealth', 'Education'], x: 25, y: 85 },
    { name: 'Srikalahasti', deity: 'Lord Shiva', speciality: ['Health'], x: 30, y: 80 }
  ],
  'IN-TG': [
    { name: 'Yadadri Temple', deity: 'Lord Lakshmi Narasimha', speciality: ['House', 'Health'], x: 50, y: 50 },
    { name: 'Bhadrachalam', deity: 'Lord Rama', speciality: ['Visa', 'Education'], x: 75, y: 35 }
  ],
  'IN-UP': [
    { name: 'Kashi Vishwanath', deity: 'Lord Shiva', speciality: ['Visa', 'Wealth', 'Health'], x: 75, y: 75 },
    { name: 'Banke Bihari (Vrindavan)', deity: 'Lord Krishna', speciality: ['House', 'Health'], x: 15, y: 40 }
  ],
  'IN-GJ': [
    { name: 'Somnath Temple', deity: 'Lord Shiva', speciality: ['Wealth', 'Visa'], x: 20, y: 75 },
    { name: 'Dwarkadhish', deity: 'Lord Krishna', speciality: ['Education', 'Health'], x: 5, y: 50 }
  ],
  'IN-WB': [
    { name: 'Dakshineswar Kali', deity: 'Goddess Kali', speciality: ['Health', 'House'], x: 70, y: 70 },
    { name: 'Kalighat Temple', deity: 'Goddess Kali', speciality: ['Visa', 'Wealth'], x: 68, y: 75 }
  ],
  'IN-MP': [
    { name: 'Mahakaleshwar', deity: 'Lord Shiva', speciality: ['Visa', 'Health'], x: 25, y: 50 },
    { name: 'Khajuraho Temples', deity: 'Various', speciality: ['Education', 'Wealth'], x: 75, y: 20 }
  ],
  'IN-BR': [
    { name: 'Mahabodhi Temple', deity: 'Lord Buddha', speciality: ['Health', 'House'], x: 50, y: 75 },
    { name: 'Vishnupad Temple', deity: 'Lord Vishnu', speciality: ['Visa', 'Wealth'], x: 45, y: 80 }
  ],
  'IN-OR': [
    { name: 'Jagannath Temple', deity: 'Lord Jagannath', speciality: ['Visa', 'Health', 'Wealth'], x: 75, y: 60 },
    { name: 'Lingaraj Temple', deity: 'Lord Shiva', speciality: ['Education'], x: 70, y: 55 }
  ],
  'IN-PB': [
    { name: 'Golden Temple', deity: 'Guru Granth Sahib', speciality: ['House', 'Health'], x: 25, y: 25 }
  ],
  'IN-UT': [
    { name: 'Kedarnath', deity: 'Lord Shiva', speciality: ['Wealth', 'Health'], x: 40, y: 20 },
    { name: 'Badrinath', deity: 'Lord Vishnu', speciality: ['Visa'], x: 55, y: 20 }
  ],
  'IN-HR': [
    { name: 'Brahma Sarovar', deity: 'Lord Brahma', speciality: ['Wealth', 'Education'], x: 60, y: 20 }
  ],
  'IN-HP': [
    { name: 'Jwala Ji Temple', deity: 'Goddess Jwala', speciality: ['Visa', 'Health'], x: 30, y: 50 }
  ],
  'IN-CT': [
    { name: 'Bhoramdeo Temple', deity: 'Lord Shiva', speciality: ['House', 'Wealth'], x: 25, y: 40 }
  ],
  'IN-JH': [
    { name: 'Baidyanath Temple', deity: 'Lord Shiva', speciality: ['Health', 'Education'], x: 75, y: 25 }
  ],
  'IN-AS': [
    { name: 'Kamakhya Temple', deity: 'Goddess Kamakhya', speciality: ['Wealth', 'Visa'], x: 35, y: 55 }
  ],
  'IN-JK': [
    { name: 'Vaishno Devi', deity: 'Goddess Mata Rani', speciality: ['House', 'Health'], x: 35, y: 70 },
    { name: 'Amarnath Cave', deity: 'Lord Shiva', speciality: ['Visa', 'Wealth'], x: 55, y: 45 }
  ],
  'IN-LA': [
    { name: 'Thiksey Monastery', deity: 'Lord Buddha', speciality: ['Education', 'Health'], x: 30, y: 40 }
  ]
};

// ── State Code to Name Mapping ──`;

// Simple regex replace from "const templesByState = {" to "// ── State Code to Name Mapping ──"
content = content.replace(/const templesByState = \{[\s\S]*?\/\/\s*── State Code to Name Mapping ──/, newTemples);

fs.writeFileSync(indexPath, content, 'utf-8');
console.log("Updated app.js with accurate geographic pin placements");
