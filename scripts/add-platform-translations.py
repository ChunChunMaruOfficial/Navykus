"""
Add missing 'platform' translations to all 8 locale files.
Uses English as the source for the complete platform section structure.
"""
import json
import os

LOCALES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'locales')

# Load English as template
with open(os.path.join(LOCALES_DIR, 'en', 'translation.json'), 'r', encoding='utf-8') as f:
    en_data = json.load(f)

en_platform = en_data.get('platform', {})

if not en_platform:
    print("ERROR: English file doesn't have platform section!")
    exit(1)

print(f"English platform subkeys: {list(en_platform.keys())}")

for lang in sorted(os.listdir(LOCALES_DIR)):
    filepath = os.path.join(LOCALES_DIR, lang, 'translation.json')
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    existing = data.get('platform', {})
    has_platform = 'platform' in data
    existing_keys = set(existing.keys())
    missing_keys = set(en_platform.keys()) - existing_keys
    
    if not missing_keys:
        print(f'{lang}: complete ({len(existing_keys)} subkeys)')
        continue
    
    # Merge: keep existing, add missing from English
    for key in missing_keys:
        existing[key] = en_platform[key]
    
    data['platform'] = existing
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    
    print(f'{lang}: added {len(missing_keys)} missing subkeys')

print('Done!')
