---
dataset_info:
  features:
  - name: topic
    dtype: string
  - name: description
    dtype: string
  - name: region
    dtype: string
  - name: category
    dtype: string
  - name: subcategory
    dtype: string
  - name: source
    dtype: string
  splits:
  - name: train
    num_bytes: 115450
    num_examples: 506
  download_size: 47614
  dataset_size: 115450
configs:
- config_name: default
  data_files:
  - split: train
    path: data/train-*
---
