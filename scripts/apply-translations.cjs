const fs = require('fs');

/* ── German translations ── */
const de = {
  legalpage: {
    back: "← Zur Startseite",
    backHome: "Zurück zur Startseite",
    section: "Abschnitt",
    lastUpdated: "Letzte Aktualisierung: 20. Juli 2026",
    privacyEyebrow: "Datenschutzrichtlinie",
    privacyTitle: "Richtlinie zur Verarbeitung personenbezogener Daten",
    privacySubtitle: "Diese Richtlinie legt das Verfahren für die Verarbeitung und den Schutz der personenbezogenen Daten von Nutzern der Plattform Navykus fest.",
    termsEyebrow: "Nutzungsbedingungen",
    termsTitle: "Nutzungsbedingungen",
    termsSubtitle: "Diese Vereinbarung stellt ein öffentliches Angebot dar, das die Regeln für die Nutzung der Plattform Navykus festlegt.",
    dataCollected: "Welche Daten wir erheben",
    dataName: "Vor- und Nachname",
    dataEmail: "E-Mail-Adresse",
    dataAge: "Alter / Klassenstufe",
    dataLocation: "Wohnsitzland und Stadt",
    dataSkills: "Fähigkeiten und Kompetenzen",
    dataInterests: "Interessen und Fachgebiete",
    dataLinks: "Links zu Profilen und Portfolios",
    dataFiles: "Projektdateien und Präsentationen",
    dataTech: "Technische Daten (Cookies, IP-Adresse)",
    purposesTitle: "Zwecke der Datenverarbeitung",
    purposeRegistration: "Registrierung und Authentifizierung von Nutzern auf der Plattform",
    purposeNotifications: "Versand von Benachrichtigungen über Veranstaltungen, Wettbewerbe und Möglichkeiten",
    purposeTeam: "Suche und Bildung von Teams für Projekte",
    purposeAdmin: "Verwaltung und technischer Support der Website",
    legalBasisTitle: "Rechtsgrundlage der Verarbeitung",
    legalBasisText: "Die Verarbeitung personenbezogener Daten erfolgt auf Grundlage von Art. 24 der Verfassung der Russischen Föderation und Art. 6 des Bundesgesetzes Nr. 152-FZ mit Zustimmung des Betroffenen.",
    thirdPartyTitle: "Weitergabe von Daten an Dritte",
    thirdPartyText: "Personenbezogene Daten der Nutzer werden nicht an Dritte weitergegeben, außer in gesetzlich vorgeschriebenen Fällen oder zur Gewährleistung des Dienstbetriebs.",
    storageTitle: "Speicherung und Schutz der Daten",
    storageText: "Personenbezogene Daten werden auf Servern auf dem Gebiet der Russischen Föderation gespeichert. Wir ergreifen notwendige Maßnahmen zum Schutz der Daten.",
    rightsTitle: "Rechte der Nutzer",
    rightAccess: "Recht auf Auskunft über die Verarbeitung Ihrer Daten",
    rightRectify: "Recht auf Berichtigung der Daten",
    rightDelete: "Recht auf Löschung der Daten (Recht auf Vergessenwerden)",
    rightRestrict: "Recht auf Einschränkung der Datenverarbeitung",
    rightPort: "Recht auf Datenübertragbarkeit",
    contactsTitle: "Kontaktdaten des Betreibers",
    contactsEmail: "Um Ihre Rechte auszuüben, senden Sie eine Anfrage an die E-Mail-Adresse:",
    contactsResponse: "Wir verpflichten uns, Ihre Anfrage innerhalb von 30 Tagen zu beantworten.",
    termsGeneralTitle: "Allgemeine Bestimmungen",
    termsGeneralText: "Diese Nutzungsbedingungen regeln das Verhältnis zwischen der Plattform Navykus und dem Nutzer hinsichtlich der Nutzung der Dienste der Plattform.",
    termsRegistrationTitle: "Registrierung und Benutzerkonto",
    termsRegistrationText: "Bei der Registrierung verpflichtet sich der Nutzer, wahrheitsgemäße Angaben zu machen. Der Nutzer bestätigt, das Alter von 10 Jahren erreicht zu haben.",
    termsUseTitle: "Nutzungsregeln",
    termsUseFair: "Die Plattform nach Treu und Glauben nutzen, ohne Rechte Dritter zu verletzen",
    termsUseNoHarm: "Keine schädlichen Inhalte, Spam oder falsche Informationen verbreiten",
    termsUseContent: "Keine Materialien veröffentlichen, die gegen die Gesetzgebung der Russischen Föderation verstoßen",
    termsIPTitle: "Geistiges Eigentum",
    termsIPText: "Der Nutzer behält alle Rechte an den hochgeladenen Projektdateien.",
    termsDisclaimerTitle: "Haftungsausschluss",
    termsDisclaimerText: "Die Plattform wird wie besehen (as is) zur Verfügung gestellt.",
    termsAcceptTitle: "Annahme der Bedingungen",
    termsAcceptText: "Die Registrierung auf der Plattform stellt die vollständige und vorbehaltlose Annahme der Bedingungen dieser Nutzungsbedingungen dar."
  },
  cookieconsent: {
    message: "Diese Website verwendet Cookies",
    description: "Für das ordnungsgemäße Funktionieren der Website und zu Analysezwecken verwenden wir technische Cookies.",
    accept: "Akzeptieren",
    decline: "Ablehnen",
    close: "Schließen"
  },
  meta: {
    privacy: { title: "Datenschutzrichtlinie — Navykus", description: "Richtlinie zur Verarbeitung personenbezogener Daten der Plattform Navykus." },
    terms: { title: "Nutzungsbedingungen — Navykus", description: "Nutzungsbedingungen der Plattform Navykus." }
  }
};

