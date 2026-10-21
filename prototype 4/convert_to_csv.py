import json
import csv
import os

def convert_json_to_csv(input_file, output_file):
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading {input_file}: {e}")
        return
    
    rows = []
    if isinstance(data, dict):
        # Flatten dictionary of lists
        for key, value in data.items():
            if isinstance(value, list) and len(value) > 0 and isinstance(value[0], dict):
                for item in value:
                    item['category'] = key
                    rows.append(item)
            elif isinstance(value, dict):
                value['category'] = key
                rows.append(value)
    elif isinstance(data, list):
        rows = data
        
    if not rows:
        print(f"No valid rows found to extract from {input_file}")
        return
        
    # Get all possible headers
    headers = set()
    for row in rows:
        headers.update(row.keys())
    headers = list(headers)
    
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Created {output_file}")

input_dir = r"c:\Users\Dusanapudi.Ganesh\Desktop\nlp prototype\prototype 4\datasets\hindu-temples\data"
output_dir = r"c:\Users\Dusanapudi.Ganesh\Desktop\nlp prototype\prototype 4\datasets"

convert_json_to_csv(os.path.join(input_dir, "hindu_temples.json"), os.path.join(output_dir, "hindu_temples.csv"))
convert_json_to_csv(os.path.join(input_dir, "dieties.json"), os.path.join(output_dir, "dieties.csv"))
convert_json_to_csv(os.path.join(input_dir, "states.json"), os.path.join(output_dir, "states.csv"))
