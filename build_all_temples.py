import csv, json, re, zipfile, xml.etree.ElementTree as ET

# 1. Parse SVG State bounding boxes from prototype 4/index.html
with open('prototype 4/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

paths = dict(re.findall(r'<path[^>]*id=\"(IN-[A-Z]+)\"[^>]*d=\"([^\"]+)\"', html))

def parse_svg_path(d):
    tokens = re.findall(r'([a-zA-Z])|([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)', d)
    cur_x, cur_y = 0.0, 0.0
    start_x, start_y = 0.0, 0.0
    pts = []
    cmd = ''
    i = 0
    while i < len(tokens):
        c, n = tokens[i]
        if c:
            cmd = c; i += 1; continue
        if cmd == 'm':
            cur_x += float(n); i += 1
            cur_y += float(tokens[i][1]); i += 1
            start_x, start_y = cur_x, cur_y
            pts.append((cur_x, cur_y))
            cmd = 'l'
        elif cmd == 'l':
            cur_x += float(n); i += 1
            cur_y += float(tokens[i][1]); i += 1
            pts.append((cur_x, cur_y))
        elif cmd == 'z' or cmd == 'Z':
            cur_x, cur_y = start_x, start_y
            i += 1
        else:
            i += 1
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return min(xs), max(xs), min(ys), max(ys)

state_boxes = {}
for st, d in paths.items():
    res = parse_svg_path(d)
    if res:
        min_x, max_x, min_y, max_y = res
        state_boxes[st] = {
            'min_x': min_x, 'max_x': max_x,
            'min_y': min_y, 'max_y': max_y,
            'vbX': min_x - 15, 'vbW': (max_x - min_x) + 30,
            'vbY': min_y - 15, 'vbH': (max_y - min_y) + 30
        }

# State bounds for projection
proj_bounds = {
    'IN-TN': {'min_x': 168.29, 'max_x': 254.52, 'min_y': 551.22, 'max_y': 667.77, 'lon_min': 76.2, 'lon_max': 80.3, 'lat_min': 8.08, 'lat_max': 13.5},
    'IN-KL': {'min_x': 139.85, 'max_x': 192.79, 'min_y': 567.30, 'max_y': 663.08, 'lon_min': 74.9, 'lon_max': 77.4, 'lat_min': 8.30, 'lat_max': 12.55},
    'IN-KA': {'min_x': 123.69, 'max_x': 217.52, 'min_y': 443.99, 'max_y': 593.37, 'lon_min': 74.05, 'lon_max': 78.58, 'lat_min': 11.60, 'lat_max': 18.40},
    'IN-AP': {'min_x': 179.48, 'max_x': 346.96, 'min_y': 428.42, 'max_y': 571.13, 'lon_min': 76.7, 'lon_max': 84.7, 'lat_min': 12.60, 'lat_max': 19.10},
    'IN-TG': {'min_x': 189.42, 'max_x': 284.83, 'min_y': 411.54, 'max_y': 501.61, 'lon_min': 77.2, 'lon_max': 81.3, 'lat_min': 15.80, 'lat_max': 19.90}
}

def project_south(st, lat, lon):
    b = proj_bounds[st]
    svgX = b['min_x'] + (lon - b['lon_min']) * (b['max_x'] - b['min_x']) / (b['lon_max'] - b['lon_min'])
    svgY = b['max_y'] - (lat - b['lat_min']) * (b['max_y'] - b['min_y']) / (b['lat_max'] - b['lat_min'])
    
    # Clamp inside state box
    sbox = state_boxes[st]
    svgX = max(sbox['min_x'] + 1.2, min(sbox['max_x'] - 1.2, svgX))
    svgY = max(sbox['min_y'] + 1.2, min(sbox['max_y'] - 1.2, svgY))
    
    # State overlay percentage with 15px padding
    vbX, vbW, vbY, vbH = sbox['vbX'], sbox['vbW'], sbox['vbY'], sbox['vbH']
    x_pct = round(((svgX - vbX) / vbW) * 100, 1)
    y_pct = round(((svgY - vbY) / vbH) * 100, 1)
    return round(svgX, 2), round(svgY, 2), x_pct, y_pct

# 2. Load existing North India dataset
with open('prototype 4/northIndiaTemplesData.js', 'r', encoding='utf-8') as f:
    text = f.read()
match = re.search(r'const NORTH_INDIA_TEMPLES_BY_STATE\s*=\s*(\{[\s\S]*?\});', text)
north_by_state = json.loads(match.group(1))

# Also read North Excel to get Google Map URLs & sources
north_excel_map = {}
with zipfile.ZipFile('North_India_Temples_Updated.xlsx', 'r') as z:
    sheet_tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    rows = sheet_tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheetData/{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row')
    for r in rows[1:]:
        cells = {}
        for c in r.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
            col = ''.join([ch for ch in c.get('r') if ch.isalpha()])
            is_node = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}is')
            v_node = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
            val = ''.join(is_node.itertext()) if is_node is not None else (v_node.text if v_node is not None else '')
            cells[col] = val
        sno = int(cells.get('A', 0))
        north_excel_map[sno] = cells

# Process North Temples
processed_north = {}
state_name_map = {
    'IN-JK': 'Jammu & Kashmir', 'IN-UK': 'Uttarakhand', 'IN-HP': 'Himachal Pradesh',
    'IN-PB': 'Punjab', 'IN-HR': 'Haryana', 'IN-DL': 'Delhi (NCR)', 'IN-UP': 'Uttar Pradesh',
    'IN-RJ': 'Rajasthan', 'IN-MP': 'Madhya Pradesh', 'IN-BR': 'Bihar',
    'IN-TN': 'Tamil Nadu', 'IN-KL': 'Kerala', 'IN-KA': 'Karnataka',
    'IN-AP': 'Andhra Pradesh', 'IN-TG': 'Telangana'
}

for st, tlist in north_by_state.items():
    processed_north[st] = []
    sbox = state_boxes[st]
    vbX, vbW, vbY, vbH = sbox['vbX'], sbox['vbW'], sbox['vbY'], sbox['vbH']
    for t in tlist:
        sno = t['sno']
        excel_row = north_excel_map.get(sno, {})
        map_url = excel_row.get('F') or t.get('mapUrl') or f"https://www.google.com/maps/search/?api=1&query={t['name'].replace(' ', '+')}"
        
        # Exact SVG coordinates
        raw_x = vbX + (t['x'] / 100.0) * vbW
        raw_y = vbY + (t['y'] / 100.0) * vbH
        # Clamp slightly inside state bounds
        clamped_x = max(sbox['min_x'] + 1.2, min(sbox['max_x'] - 1.2, raw_x))
        clamped_y = max(sbox['min_y'] + 1.2, min(sbox['max_y'] - 1.2, raw_y))
        
        x_pct = round(((clamped_x - vbX) / vbW) * 100, 1)
        y_pct = round(((clamped_y - vbY) / vbH) * 100, 1)
        
        item = {
            'sno': sno,
            'id': f"temple-north-{sno}",
            'name': t['name'],
            'fullName': t.get('fullName', t['name']),
            'deity': t.get('deity', ''),
            'region': 'North India',
            'stateId': st,
            'stateName': state_name_map.get(st, st),
            'location': t.get('location', ''),
            'uniqueness': t.get('uniqueness', ''),
            'history': t.get('history', ''),
            'architecture': t.get('architecture', ''),
            'ritual': t.get('ritual', ''),
            'festival': t.get('festival', ''),
            'belief': t.get('belief', ''),
            'visitorInfo': t.get('visitorInfo', ''),
            'mapUrl': map_url,
            'source': t.get('source', ''),
            'speciality': t.get('speciality', []),
            'svgX': round(clamped_x, 2),
            'svgY': round(clamped_y, 2),
            'x': x_pct,
            'y': y_pct
        }
        processed_north[st].append(item)

print('Processed North temples:', sum(len(v) for v in processed_north.values()))

# 3. Process South Temples
with open('south_temple/Master 100 temples-Table 1.csv', 'r', encoding='utf-8', errors='ignore') as f:
    south_master = list(csv.DictReader(f))

# Load new 26 GPS
new26_map = {}
with open('south_temple/New 26 temples-Table 1.csv', 'r', encoding='utf-8', errors='ignore') as f:
    for r in csv.DictReader(f):
        loc = r.get('Location', '')
        m1 = re.search(r'!3d([0-9.]+)!4d([0-9.]+)', loc)
        m2 = re.search(r'@([0-9.]+),([0-9.]+)', loc)
        if m1:
            new26_map[r['Temple'].strip()] = (float(m1.group(1)), float(m1.group(2)), loc)
        elif m2:
            new26_map[r['Temple'].strip()] = (float(m2.group(1)), float(m2.group(2)), loc)

# Load visitor timings
timings_dict = {}
with open('south_temple/Visitor timing sources-Table 1.csv', 'r', encoding='utf-8', errors='ignore') as f:
    for r in csv.DictReader(f):
        name = r.get('Temple', '').strip()
        timings_dict[name] = {
            'hours': r.get('Published hours / availability', '').strip(),
            'note': r.get('Practical note', '').strip(),
            'source_url': r.get('Source URL', '').strip()
        }

coords_74 = {
    1: (10.9250, 78.5830),  # Gunaseelam, Musiri, Tiruchirappalli, TN
    2: (10.9520, 79.4320),  # Thiruneelakudi, Thanjavur, TN
    3: (13.1800, 79.6100),  # Tiruttani, Thiruvallur, TN
    4: (10.9590, 78.0830),  # Karur Pathaleswarar, Karur, TN
    5: (10.9850, 79.4380),  # Thirubuvanam, Thanjavur, TN
    6: (10.7830, 79.3620),  # Kovilvenni, Thiruvarur, TN
    7: (10.8710, 79.4120),  # Alangudi Guru Sthalam, Kumbakonam, TN
    8: (11.0420, 78.8450),  # Oottathur, near Trichy, TN
    9: (10.9600, 78.0800),  # Karur Pasupatheeswarar, Karur, TN
    10: (13.1160, 80.0240), # Thiruninravur, Chennai, TN
    11: (16.5280, 81.7290), # Palakollu, West Godavari, AP
    12: (10.7760, 79.6320), # Thiruvarur Achaleswarar, Thiruvarur, TN
    13: (10.8280, 78.6970), # Rockfort Trichy, Tiruchirappalli, TN
    14: (14.0760, 80.0270), # Mallam Subramanya, Nellore, AP
    15: (11.0180, 79.4790), # Suryanar Koil / Aduthurai, TN
    16: (10.2450, 78.7560), # Thirumayam, Pudukkottai, TN
    17: (13.8040, 77.6060), # Lepakshi, Anantapur, AP
    18: (12.9460, 74.8870), # Adyapady, Mangalore, KA
    19: (13.2130, 75.9940), # Halebidu, Hassan, KA
    20: (9.9320, 76.3930),  # Chottanikkara, Ernakulam, KL
    21: (11.3990, 79.6930), # Chidambaram Nataraja, Cuddalore, TN
    22: (18.6650, 78.9460), # Kondagattu Anjaneya, Jagtial, TG
    23: (13.1620, 75.8600), # Belur Chennakeshava, Hassan, KA
    24: (12.5180, 75.1270), # Kanathur, Kasaragod, KL
    25: (12.7290, 80.0070), # Chettippunniyam, Chengalpattu, TN
    26: (10.9630, 79.4310), # Thirunageswaram, Kumbakonam, TN
    27: (13.1760, 78.3610), # Kurudumale, Kolar, KA
    28: (12.7630, 80.2390), # Thiruvidandhai, ECR, Chennai, TN
    29: (12.6320, 76.4710), # Kallahalli, Mandya, KA
    30: (10.8750, 79.4580), # Tirucherai, Kumbakonam, TN
    31: (14.4170, 78.2320), # Pulivendula, Kadapa, AP
    32: (12.8710, 74.8690), # Maroli, Mangalore, KA
    33: (15.3350, 76.4670), # Hampi Vijaya Vittala, Vijayanagara, KA
    34: (16.5100, 80.6400), # Purana Ganapathi (Telugu historical region)
    35: (8.7060, 77.3710),  # Papanasam, Tirunelveli, TN
    36: (10.9780, 79.1670), # Kamaravalli, Ariyalur, TN
    37: (13.6280, 79.4190), # Mukkoti Tirupati, AP
    38: (10.9990, 79.4670), # Thiruvidaimarudur, Thanjavur, TN
    39: (12.6630, 75.6150), # Kukke Subrahmanya, Dakshina Kannada, KA
    40: (8.6250, 77.9890),  # Thirukkolur, Thoothukudi, TN
    41: (9.5840, 76.5320),  # Chammanakuzhi, Kottayam, KL
    42: (11.2010, 79.7130), # Vaitheeswaran Koil, Mayiladuthurai, TN
    43: (9.5160, 77.6330),  # Madavar Koil, Srivilliputhur, TN
    44: (12.2310, 79.0670), # Arunachaleswarar, Tiruvannamalai, TN
    45: (10.8870, 79.5750), # Srivanchiyam, Tiruvarur, TN
    46: (10.8650, 79.2550), # Thirukkarukavur, Thanjavur, TN
    47: (13.1800, 79.6100), # Tiruttani cluster, TN
    48: (10.9610, 79.4320), # Oppiliappan, Kumbakonam, TN
    49: (11.1090, 79.6580), # Thiruindalur, Mayiladuthurai, TN
    50: (10.9590, 79.3790), # Nageswaraswamy, Kumbakonam, TN
    51: (8.4890, 76.9440),  # Pazhaya Sreekanteswaram, Thiruvananthapuram, KL
    52: (10.7830, 79.1320), # Brihadeeswarar, Thanjavur, TN
    53: (18.8770, 77.9570), # Gnana Saraswati, Basar, Nirmal, TG
    54: (17.7420, 83.3360), # MVP Colony, Visakhapatnam, AP
    55: (10.7870, 79.1380), # Agastheeswarar Akhanda Jyothi, Thanjavur, TN
    56: (12.5020, 79.6120), # Purisai, Vandavasi, TN
    57: (11.0190, 79.4800), # Suryanar Koil, Thanjavur, TN
    58: (16.6340, 82.1640), # Muramulla, Konaseema, AP
    59: (13.6830, 79.3470), # Tirumala Venkateswara, Tirupati, AP
    60: (11.3990, 79.4090), # Srimushnam, Cuddalore, TN
    61: (10.4350, 76.1550), # Kaliyarmadam, Peringottukara, Thrissur, KL
    62: (14.4430, 79.9860), # Talpagiri Ranganatha, Nellore, AP
    63: (14.7890, 75.9720), # Neelagunda Bheemeshwara, Vijayanagara, KA
    64: (9.3170, 76.6130),  # Chengannur Mahadeva, Alappuzha, KL
    65: (9.1860, 76.7860),  # Kodumon Palliyara, Pathanamthitta, KL
    66: (13.6120, 74.8360), # Guddattu Vinayaka, Kundapura, Udupi, KA
    67: (9.2820, 76.5180),  # Mannarasala Nagaraja, Haripad, Alappuzha, KL
    68: (11.3810, 77.8970), # Ardhanareeswarar, Tiruchengode, Namakkal, TN
    69: (11.0960, 79.6060), # Thirumanancheri, Mayiladuthurai, TN
    70: (12.9550, 75.3800), # Dharmasthala Manjunatha, KA
    71: (8.4720, 76.9530),  # Attukal Bhagavathy, Thiruvananthapuram, KL
    72: (13.8650, 74.8140), # Kollur Mookambika, Udupi, KA
    73: (11.0770, 79.8080), # Thirukkadaiyur Abirami, Mayiladuthurai, TN
    74: (11.8710, 75.8600)  # Kottiyoor Mahadeva, Kannur, KL
}

processed_south = {
    'IN-TN': [], 'IN-KL': [], 'IN-KA': [], 'IN-AP': [], 'IN-TG': []
}

def derive_speciality(deity, uniqueness, keywords):
    text = f"{deity} {uniqueness} {keywords}".lower()
    specs = []
    if any(k in text for k in ['shiva', 'mahadev', 'lingam', 'nataraja', 'ardhanareeswarar']): specs.append('Shiva')
    if any(k in text for k in ['vishnu', 'perumal', 'ranganatha', 'venkateswara', 'balaji', 'varaha']): specs.append('Vishnu')
    if any(k in text for k in ['krishna', 'gopala']): specs.append('Krishna')
    if any(k in text for k in ['devi', 'amman', 'bhagavathy', 'mariamman', 'parvati', 'abirami', 'saraswati', 'yellamma']): specs.append('Devi / Goddess')
    if any(k in text for k in ['ganesha', 'vinayaka', 'ganapathy']): specs.append('Ganesha')
    if any(k in text for k in ['subrahmanya', 'murugan', 'kartikeya']): specs.append('Murugan')
    if any(k in text for k in ['health', 'disease', 'healing', 'cure', 'cure', 'autism', 'seizure', 'skin', 'fever', 'mental']): specs.append('Health')
    if any(k in text for k in ['wealth', 'financial', 'debt', 'rina vimochana', 'prosperity']): specs.append('Wealth')
    if any(k in text for k in ['marriage', 'wedding', 'matrimony', 'kalyana']): specs.append('Marriage')
    if any(k in text for k in ['education', 'learning', 'vidya', 'speech', 'intelligence', 'saraswathi']): specs.append('Education')
    if any(k in text for k in ['child', 'fertility', 'conception', 'garba', 'santana']): specs.append('Child / Family')
    if any(k in text for k in ['visa', 'foreign', 'travel']): specs.append('Visa')
    if any(k in text for k in ['peace', 'wishes', 'protection', 'navagraha', 'rahu', 'ketu', 'graha']): specs.append('Wishes / Peace')
    return list(dict.fromkeys(specs))[:4] or ['Spiritual Blessing']

for i, r in enumerate(south_master, 1):
    sno = 100 + i
    tname = r['Temple'].strip()
    loc_text = r['Location'].strip()
    deity = r['Deity'].strip()
    
    # State identification
    st = 'IN-TN'
    if 'Kerala' in loc_text: st = 'IN-KL'
    elif 'Karnataka' in loc_text: st = 'IN-KA'
    elif 'Andhra Pradesh' in loc_text or 'Tirupati' in loc_text: st = 'IN-AP'
    elif 'Telangana' in loc_text or 'Hyderabad' in loc_text: st = 'IN-TG'
    elif 'Tamil Nadu' in loc_text or 'Chennai' in loc_text: st = 'IN-TN'
    
    # Coordinates
    if tname in new26_map:
        lat, lon = new26_map[tname][0], new26_map[tname][1]
        map_url = new26_map[tname][2]
    else:
        lat, lon = coords_74.get(i, (10.8, 78.7))
        map_url = f"https://www.google.com/maps/search/?api=1&query={tname.replace(' ', '+')}+{loc_text.replace(' ', '+')}"
    
    svgX, svgY, x_pct, y_pct = project_south(st, lat, lon)
    
    # Visitor info
    tinfo = timings_dict.get(tname, {})
    vis_info = r.get('Visitor Information', '').strip()
    if tinfo.get('hours') and tinfo['hours'] not in ['Not confirmed', '']:
        vis_info = f"Timings: {tinfo['hours']}. {vis_info}"
    
    specialities = derive_speciality(deity, r.get('Uniqueness', ''), r.get('Keywords', ''))
    
    item = {
        'sno': sno,
        'id': f"temple-south-{i}",
        'name': tname,
        'fullName': f"{tname} | {deity} Shrine | {loc_text.split('.')[0]}",
        'deity': deity,
        'region': 'South India',
        'stateId': st,
        'stateName': state_name_map.get(st, st),
        'location': loc_text,
        'uniqueness': r.get('Uniqueness', '').strip(),
        'history': r.get('History', '').strip(),
        'architecture': r.get('Architecture', '').strip(),
        'ritual': r.get('Ritual', '').strip(),
        'festival': r.get('Festival', '').strip(),
        'belief': r.get('Belief and Tradition', '').strip(),
        'visitorInfo': vis_info,
        'mapUrl': map_url,
        'source': r.get('Source', '').strip(),
        'speciality': specialities,
        'lat': round(lat, 5),
        'lng': round(lon, 5),
        'svgX': svgX,
        'svgY': svgY,
        'x': x_pct,
        'y': y_pct
    }
    processed_south[st].append(item)

print('Processed South temples:', sum(len(v) for v in processed_south.values()))

# Merge both datasets into ALL_INDIA_TEMPLES_BY_STATE
all_india_temples = {}
# Add all North states
for st, tlist in processed_north.items():
    all_india_temples[st] = tlist
# Add all South states
for st, tlist in processed_south.items():
    all_india_temples[st] = tlist

total_temples = sum(len(v) for v in all_india_temples.values())
print(f'Total Unified Temples: {total_temples} across {len(all_india_temples)} states')

# Write allIndiaTemplesData.js
js_output = f"""/* ============================================================
   TempleVerse - All India Temples Dataset (200 Verified Temples)
   Curated comprehensive repository across North & South India
   ============================================================ */

const ALL_INDIA_TEMPLES_BY_STATE = {json.dumps(all_india_temples, indent=2)};

// Backward compatibility alias for North India modules
const NORTH_INDIA_TEMPLES_BY_STATE = {json.dumps(processed_north, indent=2)};

// South India module export
const SOUTH_INDIA_TEMPLES_BY_STATE = {json.dumps(processed_south, indent=2)};

if (typeof window !== 'undefined') {{
  window.ALL_INDIA_TEMPLES_BY_STATE = ALL_INDIA_TEMPLES_BY_STATE;
  window.NORTH_INDIA_TEMPLES_BY_STATE = ALL_INDIA_TEMPLES_BY_STATE; // Seamlessly empower all modules
  window.SOUTH_INDIA_TEMPLES_BY_STATE = SOUTH_INDIA_TEMPLES_BY_STATE;
}}

if (typeof module !== 'undefined' && module.exports) {{
  module.exports = {{ ALL_INDIA_TEMPLES_BY_STATE, NORTH_INDIA_TEMPLES_BY_STATE, SOUTH_INDIA_TEMPLES_BY_STATE }};
}}
"""

with open('prototype 4/allIndiaTemplesData.js', 'w', encoding='utf-8') as f:
    f.write(js_output)

# Also update northIndiaTemplesData.js with the full 200 unified data so existing scripts work automatically!
with open('prototype 4/northIndiaTemplesData.js', 'w', encoding='utf-8') as f:
    f.write(js_output)

print('Generated prototype 4/allIndiaTemplesData.js and updated prototype 4/northIndiaTemplesData.js successfully!')