/* ── Spanish translations ── */
const es = {
  legalpage: {
    back: "← Volver al inicio",
    backHome: "Volver a la página principal",
    section: "Sección",
    lastUpdated: "Última actualización: 20 de julio de 2026",
    privacyEyebrow: "Política de Privacidad",
    privacyTitle: "Política de procesamiento de datos personales",
    privacySubtitle: "Esta Política define el procedimiento para el procesamiento y protección de los datos personales de los usuarios de la plataforma Navykus.",
    termsEyebrow: "Términos de Servicio",
    termsTitle: "Términos de servicio",
    termsSubtitle: "Este Acuerdo constituye una oferta pública que establece las reglas para el uso de la plataforma Navykus.",
    dataCollected: "Qué datos recopilamos",
    dataName: "Nombre y apellidos",
    dataEmail: "Dirección de correo electrónico",
    dataAge: "Edad / grado escolar",
    dataLocation: "País y ciudad de residencia",
    dataSkills: "Habilidades y competencias",
    dataInterests: "Intereses y áreas de enfoque",
    dataLinks: "Enlaces a perfiles y portafolio",
    dataFiles: "Archivos de proyectos y presentaciones",
    dataTech: "Datos técnicos (cookies, dirección IP)",
    purposesTitle: "Fines del procesamiento de datos",
    purposeRegistration: "Registro y autenticación de usuarios en la plataforma",
    purposeNotifications: "Envío de notificaciones sobre eventos, campeonatos y oportunidades",
    purposeTeam: "Búsqueda y formación de equipos para proyectos",
    purposeAdmin: "Administración y soporte técnico del sitio",
    legalBasisTitle: "Base legal para el procesamiento",
    legalBasisText: "El procesamiento de datos personales se lleva a cabo según el Art. 24 de la Constitución de la Federación Rusa y el Art. 6 de la Ley Federal N.º 152-FZ con el consentimiento del sujeto de los datos.",
    thirdPartyTitle: "Transferencia de datos a terceros",
    thirdPartyText: "Los datos personales de los usuarios no se transfieren a terceros, excepto en los casos previstos por la legislación de la Federación Rusa.",
    storageTitle: "Almacenamiento y protección de datos",
    storageText: "Los datos personales se almacenan en servidores ubicados en el territorio de la Federación Rusa. Adoptamos las medidas necesarias para proteger los datos personales.",
    rightsTitle: "Derechos de los usuarios",
    rightAccess: "Derecho a obtener información sobre el procesamiento de sus datos",
    rightRectify: "Derecho a la rectificación (corrección) de los datos",
    rightDelete: "Derecho a la supresión de datos (derecho al olvido)",
    rightRestrict: "Derecho a la limitación del procesamiento de datos",
    rightPort: "Derecho a la portabilidad de los datos",
    contactsTitle: "Contactos del operador",
    contactsEmail: "Para ejercer sus derechos o solicitar aclaraciones, envíe una consulta al correo electrónico:",
    contactsResponse: "Nos comprometemos a responder a su solicitud en un plazo de 30 días.",
    termsGeneralTitle: "Disposiciones generales",
    termsGeneralText: "Estos Términos de servicio regulan la relación entre la plataforma Navykus y el usuario.",
    termsRegistrationTitle: "Registro y cuenta de usuario",
    termsRegistrationText: "Al registrarse, el Usuario se compromete a proporcionar información veraz. El usuario confirma que tiene al menos 10 años de edad.",
    termsUseTitle: "Reglas de uso",
    termsUseFair: "Usar la Plataforma de buena fe, sin infringir los derechos de terceros",
    termsUseNoHarm: "No difundir contenido malicioso, spam o información falsa",
    termsUseContent: "No publicar materiales que contravengan la legislación de la Federación Rusa",
    termsIPTitle: "Propiedad intelectual",
    termsIPText: "El usuario conserva todos los derechos sobre los archivos de proyectos subidos.",
    termsDisclaimerTitle: "Exención de responsabilidad",
    termsDisclaimerText: "La plataforma se proporciona tal cual (as is).",
    termsAcceptTitle: "Aceptación de las condiciones",
    termsAcceptText: "El registro en la Plataforma constituye una aceptación plena e incondicional de los términos de este Acuerdo de Usuario."
  },
  cookieconsent: {
    message: "Este sitio utiliza cookies",
    description: "Utilizamos cookies técnicas para el correcto funcionamiento del sitio y para fines analíticos.",
    accept: "Aceptar",
    decline: "Rechazar",
    close: "Cerrar"
  },
  meta: {
    privacy: { title: "Política de Privacidad — Navykus", description: "Política de procesamiento de datos personales de la plataforma Navykus." },
    terms: { title: "Términos de Servicio — Navykus", description: "Términos de servicio de la plataforma Navykus." }
  }
};

