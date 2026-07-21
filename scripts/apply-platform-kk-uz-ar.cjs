const fs = require('fs');

/* ── Kazakh (kk) — platform sections from AI ── */
const kk = {
  nav: {
    home: "Басты бет",
    championships: "Чемпионаттар",
    events: "Оқиғалар",
    opportunities: "Мүмкіндіктер",
    participants: "Қатысушылар",
    profile: "Профиль",
    admin: "Әкімші",
    login: "Кіру"
  },
  actions: {
    logout: "Шығу",
    save: "Сақтау",
    saveDraft: "Жоба ретінде сақтау",
    submit: "Жіберу",
    markAllRead: "Барлығын оқылды деп белгілеу",
    publish: "Жариялау",
    open: "Ашу",
    favorite: "Таңдаулыға қосу",
    apply: "Өтінім беру",
    remove: "Жою"
  },
  states: {
    loading: "Жүктелуде...",
    error: "Бірдеңе дұрыс болмады. Қайтадан көріңіз.",
    empty: "Әзірге жазбалар жоқ.",
    saving: "Сақталуда...",
    saved: "Сақталды"
  },
  dashboard: {
    profile: "Профиль",
    applications: "Өтінімдер",
    favorites: "Таңдаулы",
    notifications: "Хабарламалар",
    team: "Команданы іздеу",
    settings: "Баптаулар",
    overview: "Кабинет",
    blog: "Менің мақалаларым"
  },
  fields: {
    firstName: "Аты",
    lastName: "Тегі",
    country: "Ел",
    city: "Қала",
    dateOfBirth: "Туған күні",
    schoolGrade: "Сынып",
    email: "Email",
    password: "Құпия сөз",
    passwordConfirmation: "Құпия сөзді қайталау",
    resetToken: "Қалпына келтіру токені",
    school: "Мектеп",
    ageGroup: "Жас тобы",
    portfolio: "Портфолио",
    interests: "Қызығушылықтар",
    skills: "Дағдылар",
    languages: "Тілдер",
    biography: "Өзім туралы",
    itemId: "ID",
    itemTitle: "Атауы",
    motivation: "Мотивация",
    title: "Тақырыбы",
    description: "Сипаттамасы",
    requiredSkills: "Қажетті дағдылар"
  }
};

/* ── Uzbek (uz) — platform sections from AI ── */
const uz = {
  nav: {
    home: "Bosh sahifa",
    championships: "Chempionatlar",
    events: "Tadbirlar",
    opportunities: "Imkoniyatlar",
    participants: "Ishtirokchilar",
    profile: "Profil",
    admin: "Admin",
    login: "Kirish"
  },
  actions: {
    logout: "Chiqish",
    save: "Saqlash",
    saveDraft: "Qoralama sifatida saqlash",
    submit: "Yuborish",
    markAllRead: "Hammasini o'qilgan deb belgilash",
    publish: "Nashr etish",
    open: "Ochish",
    favorite: "Saralanganlarga qo'shish",
    apply: "Ariza berish",
    remove: "O'chirish"
  },
  states: {
    loading: "Yuklanmoqda...",
    error: "Nimadir noto'g'ri ketdi. Qayta urinib ko'ring.",
    empty: "Hozircha yozuvlar yo'q.",
    saving: "Saqlanmoqda...",
    saved: "Saqlangan"
  },
  dashboard: {
    profile: "Profil",
    applications: "Arizalar",
    favorites: "Saralanganlar",
    notifications: "Bildirishnomalar",
    team: "Jamoani qidirish",
    settings: "Sozlamalar",
    overview: "Kabinet",
    blog: "Mening maqolalarim"
  },
  fields: {
    firstName: "Ism",
    lastName: "Familiya",
    country: "Davlat",
    city: "Shahar",
    dateOfBirth: "Tug'ilgan sana",
    schoolGrade: "Sinf",
    email: "Email",
    password: "Parol",
    passwordConfirmation: "Parolni takrorlash",
    resetToken: "Qayta tiklash tokeni",
    school: "Maktab",
    ageGroup: "Yosh guruhi",
    portfolio: "Portfolio",
    interests: "Qiziqishlar",
    skills: "Ko'nikmalar",
    languages: "Tillar",
    biography: "O'zim haqimda",
    itemId: "ID",
    itemTitle: "Nomi",
    motivation: "Motivatsiya",
    title: "Sarlavha",
    description: "Tavsif",
    requiredSkills: "Kerakli ko'nikmalar"
  }
};

/* ── Arabic (ar) — platform sections from AI ── */
const ar = {
  nav: {
    home: "الصفحة الرئيسية",
    championships: "البطولات",
    events: "الفعاليات",
    opportunities: "الفرص",
    participants: "المشاركون",
    profile: "الملف الشخصي",
    admin: "المشرف",
    login: "تسجيل الدخول"
  },
  actions: {
    logout: "تسجيل الخروج",
    save: "حفظ",
    saveDraft: "حفظ كمسودة",
    submit: "إرسال",
    markAllRead: "تحديد الكل كمقروء",
    publish: "نشر",
    open: "فتح",
    favorite: "إضافة إلى المفضلة",
    apply: "تقديم طلب",
    remove: "حذف"
  },
  states: {
    loading: "جارٍ التحميل...",
    error: "حدث خطأ ما. حاول مرة أخرى.",
    empty: "لا توجد سجلات حتى الآن.",
    saving: "جارٍ الحفظ...",
    saved: "تم الحفظ"
  },
  dashboard: {
    profile: "الملف الشخصي",
    applications: "الطلبات",
    favorites: "المفضلة",
    notifications: "الإشعارات",
    team: "البحث عن فريق",
    settings: "الإعدادات",
    overview: "المكتب",
    blog: "مقالاتي"
  },
  fields: {
    firstName: "الاسم الأول",
    lastName: "اسم العائلة",
    country: "الدولة",
    city: "المدينة",
    dateOfBirth: "تاريخ الميلاد",
    schoolGrade: "الصف الدراسي",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    passwordConfirmation: "تأكيد كلمة المرور",
    resetToken: "رمز إعادة التعيين",
    school: "المدرسة",
    ageGroup: "الفئة العمرية",
    portfolio: "المحفظة",
    interests: "الاهتمامات",
    skills: "المهارات",
    languages: "اللغات",
    biography: "نبذة عني",
    itemId: "المعرف",
    itemTitle: "العنوان",
    motivation: "الدافع",
    title: "العنوان",
    description: "الوصف",
    requiredSkills: "المهارات المطلوبة"
  }
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
console.log('\nDone! Applied platform section translations for kk, uz, ar.');
console.log('Applied: nav, actions, states, dashboard, fields');
