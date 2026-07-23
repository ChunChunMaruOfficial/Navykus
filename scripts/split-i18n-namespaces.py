"""
Split translation.json into namespaced files for lazy loading.
Each page loads only the namespaces it needs.
"""

import json
import os
import shutil

LOCALES_DIR = 'public/locales'
LANGUAGES = ['ru', 'en', 'ar', 'de', 'es', 'kk', 'tr', 'uz']

# Define which top-level / second-level keys go into which namespace
NAMESPACE_MAP = {
    'common': {
        'top': ['languages', 'meta', 'common', 'errors', 'data'],
        'ui': [
            'app', 'enhancements', 'cookieconsent', 'legalpage',
        ],
        'platform': [],
    },
    'auth': {
        'top': [],
        'ui': ['authmodal'],
        'platform': ['auth'],
    },
    'blog': {
        'top': [],
        'ui': ['blogpage', 'blogeditor', 'blogmoderation'],
        'platform': [],
    },
    'championship': {
        'top': [],
        'ui': ['championshippage'],
        'platform': [],
    },
    'find-team': {
        'top': [],
        'ui': ['findteampage'],
        'platform': ['team'],
    },
    'activities': {
        'top': [],
        'ui': ['activitiespage', 'opportunitiespage'],
        'platform': [],
    },
    'about': {
        'top': [],
        'ui': ['aboutprojectpage', 'projectpage'],
        'platform': [],
    },
    'platform': {
        'top': [],
        'ui': ['applicationmodal'],
        'platform': [
            'nav', 'fields', 'errors', 'actions', 'status', 'roles',
            'accountStatus', 'privacy', 'notifications', 'settings',
            'avatar', 'team', 'admin', 'itemTypes', 'placeholders',
            'states', 'dashboard', 'dashboardHome', 'details',
        ],
    },
    'admin': {
        'top': [],
        'ui': [],
        'platform': ['admin'],
    },
}

def extract_keys(source, key_paths):
    """Extract specific keys from a nested dict by path patterns."""
    result = {}
    for path in key_paths:
        parts = path.split('.')
        current = source
        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                current = None
                break
        if current is not None:
            # Set the value at the nested path
            target = result
            for i, part in enumerate(parts):
                if i == len(parts) - 1:
                    target[part] = current
                else:
                    if part not in target:
                        target[part] = {}
                    target = target[part]
    return result

def get_nested(keys, *paths):
    """Get values from keys dict by dotted paths."""
    result = {}
    for path in paths:
        parts = path.split('.')
        current = keys
        valid = True
        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                valid = False
                break
        if valid:
            target = result
            for i, part in enumerate(parts):
                if i == len(parts) - 1:
                    target[part] = current
                else:
                    if part not in target:
                        target[part] = {}
                    target = target[part]
    return result

def build_namespace(data, ns_config):
    """Build a namespace dict from the full translation data."""
    ns_data = {}
    
    # Copy top-level keys
    for key in ns_config.get('top', []):
        if key in data:
            ns_data[key] = data[key]
    
    # Copy UI sub-keys
    ui_keys = ns_config.get('ui', [])
    if ui_keys and 'ui' in data:
        ns_data['ui'] = get_nested(data['ui'], *ui_keys)
        # Remove empty ui section
        if not ns_data['ui']:
            del ns_data['ui']
    
    # Copy platform sub-keys
    platform_keys = ns_config.get('platform', [])
    if platform_keys and 'platform' in data:
        ns_data['platform'] = get_nested(data['platform'], *platform_keys)
        if not ns_data['platform']:
            del ns_data['platform']
    
    return ns_data

def main():
    for lang in LANGUAGES:
        src_path = os.path.join(LOCALES_DIR, lang, 'translation.json')
        ns_dir = os.path.join(LOCALES_DIR, lang)
        
        if not os.path.exists(src_path):
            print(f'[SKIP] {lang}: translation.json not found')
            continue
        
        with open(src_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Back up the original
        bak_path = src_path + '.bak'
        if not os.path.exists(bak_path):
            shutil.copy2(src_path, bak_path)
            print(f'[BACKUP] {lang}: saved to {bak_path}')
        
        for ns_name, ns_config in NAMESPACE_MAP.items():
            ns_data = build_namespace(data, ns_config)
            ns_path = os.path.join(ns_dir, f'{ns_name}.json')
            
            with open(ns_path, 'w', encoding='utf-8') as f:
                json.dump(ns_data, f, ensure_ascii=False, indent=2)
            
            key_count = count_leaves(ns_data)
            file_size = os.path.getsize(ns_path)
            print(f'[CREATE] {lang}/{ns_name}.json: {key_count} keys, {file_size:,} bytes')
        
        # Keep translation.json as fallback (but smaller - only common keys)
        fallback_data = build_namespace(data, NAMESPACE_MAP['common'])
        with open(src_path, 'w', encoding='utf-8') as f:
            json.dump(fallback_data, f, ensure_ascii=False, indent=2)
        key_count = count_leaves(fallback_data)
        file_size = os.path.getsize(src_path)
        print(f'[UPDATE] {lang}/translation.json (fallback): {key_count} keys, {file_size:,} bytes')

def count_leaves(obj):
    if isinstance(obj, dict):
        return sum(count_leaves(v) for v in obj.values())
    return 1

if __name__ == '__main__':
    main()