/* ── Turkish translations ── */
const tr = {
  legalpage: {
    back: "← Ana sayfaya dön",
    backHome: "Ana sayfaya dön",
    section: "Bölüm",
    lastUpdated: "Son güncelleme: 20 Temmuz 2026",
    privacyEyebrow: "Gizlilik Politikası",
    privacyTitle: "Kişisel Verilerin İşlenmesi Politikası",
    privacySubtitle: "İşbu Politika, Navykus platformu kullanıcılarının kişisel verilerinin işlenme ve korunma esaslarını belirler.",
    termsEyebrow: "Kullanıcı Sözleşmesi",
    termsTitle: "Kullanıcı Sözleşmesi",
    termsSubtitle: "İşbu Sözleşme, Navykus platformunun kullanım kurallarını belirleyen halka açık bir tekliftir.",
    dataCollected: "Topladığımız veriler",
    dataName: "Ad ve soyadı",
    dataEmail: "E-posta adresi",
    dataAge: "Yaş / sınıf",
    dataLocation: "İkamet edilen ülke ve şehir",
    dataSkills: "Yetenekler ve yetkinlikler",
    dataInterests: "İlgi alanları ve yönelimler",
    dataLinks: "Profil ve portföy bağlantıları",
    dataFiles: "Proje dosyaları ve sunumlar",
    dataTech: "Teknik veriler (çerezler, IP adresi)",
    purposesTitle: "Veri işleme amaçları",
    purposeRegistration: "Kullanıcı kaydı ve kimlik doğrulama",
    purposeNotifications: "Etkinlikler ve yarışmalar hakkında bildirim gönderimi",
    purposeTeam: "Ekip arama ve oluşturma",
    purposeAdmin: "Site yönetimi ve teknik destek",
    legalBasisTitle: "Veri işlemenin yasal dayanağı",
    legalBasisText: "Veri işleme, yürürlükteki mevzuat ve veri sahibinin izni doğrultusunda gerçekleştirilir.",
    thirdPartyTitle: "Üçüncü taraflara veri aktarımı",
    thirdPartyText: "Yasaların öngördüğü durumlar dışında veriler üçüncü taraflarla paylaşılmaz.",
    storageTitle: "Verilerin saklanması ve korunması",
    storageText: "Veriler güvenli sunucularda saklanır. Gerekli tüm koruma önlemlerini alıyoruz.",
    rightsTitle: "Kullanıcı hakları",
    rightAccess: "Veri işleme hakkında bilgi alma hakkı",
    rightRectify: "Verileri düzeltme hakkı",
    rightDelete: "Verileri silme hakkı",
    rightRestrict: "İşlemeyi kısıtlama hakkı",
    rightPort: "Veri taşınabilirliği hakkı",
    contactsTitle: "Operatör iletişim bilgileri",
    contactsEmail: "Haklarınızı kullanmak için şu e-posta adresine talep gönderin:",
    contactsResponse: "Talebinize 30 gün içinde yanıt vereceğiz.",
    termsGeneralTitle: "Genel hükümler",
    termsGeneralText: "Bu Sözleşme, platform ile kullanıcı arasındaki ilişkileri düzenler.",
    termsRegistrationTitle: "Kayıt",
    termsRegistrationText: "Kullanıcı kaydolurken doğru bilgiler vermeyi ve en az 10 yaşında olduğunu onaylar.",
    termsUseTitle: "Kullanım kuralları",
    termsUseFair: "Platformu iyi niyetle kullanmak",
    termsUseNoHarm: "Zararlı içerik yaymamak",
    termsUseContent: "Yasaklı içerik yayınlamamak",
    termsIPTitle: "Fikri mülkiyet",
    termsIPText: "Kullanıcı, yüklenen proje dosyaları üzerindeki haklarını saklı tutar.",
    termsDisclaimerTitle: "Sorumluluk reddi",
    termsDisclaimerText: "Platform olduğu gibi sunulmaktadır.",
    termsAcceptTitle: "Şartların kabulü",
    termsAcceptText: "Kaydolmak, Sözleşme şartlarının tamamen kabul edildiği anlamına gelir."
  },
  cookieconsent: {
    message: "Bu web sitesi çerezleri kullanır",
    description: "Web sitesinin düzgün çalışması ve analitik için teknik çerezler kullanıyoruz.",
    accept: "Kabul Et",
    decline: "Reddet",
    close: "Kapat"
  },
  meta: {
    privacy: { title: "Gizlilik Politikası — Navykus", description: "Navykus platformu kişisel verilerin işlenmesi politikası." },
    terms: { title: "Kullanıcı Sözleşmesi — Navykus", description: "Navykus platformu kullanıcı sözleşmesi." }
  }
};

/* Deep merge function */
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

/* Apply to files */
const applyTranslation = (lang, trans) => {
  for (const loc of ['src/i18n/locales', 'public/locales']) {
    const filePath = `${loc}/${lang}/translation.json`;
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (trans.meta && data.meta) {
        if (trans.meta.privacy) deepSet(data.meta, trans.meta);
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

applyTranslation('de', de);
applyTranslation('es', es);
applyTranslation('tr', tr);

console.log('\nDone! Applied proper translations for de, es, tr.');
