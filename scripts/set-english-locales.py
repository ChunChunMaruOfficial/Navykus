import json, os

# English reference values from the EN locale
EN_VALUES = {
    "dbLocationTitle": "Location of Databases",
    "dbLocationText": (
        "Databases containing personal data of Navykus platform users are hosted "
        "on servers physically located on the territory of the Russian Federation. "
        "Access to databases is carried out in accordance with the requirements of "
        "Federal Law No. 152-FZ of July 27, 2006 'On Personal Data'. The hosting "
        "provider ensures technical protection of the server infrastructure, "
        "including 24/7 monitoring, backup, and restricted physical access. "
        "Database location address: Russian Federation."
    ),
    "registryInfoTitle": "Registration in the Personal Data Operators Register",
    "registryInfoText": (
        "In accordance with part 1 of Art. 22 of Federal Law No. 152-FZ of July 27, "
        "2006 'On Personal Data', the operator is obliged to notify the authorized "
        "body for the protection of the rights of personal data subjects "
        "(Roskomnadzor) of the intention to process personal data. The notification "
        "is submitted before processing begins. The details of the record in the "
        "register of operators processing personal data (registration number and "
        "date of entry in the register) will be specified after the registration "
        "procedure is completed. The operator may process personal data without "
        "notifying the authorized body only in cases provided for in part 2 of "
        "Art. 22 of Law No. 152-FZ."
    ),
}

LOCALES = ['ar', 'de', 'es', 'kk', 'tr', 'uz']
DIRS = ['public/locales', 'src/i18n/locales']

total_updated = 0

for lang in LOCALES:
    for dir_path in DIRS:
        filepath = f'{dir_path}/{lang}/translation.json'
        if not os.path.exists(filepath):
            print(f'SKIP {filepath} (file not found)')
            continue
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        legal = data.get('ui', {}).get('legalpage', {})
        updated_count = 0
        
        for key, en_value in EN_VALUES.items():
            if key in legal:
                old_val = legal[key]
                if old_val != en_value:
                    legal[key] = en_value
                    updated_count += 1
        
        if updated_count > 0:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.write('\n')
            print(f'  OK {filepath}: {updated_count} keys updated')
            total_updated += updated_count
        else:
            print(f'  -- {filepath}: already up to date')

print(f'\nDone! Total keys updated: {total_updated}')
