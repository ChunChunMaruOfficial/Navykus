import json, os

TRANSLATIONS = {
    'ar': {
        'API_ERROR': 'فشل الطلب',
        'INTERNAL_SERVER_ERROR': 'خطأ داخلي في الخادم',
        'AUTH_EMAIL_EXISTS': 'هذا البريد الإلكتروني مسجل بالفعل',
    },
    'de': {
        'API_ERROR': 'Anfrage fehlgeschlagen',
        'INTERNAL_SERVER_ERROR': 'Interner Serverfehler',
        'AUTH_EMAIL_EXISTS': 'Diese E-Mail ist bereits registriert',
    },
    'kk': {
        'API_ERROR': 'Сұрау орындалмады',
        'INTERNAL_SERVER_ERROR': 'Ішкі сервер қатесі',
        'AUTH_EMAIL_EXISTS': 'Бұл электрондық пошта тіркелген',
    },
    'tr': {
        'API_ERROR': 'İstek başarısız oldu',
        'INTERNAL_SERVER_ERROR': 'Sunucu hatası',
        'AUTH_EMAIL_EXISTS': 'Bu e-posta zaten kayıtlı',
    },
    'uz': {
        'API_ERROR': 'So\'rov bajarilmadi',
        'INTERNAL_SERVER_ERROR': 'Ichki server xatosi',
        'AUTH_EMAIL_EXISTS': 'Bu elektron pochta allaqachon ro\'yxatdan o\'tgan',
    },
}

for lang, msgs in TRANSLATIONS.items():
    filepath = os.path.join('src', 'i18n', 'locales', lang, 'translation.json')
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    data['platform'] = {
        'errors': {
            'API_ERROR': msgs['API_ERROR'],
            'INTERNAL_SERVER_ERROR': msgs['INTERNAL_SERVER_ERROR'],
            'AUTH_EMAIL_EXISTS': msgs['AUTH_EMAIL_EXISTS'],
        }
    }
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f'Updated {filepath}')
