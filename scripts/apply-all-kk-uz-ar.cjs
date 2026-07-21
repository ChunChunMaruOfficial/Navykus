const fs = require('fs');

/* ── Kazakh (kk) — ALL remaining platform sections ── */
const kk = {
  auth: {
    eyebrow: "Аккаунт",
    loginTitle: "Кіру",
    registerTitle: "Тіркелу",
    forgotTitle: "Құпия сөзді қалпына келтіру",
    resetTitle: "Құпия сөзді өзгерту",
    loginAction: "Кіру",
    registerAction: "Тіркелу",
    forgotAction: "Сілтемені жіберу",
    resetAction: "Құпия сөзді өзгерту",
    privacyAccepted: "Мен құпиялылық саясатымен келісемін",
    termsAccepted: "Мен шарттармен келісемін",
    forgotSuccess: "Егер email жүйеде болса, нұсқаулық жіберілді.",
    resetSuccess: "Құпия сөз өзгертілді.",
    devResetToken: "Әзірлеуге арналған токен:",
    quickLoginTitle: "Жылдам кіру",
    quickLoginAction: "Қолдану",
    quickLoginHint: "{{name}} ретінде жалғастыру. Браузер құпия сөзді ұсына алады."
  },
  roles: { user: "Пайдаланушы", moderator: "Модератор", admin: "Әкімші" },
  privacy: {
    publicProfile: "Менің көпшілікке арналған профилімді көрсету",
    teamSearchAvailable: "Команда іздеуге қолжетімді",
    showCity: "Қаланы көрсету",
    showSchool: "Мектепті көрсету",
    showAge: "Жасты көрсету",
    showEmail: "Email-ді көрсету",
    showSocialLinks: "Әлеуметтік желі сілтемелерін көрсету"
  },
  itemTypes: {
    all: "Барлығы", championship: "Чемпионат", event: "Оқиға",
    opportunity: "Мүмкіндік", participant: "Қатысушы", "team-post": "Командалық жазба"
  },
  status: {
    draft: "Жоба", submitted: "Жіберілді", under_review: "Тексерілуде",
    clarification_required: "Нақтылау қажет", approved: "Мақұлданды",
    rejected: "Қабылданбады", cancelled: "Бас тартылды", new: "Жаңа",
    confirmed: "Расталды", contacted: "Байланысылды",
    pending_review: "Модерацияны күтуде", needs_revision: "Өңдеуді қажет етеді",
    published: "Жарияланды", archived: "Мұрағатта"
  },
  notifications: {
    application_submitted: "Өтінім жіберілді",
    application_status_changed: "Өтінім мәртебесі өзгерді",
    clarification_requested: "Нақтылау сұралды",
    team_response_received: "Команда жауабы алынды",
    team_response_accepted: "Команда жауабы қабылданды",
    team_response_rejected: "Команда жауабы қабылданбады",
    team_invitation_received: "Командаға шақыру алынды",
    upcoming_deadline: "Мерзім жақындады",
    upcoming_event: "Оқиға жақындады",
    announcement: "Хабарландыру"
  },
  errors: {
    API_ERROR: "Сұраныс орындалмады",
    AUTH_REQUIRED: "Жалғастыру үшін кіріңіз",
    AUTH_INVALID_REGISTRATION: "Тіркеу өрістерін тексеріңіз",
    AUTH_AGREEMENT_REQUIRED: "Саясат пен шарттарды қабылдаңыз",
    AUTH_LOGIN_FAILED: "Email немесе құпия сөз қате",
    AUTH_CREDENTIALS_REQUIRED: "Email және құпия сөзді енгізіңіз",
    AUTH_EMAIL_REQUIRED: "Email енгізіңіз",
    AUTH_EMAIL_EXISTS: "Бұл email бұрыннан тіркелген",
    AUTH_USER_NOT_FOUND: "Пайдаланушы табылмады",
    AUTH_CODE_REQUIRED: "Email және кодты енгізіңіз",
    AUTH_CODE_INVALID: "Код қате",
    AUTH_CODE_EXPIRED: "Кодтың мерзімі өтті, жаңасын сұраңыз",
    AUTH_INVALID_RESET: "Қалпына келтіру деректері қате",
    FORBIDDEN: "Рұқсат жоқ",
    FAVORITE_INVALID: "Таңдаулы деректер қате",
    APPLICATION_STATUS_INVALID: "Өтінім мәртебесі қате",
    APPLICATION_TARGET_REQUIRED: "Өтінім нысанасын таңдаңыз",
    APPLICATION_DUPLICATE: "Сізде белсенді өтінім бар",
    PARTICIPANT_NOT_FOUND: "Қатысушы табылмады",
    TEAM_POST_INVALID: "Пост деректері қате",
    TEAM_RESPONSE_INVALID: "Команданың жауабы қате",
    TEAM_RESPONSE_DUPLICATE: "Сіз бұл постқа жауап беріп қойдыңыз",
    TEAM_RESPONSE_STATUS_INVALID: "Жауап мәртебесі қате",
    ACCOUNT_BLOCKED: "Аккаунт бұғатталған",
    EMAIL_SEND_FAILED: "Хатты жіберу мүмкін болмады",
    USER_ROLE_INVALID: "Рөл қате",
    USER_STATUS_INVALID: "Аккаунт мәртебесі қате",
    USER_SELF_BLOCK_FORBIDDEN: "Өз аккаунтыңызды бұғаттай алмайсыз",
    USER_LAST_ADMIN_FORBIDDEN: "Кемінде бір әкімші қажет",
    AVATAR_REQUIRED: "Аватар файлын таңдаңыз",
    AVATAR_INVALID: "Дұрыс суретті жүктеңіз",
    INTERNAL_SERVER_ERROR: "Серверде ішкі қате орын алды"
  },
  placeholders: { search: "Іздеу..." },
  team: { myPost: "Менің жазбам", response: "Жауап" },
  admin: {
    users: "Пайдаланушылар", applications: "Өтінімдер",
    activeChampionships: "Белсенді чемпионаттар",
    upcomingEvents: "Алдағы оқиғалар",
    publishedOpportunities: "Жарияланған мүмкіндіктер",
    teamPosts: "Команда жазбалары", role: "Рөлі",
    accountStatus: "Аккаунт мәртебесі",
    adminOnly: "Рөлдер мен аккаунт мәртебесін тек әкімшілер өзгерте алады."
  },
  accountStatus: { active: "Белсенді", pending: "Күтуде", blocked: "Бұғатталған" },
  dashboardHome: {
    eyebrow: "Жеке кеңістік",
    profileCompletion: "Профильді толтыру",
    activity: "Соңғы белсенділік",
    activeApplications: "{{count}} белсенді өтінім",
    emptyActivity: "Әзірге ешқандай белсенділік жоқ. Чемпионаттардан бастаңыз немесе мүмкіндікті сақтап қойыңыз.",
    explore: "Чемпионаттарды қарау",
    stats: { applications: "Өтінімдер", favorites: "Таңдаулылар", notifications: "Оқылмағандар", team: "Команда" },
    actions: {
      completeProfile: "Профильді толтыру",
      completeProfileText: "Дағдыларды, қызығушылықтарды, мектепті, портфолионы және көріну параметрлерін қосыңыз.",
      findOpportunity: "Мүмкіндік іздеу",
      findOpportunityText: "Оқиғаларды, мүмкіндіктер мен чемпионаттарды таңдаулыларға сақтаңыз.",
      findTeam: "Команда табу",
      findTeamText: "Қатысушыларды қарап шығыңыз және команда іздеу бағытыңызды құрастырыңыз."
    }
  },
  avatar: {
    title: "Аватар", upload: "Фото жүктеу", uploading: "Жүктелуде...",
    uploaded: "Аватар сақталды", uploadError: "Аватарды жүктеу мүмкін болмады",
    cropTitle: "Аватарды өңдеу",
    cropText: "Бетіңізді шеңбердің ортасына орналастырып, дайын нұсқасын сақтаңыз.",
    zoomIn: "Үлкейту", zoomOut: "Кішірейту", rotate: "Бұру",
    reset: "Қалпына келтіру", saveCrop: "Фотоны сақтау"
  },
  settings: {
    accountTitle: "Тіркелгі",
    accountText: "Сессиядан шығыңыз немесе тіркелгіңізді барлық деректерімен бірге жойыңыз.",
    deleteAccount: "Тіркелгіні жою",
    deleteConfirm: "Тіркелгіні жоясыз ба? Бұл әрекетті қайтара алмайсыз.",
    deleteError: "Тіркелгіні жою мүмкін болмады.",
    languageTitle: "Интерфейс тілі",
    languageText: "Сайтта және профильде қолданылатын тілді таңдаңыз."
  },
  details: { history: "Өзгерістер тарихы" }
};

