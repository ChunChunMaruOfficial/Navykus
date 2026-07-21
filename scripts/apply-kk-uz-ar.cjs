const fs = require('fs');

/* ── Kazakh (kk) translations ── */
const kk = {
  legalpage: {
    back: "← Басты бетке",
    backHome: "Басты бетке оралу",
    section: "Бөлім",
    lastUpdated: "Соңғы жаңартылуы: 20 шілде 2026 ж.",
    privacyEyebrow: "Құпиялылық саясаты",
    privacyTitle: "Жеке деректерді өңдеу саясаты",
    privacySubtitle: "Осы Саясат Navykus платформасы пайдаланушыларының жеке деректерін өңдеу және қорғау тәртібін айқындайды.",
    termsEyebrow: "Пайдаланушы келісімі",
    termsTitle: "Пайдаланушы келісімі",
    termsSubtitle: "Осы Келісім Navykus платформасын пайдалану ережелерін айқындайтын жария оферта болып табылады.",
    dataCollected: "Біз қандай деректерді жинаймыз",
    dataName: "Аты-жөні",
    dataEmail: "Электрондық пошта мекенжайы",
    dataAge: "Жасы / сыныбы",
    dataLocation: "Тұратын елі мен қаласы",
    dataSkills: "Дағдылар мен құзыреттер",
    dataInterests: "Қызығушылықтар мен бағыттар",
    dataLinks: "Профиль және портфолио сілтемелері",
    dataFiles: "Жоба файлдары және презентациялар",
    dataTech: "Техникалық деректер (cookie, IP-мекенжай)",
    purposesTitle: "Деректерді өңдеу мақсаттары",
    purposeRegistration: "Пайдаланушыларды тіркеу және аутентификациялау",
    purposeNotifications: "Хабарламалар жіберу",
    purposeTeam: "Топтарды іздеу және қалыптастыру",
    purposeAdmin: "Сайтты әкімшілендіру",
    legalBasisTitle: "Құқықтық негіз",
    legalBasisText: "Жеке деректерді өңдеу Қазақстан Республикасының заңнамасы негізінде және деректер субъектісінің келісімімен жүзеге асырылады.",
    thirdPartyTitle: "Деректерді үшінші тұлғаларға беру",
    thirdPartyText: "Заңда көзделген жағдайларды қоспағанда, жеке деректер үшінші тұлғаларға берілмейді.",
    storageTitle: "Деректерді сақтау және қорғау",
    storageText: "Жеке деректер ҚР аумағындағы серверлерде сақталады. Біз қажетті қорғау шараларын қолданамыз.",
    rightsTitle: "Пайдаланушылардың құқықтары",
    rightAccess: "Деректерді өңдеу туралы ақпарат алу құқығы",
    rightRectify: "Деректерді түзету құқығы",
    rightDelete: "Деректерді жою құқығы",
    rightRestrict: "Өңдеуді шектеу құқығы",
    rightPort: "Деректерді тасымалдау құқығы",
    contactsTitle: "Оператордың байланыс деректері",
    contactsEmail: "Құқықтарды іске асыру үшін сұранысты мына электрондық поштаға жіберіңіз:",
    contactsResponse: "Біз сұранысқа 30 күн ішінде жауап береміз.",
    termsGeneralTitle: "Жалпы ережелер",
    termsGeneralText: "Осы Келісім платформа мен пайдаланушы арасындағы қатынастарды реттейді.",
    termsRegistrationTitle: "Тіркелу",
    termsRegistrationText: "Тіркелу кезінде пайдаланушы шынайы ақпаратты ұсынады.",
    termsUseTitle: "Пайдалану ережелері",
    termsUseFair: "Платформаны адал ниетпен пайдалану",
    termsUseNoHarm: "Зиянды контентті таратпау",
    termsUseContent: "Тыйым салынған материалдарды жарияламау",
    termsIPTitle: "Зияткерлік меншік",
    termsIPText: "Пайдаланушы жоба файлдарына құқығын сақтап қалады.",
    termsDisclaimerTitle: "Жауапкершіліктен бас тарту",
    termsDisclaimerText: "Платформа «сол қалпында» ұсынылады.",
    termsAcceptTitle: "Шарттарды қабылдау",
    termsAcceptText: "Тіркелу Келісім шарттарын қабылдау болып табылады."
  },
  cookieconsent: {
    message: "Бұл сайт cookie файлдарын пайдаланады",
    description: "Сайттың дұрыс жұмыс істеуі мен сараптама үшін біз техникалық cookie-файлдарды қолданамыз.",
    accept: "Қабылдау",
    decline: "Бас тарту",
    close: "Жабу"
  },
  meta: {
    privacy: { title: "Құпиялылық саясаты — Навыкус", description: "Навыкус платформасының жеке деректерді өңдеу саясаты." },
    terms: { title: "Пайдаланушы келісімі — Навыкус", description: "Навыкус платформасының пайдаланушылық келісімі." }
  }
};

