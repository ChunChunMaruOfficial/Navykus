import json, os, glob

locales_dir = [r'D:\Navykus\public\locales', r'D:\Navykus\src\i18n\locales']

error_order = [
    'API_ERROR', 'AUTH_REQUIRED', 'AUTH_RATE_LIMIT', 'AUTH_INVALID_REGISTRATION',
    'AUTH_AGREEMENT_REQUIRED', 'AUTH_LOGIN_FAILED', 'AUTH_CREDENTIALS_REQUIRED',
    'AUTH_EMAIL_REQUIRED', 'AUTH_EMAIL_EXISTS', 'AUTH_INVALID_RESET', 'FORBIDDEN',
    'FAVORITE_INVALID', 'APPLICATION_STATUS_INVALID', 'APPLICATION_DUPLICATE',
    'APPLICATION_TARGET_REQUIRED', 'TEAM_POST_INVALID', 'TEAM_RESPONSE_INVALID',
    'TEAM_RESPONSE_DUPLICATE', 'TEAM_RESPONSE_STATUS_INVALID', 'ACCOUNT_BLOCKED',
    'USER_ROLE_INVALID', 'USER_STATUS_INVALID', 'USER_SELF_BLOCK_FORBIDDEN',
    'USER_LAST_ADMIN_FORBIDDEN', 'AVATAR_REQUIRED', 'AVATAR_INVALID',
    'INTERNAL_SERVER_ERROR',
]

new_translations = {
    'en': {
        'AUTH_RATE_LIMIT': 'Too many requests. Please try again later.',
    },
    'ru': {
        'AUTH_RATE_LIMIT': 'Слишком много запросов. Попробуйте позже.',
    },
    'de': {
        'AUTH_REQUIRED': 'Anmelden um fortzufahren',
        'AUTH_RATE_LIMIT': 'Zu viele Anfragen. Versuchen Sie es später.',
        'ACCOUNT_BLOCKED': 'Konto ist gesperrt',
    },
    'kk': {
        'AUTH_REQUIRED': 'Жалғастыру үшін кіріңіз',
        'AUTH_RATE_LIMIT': 'Тым көп сұрау. Кейінірек қайталаңыз.',
        'ACCOUNT_BLOCKED': 'Аккаунт бұғатталды',
    },
    'tr': {
        'AUTH_REQUIRED': 'Devam etmek için giriş yapın',
        'AUTH_RATE_LIMIT': 'Çok fazla istek. Daha sonra tekrar deneyin.',
        'ACCOUNT_BLOCKED': 'Hesap bloke edildi',
    },
    'uz': {
        'AUTH_REQUIRED': 'Davom etish uchun kiring',
        'AUTH_RATE_LIMIT': 'Juda ko\'p so\'rov. Keyinroq urinib ko\'ring.',
        'ACCOUNT_BLOCKED': 'Akkaunt bloklangan',
    },
    'ar': {
        'AUTH_REQUIRED': 'سجل الدخول للمتابعة',
        'AUTH_RATE_LIMIT': 'عدد كبير جداً من الطلبات. حاول مرة أخرى لاحقاً.',
        'ACCOUNT_BLOCKED': 'الحساب محظور',
    },
    'es': {
        'AUTH_RATE_LIMIT': 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.',
    },
}

for base_dir in locales_dir:
    for lang, trans in new_translations.items():
        filepath = os.path.join(base_dir, lang, 'translation.json')
        if not os.path.exists(filepath):
            print(f"  {filepath}: not found, skipping")
            continue

        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        if 'platform' not in data or 'errors' not in data['platform']:
            print(f"  {filepath}: no platform.errors section")
            continue

        errors = data['platform']['errors']

        for key, value in trans.items():
            if key not in errors:
                errors[key] = value
                print(f"  Added {key}: {value}")

        # Reorder errors to match canonical order
        ordered = {}
        for key in error_order:
            if key in errors:
                ordered[key] = errors[key]
        # Add any extra keys not in our order
        for key in errors:
            if key not in ordered:
                ordered[key] = errors[key]
        data['platform']['errors'] = ordered

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"  {filepath}: updated and reordered ✓")

print("Done!")