/* ── Uzbek (uz) ── */
const uz = {
  auth: {
    eyebrow: "Hisob qaydnomasi",
    loginTitle: "Kirish",
    registerTitle: "Ro'yxatdan o'tish",
    forgotTitle: "Parolni tiklash",
    resetTitle: "Parolni o'zgartirish",
    loginAction: "Kirish",
    registerAction: "Ro'yxatdan o'tish",
    forgotAction: "Havolani yuborish",
    resetAction: "Parolni tiklash",
    privacyAccepted: "Men maxfiylik siyosatiga roziman",
    termsAccepted: "Men shartlarga roziman",
    forgotSuccess: "Agar email tizimda mavjud bo'lsa, ko'rsatmalar yuborildi.",
    resetSuccess: "Parol tiklandi.",
    devResetToken: "Ishlab chiqish uchun token:",
    quickLoginTitle: "Tezkor kirish",
    quickLoginAction: "Foydalanish",
    quickLoginHint: "{{name}} sifatida davom etish. Brauzer parolni taklif qilishi mumkin."
  },
  roles: { user: "Foydalanuvchi", moderator: "Moderator", admin: "Administrator" },
  privacy: {
    publicProfile: "Mening ochiq profilimni ko'rsatish",
    teamSearchAvailable: "Jamoa qidiruvi uchun mavjud",
    showCity: "Shaharni ko'rsatish",
    showSchool: "Maktabni ko'rsatish",
    showAge: "Yoshni ko'rsatish",
    showEmail: "Emailni ko'rsatish",
    showSocialLinks: "Ijtimoiy tarmoq havolalarini ko'rsatish"
  },
  itemTypes: {
    all: "Barchasi", championship: "Chempionat", event: "Tadbir",
    opportunity: "Imkoniyat", participant: "Ishtirokchi", "team-post": "Jamoa posti"
  },
  status: {
    draft: "Qoralama", submitted: "Yuborildi", under_review: "Tekshirilmoqda",
    clarification_required: "Aniqlashtirish kerak", approved: "Tasdiqlangan",
    rejected: "Rad etilgan", cancelled: "Bekor qilingan", new: "Yangi",
    confirmed: "Tasdiqlangan", contacted: "Bog'lanilgan",
    pending_review: "Moderatsiyani kutmoqda", needs_revision: "Qayta ishlash kerak",
    published: "Nashr etilgan", archived: "Arxivda"
  },
  notifications: {
    application_submitted: "Ariza yuborildi",
    application_status_changed: "Ariza holati o'zgartirildi",
    clarification_requested: "Aniqlashtirish so'raldi",
    team_response_received: "Jamoa javobi olindi",
    team_response_accepted: "Jamoa javobi qabul qilindi",
    team_response_rejected: "Jamoa javobi rad etildi",
    team_invitation_received: "Jamoaga taklif olindi",
    upcoming_deadline: "Muddat yaqinlashmoqda",
    upcoming_event: "Tadbir yaqinlashmoqda",
    announcement: "E'lon"
  },
  errors: {
    API_ERROR: "So'rov bajarilmadi",
    AUTH_REQUIRED: "Davom etish uchun kiring",
    AUTH_INVALID_REGISTRATION: "Ro'yxatdan o'tish maydonlarini tekshiring",
    AUTH_AGREEMENT_REQUIRED: "Siyosat va shartlarni qabul qiling",
    AUTH_LOGIN_FAILED: "Noto'g'ri email yoki parol",
    AUTH_CREDENTIALS_REQUIRED: "Email va parolni kiriting",
    AUTH_EMAIL_REQUIRED: "Emailni kiriting",
    AUTH_EMAIL_EXISTS: "Bu email allaqachon ro'yxatdan o'tgan",
    AUTH_USER_NOT_FOUND: "Foydalanuvchi topilmadi",
    AUTH_CODE_REQUIRED: "Email va kodni kiriting",
    AUTH_CODE_INVALID: "Noto'g'ri kod",
    AUTH_CODE_EXPIRED: "Kod muddati tugagan, yangisini so'rang",
    AUTH_INVALID_RESET: "Noto'g'ri tiklash ma'lumotlari",
    FORBIDDEN: "Ruxsat yo'q",
    FAVORITE_INVALID: "Noto'g'ri saralangan ma'lumotlari",
    APPLICATION_STATUS_INVALID: "Noto'g'ri ariza holati",
    APPLICATION_TARGET_REQUIRED: "Ariza maqsadini tanlang",
    APPLICATION_DUPLICATE: "Sizda faol ariza allaqachon mavjud",
    PARTICIPANT_NOT_FOUND: "Ishtirokchi topilmadi",
    TEAM_POST_INVALID: "Noto'g'ri post ma'lumotlari",
    TEAM_RESPONSE_INVALID: "Noto'g'ri jamoa javobi",
    TEAM_RESPONSE_DUPLICATE: "Siz bu postga allaqachon javob bergansiz",
    TEAM_RESPONSE_STATUS_INVALID: "Noto'g'ri javob holati",
    ACCOUNT_BLOCKED: "Hisob qaydnomasi bloklangan",
    EMAIL_SEND_FAILED: "Xatni yuborib bo'lmadi",
    USER_ROLE_INVALID: "Noto'g'ri rol",
    USER_STATUS_INVALID: "Noto'g'ri hisob holati",
    USER_SELF_BLOCK_FORBIDDEN: "O'z hisobingizni bloklay olmaysiz",
    USER_LAST_ADMIN_FORBIDDEN: "Kamida bitta administrator kerak",
    AVATAR_REQUIRED: "Avatar faylini tanlang",
    AVATAR_INVALID: "To'g'ri rasmni yuklang",
    INTERNAL_SERVER_ERROR: "Serverda ichki xatolik yuz berdi"
  },
  placeholders: { search: "Qidirish..." },
  team: { myPost: "Mening postim", response: "Javob" },
  admin: {
    users: "Foydalanuvchilar", applications: "Arizalar",
    activeChampionships: "Faol chempionatlar",
    upcomingEvents: "Yaqinlashayotgan tadbirlar",
    publishedOpportunities: "Nashr etilgan imkoniyatlar",
    teamPosts: "Jamoa postlari", role: "Rol",
    accountStatus: "Hisob holati",
    adminOnly: "Faqat administratorlar rol va hisob holatini o'zgartira oladi."
  },
  accountStatus: { active: "Faol", pending: "Kutilmoqda", blocked: "Bloklangan" },
  dashboardHome: {
    eyebrow: "Shaxsiy makon",
    profileCompletion: "Profilni to'ldirish",
    activity: "Oxirgi faoliyat",
    activeApplications: "{{count}} faol ariza",
    emptyActivity: "Hozircha faoliyat yo'q. Chempionatlardan boshlang yoki imkoniyatlarni saqlab qo'ying.",
    explore: "Chempionatlarni o'rganish",
    stats: { applications: "Arizalar", favorites: "Saralanganlar", notifications: "O'qilmaganlar", team: "Jamoa" },
    actions: {
      completeProfile: "Profilni to'ldirish",
      completeProfileText: "Ko'nikmalar, qiziqishlar, maktab, portfolio va ko'rinish sozlamalarini qo'shing.",
      findOpportunity: "Imkoniyat topish",
      findOpportunityText: "Tadbirlar, imkoniyatlar va chempionatlarni saralanganlarga qo'shing.",
      findTeam: "Jamoa topish",
      findTeamText: "Ishtirokchilarni ko'ring va jamoa izlash oqimingizni shakllantiring."
    }
  },
  avatar: {
    title: "Avatar", upload: "Rasm yuklash", uploading: "Yuklanmoqda...",
    uploaded: "Avatar saqlandi", uploadError: "Avatarni yuklab bo'lmadi",
    cropTitle: "Avatarni tahrirlash",
    cropText: "Yuzingizni doira ichiga joylashtiring va tayyor versiyasini saqlang.",
    zoomIn: "Kattalashtirish", zoomOut: "Kichiklashtirish",
    rotate: "Aylantirish", reset: "Tushirish", saveCrop: "Rasmni saqlash"
  },
  settings: {
    accountTitle: "Hisob qaydnomasi",
    accountText: "Sessiyadan chiqing yoki hisobingizni barcha ma'lumotlar bilan birga o'chirib tashlang.",
    deleteAccount: "Hisobni o'chirish",
    deleteConfirm: "Hisobni o'chirasizmi? Bu amalni bekor qilib bo'lmaydi.",
    deleteError: "Hisobni o'chirib bo'lmadi.",
    languageTitle: "Interfeys tili",
    languageText: "Sayt va profilda ishlatiladigan tilni tanlang."
  },
  details: { history: "O'zgartirishlar tarixi" }
};