/* ── Uzbek (uz) translations ── */
const uz = {
  legalpage: {
    back: "← Bosh sahifaga",
    backHome: "Bosh sahifaga qaytish",
    section: "Bo'lim",
    lastUpdated: "Oxirgi yangilanish: 20-iyul, 2026-yil",
    privacyEyebrow: "Maxfiylik siyosati",
    privacyTitle: "Shaxsiy ma'lumotlarni qayta ishlash siyosati",
    privacySubtitle: "Ushbu Siyosat Navykus platformasi foydalanuvchilarining shaxsiy ma'lumotlarini qayta ishlash va himoya qilish tartibini belgilaydi.",
    termsEyebrow: "Foydalanuvchi kelishuvi",
    termsTitle: "Foydalanuvchi kelishuvi",
    termsSubtitle: "Ushbu Kelishuv Navykus platformasidan foydalanish qoidalarini belgilovchi ommaviy oferta hisoblanadi.",
    dataCollected: "Qanday ma'lumotlarni yig'amiz",
    dataName: "Ism va familiya",
    dataEmail: "Elektron pochta manzili",
    dataAge: "Yosh / sinf",
    dataLocation: "Yashash mamlakati va shahri",
    dataSkills: "Ko'nikmalar va kompetensiyalar",
    dataInterests: "Qiziqishlar va yo'nalishlar",
    dataLinks: "Profillar va portfolioga havolalar",
    dataFiles: "Loyiha fayllari va taqdimotlar",
    dataTech: "Texnik ma'lumotlar (cookie, IP-manzil)",
    purposesTitle: "Ma'lumotlarni qayta ishlash maqsadlari",
    purposeRegistration: "Foydalanuvchilarni ro'yxatdan o'tkazish va autentifikatsiya qilish",
    purposeNotifications: "Bildirishnomalar yuborish",
    purposeTeam: "Jamoalarni izlash va shakllantirish",
    purposeAdmin: "Saytni boshqarish",
    legalBasisTitle: "Huquqiy asos",
    legalBasisText: "Shaxsiy ma'lumotlarni qayta ishlash qonunchilik asosida va ma'lumotlar subyektining roziligi bilan amalga oshiriladi.",
    thirdPartyTitle: "Ma'lumotlarni uchinchi shaxslarga uzatish",
    thirdPartyText: "Shaxsiy ma'lumotlar qonunda nazarda tutilgan hollar bundan mustasno, uchinchi shaxslarga uzatilmaydi.",
    storageTitle: "Ma'lumotlarni saqlash va himoya qilish",
    storageText: "Shaxsiy ma'lumotlar hududdagi serverlarda saqlanadi. Biz zarur himoya choralarini ko'ramiz.",
    rightsTitle: "Foydalanuvchilarning huquqlari",
    rightAccess: "Ma'lumotlarni qayta ishlash to'g'risida axborot olish huquqi",
    rightRectify: "Ma'lumotlarni tuzatish huquqi",
    rightDelete: "Ma'lumotlarni o'chirish huquqi",
    rightRestrict: "Qayta ishlashni cheklash huquqi",
    rightPort: "Ma'lumotlarning ko'chirilishi (portativligi) huquqi",
    contactsTitle: "Operator bilan aloqa",
    contactsEmail: "Huquqlaringizni amalga oshirish uchun ushbu emailga so'rov yuboring:",
    contactsResponse: "So'rovga 30 kun ichida javob beramiz.",
    termsGeneralTitle: "Umumiy qoidalar",
    termsGeneralText: "Ushbu Kelishuv platforma va foydalanuvchi o'rtasidagi munosabatlarni tartibga soladi.",
    termsRegistrationTitle: "Ro'yxatdan o'tish",
    termsRegistrationText: "Ro'yxatdan o'tishda foydalanuvchi ishonchli ma'lumotlarni taqdim etishi kerak.",
    termsUseTitle: "Foydalanish qoidalari",
    termsUseFair: "Platformadan vijdonan foydalanish",
    termsUseNoHarm: "Zararli kontent tarqatmaslik",
    termsUseContent: "Taqiqlangan materiallarni nashr etmaslik",
    termsIPTitle: "Intellektual mulk",
    termsIPText: "Foydalanuvchi loyiha fayllariga bo'lgan huquqlarini saqlab qoladi.",
    termsDisclaimerTitle: "Javobgarlikdan voz kechish",
    termsDisclaimerText: "Platforma xuddi shu holatda (as is) taqdim etiladi.",
    termsAcceptTitle: "Shartlarni qabul qilish",
    termsAcceptText: "Ro'yxatdan o'tish Kelishuv shartlarini qabul qilish hisoblanadi."
  },
  cookieconsent: {
    message: "Ushbu sayt cookie-fayllardan foydalanadi",
    description: "Saytning to'g'ri ishlashi va tahliliy ma'lumotlar uchun texnik cookie-fayllardan foydalanamiz.",
    accept: "Qabul qilish",
    decline: "Rad etish",
    close: "Yopish"
  },
  meta: {
    privacy: { title: "Maxfiylik siyosati — Navykus", description: "Navykus platformasining shaxsiy ma'lumotlarni qayta ishlash siyosati." },
    terms: { title: "Foydalanuvchi kelishuvi — Navykus", description: "Navykus platformasining foydalanuvchi kelishuvi." }
  }
};

