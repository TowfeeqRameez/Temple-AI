import json
import csv
import os

input_file = r"c:\Users\Dusanapudi.Ganesh\Desktop\nlp prototype\prototype 4\datasets\templeKB\corpus\WebTempleCorpus.json"
output_file = r"c:\Users\Dusanapudi.Ganesh\Desktop\nlp prototype\prototype 4\datasets\templeKB_corpus.csv"

try:
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    rows = []
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, dict):
                # Flattens nested dict to a single depth string
                flat_value = { k: (v if not isinstance(v, dict) else str(v)) for k, v in value.items() }
                flat_value['id'] = key
                rows.append(flat_value)
            elif isinstance(value, list):
                if len(value) > 0 and isinstance(value[0], dict):
                    rows.extend(value)
    elif isinstance(data, list):
        rows = data
        
    if rows:
        headers = set()
        for row in rows:
            if isinstance(row, dict):
                headers.update(row.keys())
        headers = list(headers)
        
        with open(output_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            writer.writerows(rows)
        print(f"Created {output_file}")
    else:
        print("No rows found suitable for CSV conversion.")
except Exception as e:
    print(f"Error: {e}")
