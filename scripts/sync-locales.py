import json
import os

locales = ['ar', 'de', 'en', 'es', 'kk', 'ru', 'tr', 'uz']
src_dir = 'src/i18n/locales'
pub_dir = 'public/locales'
stats = {}

for lang in locales:
    src_path = os.path.join(src_dir, lang, 'translation.json')
    pub_path = os.path.join(pub_dir, lang, 'translation.json')

    if not os.path.exists(src_path) or not os.path.exists(pub_path):
        continue

    src_data = json.load(open(src_path, 'r', encoding='utf-8'))
    pub_data = json.load(open(pub_path, 'r', encoding='utf-8'))

    if 'ui' not in src_data:
        src_data['ui'] = {}

    added_legal = 0
    added_cookie = 0

    # Sync legalpage
    pub_legal = pub_data.get('ui', {}).get('legalpage', {})
    if 'legalpage' not in src_data['ui']:
        src_data['ui']['legalpage'] = {}
    for k, v in pub_legal.items():
        if k not in src_data['ui']['legalpage']:
            src_data['ui']['legalpage'][k] = v
            added_legal += 1

    # Sync cookieconsent
    pub_cookie = pub_data.get('ui', {}).get('cookieconsent', {})
    if 'cookieconsent' not in src_data['ui']:
        src_data['ui']['cookieconsent'] = {}
    for k, v in pub_cookie.items():
        if k not in src_data['ui']['cookieconsent']:
            src_data['ui']['cookieconsent'][k] = v
            added_cookie += 1

    # Write back
    json.dump(src_data, open(src_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

    stats[lang] = {'legalpage': added_legal, 'cookieconsent': added_cookie}
    print(f'{lang}: added {added_legal} legalpage keys, {added_cookie} cookieconsent keys')

print('\nDone!')