/* ── Arabic (ar) translations ── */
const ar = {
  legalpage: {
    back: "← إلى الصفحة الرئيسية",
    backHome: "العودة إلى الصفحة الرئيسية",
    section: "القسم",
    lastUpdated: "آخر تحديث: 20 يوليو 2026",
    privacyEyebrow: "سياسة الخصوصية",
    privacyTitle: "سياسة معالجة البيانات الشخصية",
    privacySubtitle: "تحدد هذه السياسة إجراءات معالجة وحماية البيانات الشخصية لمستخدمي منصة Navykus.",
    termsEyebrow: "اتفاقية المستخدم",
    termsTitle: "اتفاقية المستخدم",
    termsSubtitle: "تعتبر هذه الاتفاقية عرضاً عاماً يحدد قواعد استخدام منصة Navykus.",
    dataCollected: "البيانات التي نجمعها",
    dataName: "الاسم الكامل",
    dataEmail: "عنوان البريد الإلكتروني",
    dataAge: "العمر / الصف الدراسي",
    dataLocation: "الدولة ومدينة الإقامة",
    dataSkills: "المهارات والكفاءات",
    dataInterests: "الاهتمامات والمجالات",
    dataLinks: "روابط الملفات الشخصية والأعمال السابقة",
    dataFiles: "ملفات المشاريع والعروض التقديمية",
    dataTech: "البيانات التقنية (ملفات تعريف الارتباط، عنوان IP)",
    purposesTitle: "أغراض معالجة البيانات",
    purposeRegistration: "تسجيل المستخدمين والمصادقة على هويتهم",
    purposeNotifications: "إرسال الإشعارات",
    purposeTeam: "البحث عن فرق وتكوينها",
    purposeAdmin: "إدارة الموقع",
    legalBasisTitle: "الأساس القانوني",
    legalBasisText: "تتم معالجة البيانات الشخصية بناءً على التشريعات وبموافقة صاحب البيانات.",
    thirdPartyTitle: "مشاركة البيانات مع أطراف خارجية",
    thirdPartyText: "لا يتم نقل البيانات الشخصية إلى أطراف خارجية، باستثناء الحالات التي ينص عليها القانون.",
    storageTitle: "تخزين البيانات وحمايتها",
    storageText: "يتم تخزين البيانات الشخصية على خوادم محلية. نحن نتخذ تدابير الحماية اللازمة.",
    rightsTitle: "حقوق المستخدمين",
    rightAccess: "الحق في الحصول على معلومات حول معالجة البيانات",
    rightRectify: "الحق في تصحيح البيانات",
    rightDelete: "الحق في مسح البيانات",
    rightRestrict: "الحق في تقييد المعالجة",
    rightPort: "الحق في نقل البيانات",
    contactsTitle: "بيانات التواصل مع المشغل",
    contactsEmail: "لممارسة حقوقك، يرجى إرسال طلب عبر البريد الإلكتروني:",
    contactsResponse: "سنرد على الطلب في غضون 30 يوماً.",
    termsGeneralTitle: "أحكام عامة",
    termsGeneralText: "تنظم هذه الاتفاقية العلاقة بين المنصة والمستخدم.",
    termsRegistrationTitle: "التسجيل",
    termsRegistrationText: "عند التسجيل، يقدم المستخدم معلومات دقيقة وصحيحة.",
    termsUseTitle: "قواعد الاستخدام",
    termsUseFair: "استخدام المنصة بنزاهة",
    termsUseNoHarm: "عدم نشر محتوى ضار",
    termsUseContent: "عدم نشر مواد محظورة",
    termsIPTitle: "الملكية الفكرية",
    termsIPText: "يحتفظ المستخدم بحقوق ملكية ملفات المشاريع الخاصة به.",
    termsDisclaimerTitle: "إخلاء المسؤولية",
    termsDisclaimerText: "يتم تقديم المنصة كما هي.",
    termsAcceptTitle: "قبول الشروط",
    termsAcceptText: "يعتبر التسجيل موافقة على شروط هذه الاتفاقية."
  },
  cookieconsent: {
    message: "يستخدم هذا الموقع ملفات تعريف الارتباط",
    description: "نحن نستخدم ملفات تعريف الارتباط التقنية لضمان عمل الموقع بشكل صحيح ولأغراض التحليل.",
    accept: "قبول",
    decline: "رفض",
    close: "إغلاق"
  },
  meta: {
    privacy: { title: "سياسة الخصوصية — Navykus", description: "سياسة معالجة البيانات الشخصية لمنصة Navykus." },
    terms: { title: "اتفاقية المستخدم — Navykus", description: "اتفاقية المستخدم الخاصة بمنصة Navykus." }
  }
};

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

const applyTranslation = (lang, trans) => {
  for (const loc of ['src/i18n/locales', 'public/locales']) {
    const filePath = `${loc}/${lang}/translation.json`;
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (trans.meta && data.meta) {
        deepSet(data.meta, trans.meta);
      }
      if (trans.legalpage && data.ui) {
        if (!data.ui.legalpage) data.ui.legalpage = {};
        deepSet(data.ui.legalpage, trans.legalpage);
      }
      if (trans.cookieconsent && data.ui) {
        if (!data.ui.cookieconsent) data.ui.cookieconsent = {};
        deepSet(data.ui.cookieconsent, trans.cookieconsent);
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`Applied translations to ${filePath}`);
    } catch (e) {
      console.error(`Error with ${filePath}: ${e.message}`);
    }
  }
};

applyTranslation('kk', kk);
applyTranslation('uz', uz);
applyTranslation('ar', ar);

console.log('\nDone! Applied proper translations for kk, uz, ar.');