/* ── Arabic (ar) ── */
const ar = {
  auth: {
    eyebrow: "الحساب",
    loginTitle: "تسجيل الدخول",
    registerTitle: "التسجيل",
    forgotTitle: "استعادة كلمة المرور",
    resetTitle: "إعادة تعيين كلمة المرور",
    loginAction: "تسجيل الدخول",
    registerAction: "التسجيل",
    forgotAction: "إرسال الرابط",
    resetAction: "إعادة تعيين كلمة المرور",
    privacyAccepted: "أوافق على سياسة الخصوصية",
    termsAccepted: "أوافق على الشروط والأحكام",
    forgotSuccess: "إذا كان البريد الإلكتروني موجوداً في النظام، تم إرسال التعليمات.",
    resetSuccess: "تم إعادة تعيين كلمة المرور.",
    devResetToken: "رمز إعادة التعيين للتطوير:",
    quickLoginTitle: "دخول سريع",
    quickLoginAction: "استخدام",
    quickLoginHint: "المتابعة كـ {{name}}. قد يقترح المتصفح كلمة المرور."
  },
  roles: { user: "مستخدم", moderator: "مشرف", admin: "مدير" },
  privacy: {
    publicProfile: "إظهار ملفي الشخصي العام",
    teamSearchAvailable: "متاح للبحث عن فريق",
    showCity: "إظهار المدينة",
    showSchool: "إظهار المدرسة",
    showAge: "إظهار العمر",
    showEmail: "إظهار البريد الإلكتروني",
    showSocialLinks: "إظهار روابط التواصل الاجتماعي"
  },
  itemTypes: {
    all: "الكل", championship: "البطولة", event: "الفعالية",
    opportunity: "الفرصة", participant: "المشارك", "team-post": "منشور الفريق"
  },
  status: {
    draft: "مسودة", submitted: "مُرسل", under_review: "قيد المراجعة",
    clarification_required: "بحاجة للتوضيح", approved: "مُعتمد",
    rejected: "مرفوض", cancelled: "مُلغى", new: "جديد",
    confirmed: "مؤكد", contacted: "تم التواصل",
    pending_review: "بانتظار المراجعة", needs_revision: "بحاجة للتعديل",
    published: "منشور", archived: "مؤرشف"
  },
  notifications: {
    application_submitted: "تم إرسال الطلب",
    application_status_changed: "تم تغيير حالة الطلب",
    clarification_requested: "طلب توضيح",
    team_response_received: "تم استلام رد الفريق",
    team_response_accepted: "تم قبول رد الفريق",
    team_response_rejected: "تم رفض رد الفريق",
    team_invitation_received: "تم استلام دعوة للفريق",
    upcoming_deadline: "اقتراب الموعد النهائي",
    upcoming_event: "اقتراب الفعالية",
    announcement: "إعلان"
  },
  errors: {
    API_ERROR: "فشل الطلب",
    AUTH_REQUIRED: "سجل الدخول للمتابعة",
    AUTH_INVALID_REGISTRATION: "تحقق من حقول التسجيل",
    AUTH_AGREEMENT_REQUIRED: "وافق على السياسة والشروط",
    AUTH_LOGIN_FAILED: "بريد إلكتروني أو كلمة مرور غير صحيحة",
    AUTH_CREDENTIALS_REQUIRED: "أدخل البريد الإلكتروني وكلمة المرور",
    AUTH_EMAIL_REQUIRED: "أدخل البريد الإلكتروني",
    AUTH_EMAIL_EXISTS: "هذا البريد الإلكتروني مسجل بالفعل",
    AUTH_USER_NOT_FOUND: "المستخدم غير موجود",
    AUTH_CODE_REQUIRED: "أدخل البريد الإلكتروني والرمز",
    AUTH_CODE_INVALID: "رمز غير صحيح",
    AUTH_CODE_EXPIRED: "انتهت صلاحية الرمز، اطلب رمزاً جديداً",
    AUTH_INVALID_RESET: "بيانات إعادة التعيين غير صحيحة",
    FORBIDDEN: "الوصول ممنوع",
    FAVORITE_INVALID: "بيانات المفضلة غير صحيحة",
    APPLICATION_STATUS_INVALID: "حالة الطلب غير صحيحة",
    APPLICATION_TARGET_REQUIRED: "اختر هدف الطلب",
    APPLICATION_DUPLICATE: "لديك طلب نشط بالفعل",
    PARTICIPANT_NOT_FOUND: "المشارك غير موجود",
    TEAM_POST_INVALID: "بيانات المنشور غير صحيحة",
    TEAM_RESPONSE_INVALID: "رد الفريق غير صحيح",
    TEAM_RESPONSE_DUPLICATE: "لقد أجبت على هذا المنشور بالفعل",
    TEAM_RESPONSE_STATUS_INVALID: "حالة الرد غير صحيحة",
    ACCOUNT_BLOCKED: "الحساب محظور",
    EMAIL_SEND_FAILED: "تعذر إرسال البريد الإلكتروني",
    USER_ROLE_INVALID: "دور غير صحيح",
    USER_STATUS_INVALID: "حالة الحساب غير صحيحة",
    USER_SELF_BLOCK_FORBIDDEN: "لا يمكن حظر حسابك الخاص",
    USER_LAST_ADMIN_FORBIDDEN: "يلزم وجود مشرف واحد نشط على الأقل",
    AVATAR_REQUIRED: "اختر ملف الصورة الشخصية",
    AVATAR_INVALID: "قم بتحميل صورة صحيحة",
    INTERNAL_SERVER_ERROR: "خطأ داخلي في الخادم"
  },
  placeholders: { search: "بحث..." },
  team: { myPost: "منشوري", response: "رد" },
  admin: {
    users: "المستخدمون", applications: "الطلبات",
    activeChampionships: "البطولات النشطة",
    upcomingEvents: "الفعاليات القادمة",
    publishedOpportunities: "الفرص المنشورة",
    teamPosts: "منشورات الفرق", role: "الدور",
    accountStatus: "حالة الحساب",
    adminOnly: "يمكن للمشرفين فقط تغيير الأدوار وحالة الحساب."
  },
  accountStatus: { active: "نشط", pending: "قيد الانتظار", blocked: "محظور" },
  dashboardHome: {
    eyebrow: "مساحتك الشخصية",
    profileCompletion: "اكتمال الملف الشخصي",
    activity: "آخر النشاطات",
    activeApplications: "{{count}} طلب نشط",
    emptyActivity: "لا توجد نشاطات حالياً. ابدأ بالمشاركة في البطولات أو احفظ الفرص.",
    explore: "استكشف البطولات",
    stats: { applications: "الطلبات", favorites: "المفضلة", notifications: "غير مقروءة", team: "الفريق" },
    actions: {
      completeProfile: "أكمل الملف الشخصي",
      completeProfileText: "أضف مهاراتك، اهتماماتك، مدرستك، معرض أعمالك، واضبط إعدادات الخصوصية.",
      findOpportunity: "ابحث عن فرصة",
      findOpportunityText: "احفظ الفعاليات والفرص والبطولات في مفضلتك.",
      findTeam: "ابحث عن فريق",
      findTeamText: "اطلع على المشاركين وكون فريقك الخاص للبحث."
    }
  },
  avatar: {
    title: "الصورة الشخصية", upload: "تحميل صورة", uploading: "جارٍ التحميل...",
    uploaded: "تم حفظ الصورة الشخصية",
    uploadError: "تعذر تحميل الصورة الشخصية",
    cropTitle: "تعديل الصورة",
    cropText: "ضع وجهك داخل الدائرة واحفظ النسخة النهائية.",
    zoomIn: "تكبير", zoomOut: "تصغير", rotate: "تدوير",
    reset: "إعادة تعيين", saveCrop: "حفظ الصورة"
  },
  settings: {
    accountTitle: "الحساب",
    accountText: "قم بتسجيل الخروج أو حذف الحساب مع كافة بياناته.",
    deleteAccount: "حذف الحساب",
    deleteConfirm: "هل أنت متأكد من حذف الحساب؟ لا يمكن التراجع عن هذا الإجراء.",
    deleteError: "تعذر حذف الحساب.",
    languageTitle: "لغة الواجهة",
    languageText: "اختر اللغة التي ستستخدمها في الموقع وملفك الشخصي."
  },
  details: { history: "سجل التغييرات" }
};

/* ── Apply to files ── */
function deepSet(target, source) {
  for (const [k, v] of Object.entries(source)) {
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      if (!target[k] || typeof target[k] !== 'object') target[k] = {};
      deepSet(target[k], v);
    } else {
      target[k] = v;
    }
  }
}

const apply = (lang, trans) => {
  for (const loc of ['src/i18n/locales', 'public/locales']) {
    const fp = `${loc}/${lang}/translation.json`;
    try {
      const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
      if (!data.platform) data.platform = {};
      for (const [section, content] of Object.entries(trans)) {
        if (!data.platform[section]) data.platform[section] = {};
        deepSet(data.platform[section], content);
      }
      fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`✓ ${fp}`);
    } catch (e) {
      console.error(`✗ ${fp}: ${e.message}`);
    }
  }
};

apply('kk', kk);
apply('uz', uz);
apply('ar', ar);
console.log('\nDone! ALL platform sections translated for kk, uz, ar.');
console.log('Sections: auth, roles, privacy, itemTypes, status, notifications, errors,');
console.log('placeholders, team, admin, accountStatus, dashboardHome, avatar, settings, details');
