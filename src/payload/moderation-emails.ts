import type { Payload } from 'payload';

import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n/languages';

// The moderation mailbox. Every notification letter is sent on behalf of this
// address so applicants can reply directly to the moderation team.
export const MODERATION_FROM_EMAIL = 'info@navykus.tech';

export const SITE_ORIGIN = (
  process.env.PUBLIC_SITE_URL
  || process.env.SITE_URL
  || process.env.SERVER_URL
  || 'https://navykus.tech'
).replace(/\/+$/, '');

type Decision = 'approved' | 'rejected';

type EmailLocalization = {
  subject: (decision: Decision) => string;
  greeting: (name: string) => string;
  body: (decision: Decision) => string;
  reasonLabel: string;
  reasonFallback: string;
  nextSteps: (decision: Decision) => string;
  signature: string;
  footer: string;
};

const L: Record<SupportedLanguage, EmailLocalization> = {
  ru: {
    subject: (decision) => decision === 'approved'
      ? 'Ваша анкета опубликована на Navykus'
      : 'Ваша анкета на Navykus не прошла модерацию',
    greeting: (name) => `Здравствуйте, ${name}!`,
    body: (decision) => decision === 'approved'
      ? 'Ваша анкета участника прошла проверку и уже опубликована в разделе «Найти команду». Другие участники могут найти вас и связаться по указанному в анкете контакту.'
      : 'К сожалению, ваша анкета участника не прошла модерацию и не будет опубликована в разделе «Найти команду».',
    reasonLabel: 'Причина отказа:',
    reasonFallback: 'Анкета не соответствует правилам сообщества.',
    nextSteps: (decision) => decision === 'approved'
      ? 'Посмотреть публикацию можно на странице поиска команды.'
      : 'Вы можете исправить анкету с учётом причины отказа и отправить её повторно в любое время.',
    signature: 'С уважением,\nкоманда модерации Navykus',
    footer: 'Это автоматическое уведомление по вашей анкете участника Navykus.',
  },
  en: {
    subject: (decision) => decision === 'approved'
      ? 'Your Navykus questionnaire has been published'
      : 'Your Navykus questionnaire was not approved',
    greeting: (name) => `Hello, ${name}!`,
    body: (decision) => decision === 'approved'
      ? 'Your participant questionnaire has been reviewed and is now published in the “Find a team” section. Other participants can find you and reach out via the contact details you provided.'
      : 'Unfortunately, your participant questionnaire did not pass moderation and will not be published in the “Find a team” section.',
    reasonLabel: 'Reason for rejection:',
    reasonFallback: 'The questionnaire does not follow community guidelines.',
    nextSteps: (decision) => decision === 'approved'
      ? 'You can view the publication on the team search page.'
      : 'You can update the questionnaire taking the reason above into account and resubmit it at any time.',
    signature: 'Best regards,\nthe Navykus moderation team',
    footer: 'This is an automatic notification about your Navykus participant questionnaire.',
  },
  kk: {
    subject: (decision) => decision === 'approved'
      ? 'Сіздің сауалнамаңыз Navykus сайтында жарияланды'
      : 'Сіздің сауалнамаңыз Navykus модерациясынан өтпеді',
    greeting: (name) => `Сәлеметсіз бе, ${name}!`,
    body: (decision) => decision === 'approved'
      ? 'Сіздің қатысушы сауалнамаңыз тексерілді және «Команда табу» бөлімінде жарияланды. Басқа қатысушылар сізді тауып, сауалнамада көрсетілген байланыс арқылы жаза алады.'
      : 'Өкінішке орай, сіздің қатысушы сауалнамаңыз модерациядан өтпеді және «Команда табу» бөлімінде жарияланбайды.',
    reasonLabel: 'Қабылдамау себебі:',
    reasonFallback: 'Сауалнама қоғамдастық ережелеріне сай емес.',
    nextSteps: (decision) => decision === 'approved'
      ? 'Жарияланымды команда іздеу бетінен көруге болады.'
      : 'Сауалнаманы себепті ескеріп түзетіп, кез келген уақытта қайта жібере аласыз.',
    signature: 'Құрметпен,\nNavykus модерация тобы',
    footer: 'Бұл Navykus қатысушы сауалнамаңыз туралы автоматты хабарлама.',
  },
  uz: {
    subject: (decision) => decision === 'approved'
      ? 'Anketaingiz Navykus saytida e’lon qilindi'
      : 'Anketaingiz Navykus moderatsiyadan o‘tmadi',
    greeting: (name) => `Assalomu alaykum, ${name}!`,
    body: (decision) => decision === 'approved'
      ? 'Ishtirokchi anketaingiz tekshirildi va «Jamoa topish» bo‘limida e’lon qilindi. Boshqa ishtirokchilar sizni topib, anketada ko‘rsatilgan aloqa orqali yozishi mumkin.'
      : 'Afsuski, ishtirokchi anketaingiz moderatsiyadan o‘tmadi va «Jamoa topish» bo‘limida e’lon qilinmaydi.',
    reasonLabel: 'Rad etish sababi:',
    reasonFallback: 'Anketa jamoa qoidalariga mos emas.',
    nextSteps: (decision) => decision === 'approved'
      ? 'E’lonni jamoa qidirish sahifasida ko‘rishingiz mumkin.'
      : 'Anketani sababni hisobga olib tuzatib, istalgan vaqtda qayta yuborishingiz mumkin.',
    signature: 'Hurmat bilan,\nNavykus moderatsiya jamoasi',
    footer: 'Bu Navykus ishtirokchi anketaingiz haqidagi avtomatik xabarnoma.',
  },
  ar: {
    subject: (decision) => decision === 'approved'
      ? 'تم نشر استبيانك على Navykus'
      : 'لم يُقبل استبيانك على Navykus',
    greeting: (name) => `مرحبًا ${name}!`,
    body: (decision) => decision === 'approved'
      ? 'تمت مراجعة استبيان المشارك الخاص بك ونشره في قسم «ابحث عن فريق». يمكن للمشاركين الآخرين العثور عليك والتواصل معك عبر بيانات الاتصال المذكورة في الاستبيان.'
      : 'للأسف، لم يجتَز استبيان المشارك الخاص بك عملية المراجعة ولن يُنشر في قسم «ابحث عن فريق».',
    reasonLabel: 'سبب الرفض:',
    reasonFallback: 'الاستبيان لا يلتزم بقواعد المجتمع.',
    nextSteps: (decision) => decision === 'approved'
      ? 'يمكنك الاطلاع على المنشور في صفحة البحث عن فريق.'
      : 'يمكنك تعديل الاستبيان مع مراعاة السبب المذكور أعلاه وإعادة إرساله في أي وقت.',
    signature: 'مع التحية،\nفريق مراجعة Navykus',
    footer: 'هذا إشعار تلقائي بشأن استبيان المشارك الخاص بك على Navykus.',
  },
  de: {
    subject: (decision) => decision === 'approved'
      ? 'Ihr Navykus-Fragebogen wurde veröffentlicht'
      : 'Ihr Navykus-Fragebogen wurde nicht freigegeben',
    greeting: (name) => `Hallo ${name}!`,
    body: (decision) => decision === 'approved'
      ? 'Ihr Teilnehmer-Fragebogen wurde geprüft und ist jetzt im Bereich „Team finden“ veröffentlicht. Andere Teilnehmer können Sie dort finden und über die angegebenen Kontaktdaten erreichen.'
      : 'Leider hat Ihr Teilnehmer-Fragebogen die Moderation nicht bestanden und wird im Bereich „Team finden“ nicht veröffentlicht.',
    reasonLabel: 'Ablehnungsgrund:',
    reasonFallback: 'Der Fragebogen entspricht nicht den Community-Regeln.',
    nextSteps: (decision) => decision === 'approved'
      ? 'Die Veröffentlichung können Sie auf der Teamsuche-Seite ansehen.'
      : 'Sie können den Fragebogen unter Berücksichtigung des oben genannten Grundes jederzeit erneut einreichen.',
    signature: 'Mit freundlichen Grüßen,\ndas Navykus-Moderationsteam',
    footer: 'Dies ist eine automatische Benachrichtigung zu Ihrem Navykus-Teilnehmer-Fragebogen.',
  },
  es: {
    subject: (decision) => decision === 'approved'
      ? 'Tu cuestionario de Navykus ha sido publicado'
      : 'Tu cuestionario de Navykus no fue aprobado',
    greeting: (name) => `Hola, ${name}:`,
    body: (decision) => decision === 'approved'
      ? 'Tu cuestionario de participante ha sido revisado y ya está publicado en la sección «Buscar equipo». Otros participantes pueden encontrarte y contactarte por los datos que indicaste.'
      : 'Lamentablemente, tu cuestionario de participante no superó la moderación y no se publicará en la sección «Buscar equipo».',
    reasonLabel: 'Motivo del rechazo:',
    reasonFallback: 'El cuestionario no cumple las normas de la comunidad.',
    nextSteps: (decision) => decision === 'approved'
      ? 'Puedes ver la publicación en la página de búsqueda de equipo.'
      : 'Puedes corregir el cuestionario teniendo en cuenta el motivo indicado y enviarlo de nuevo en cualquier momento.',
    signature: 'Un saludo,\nel equipo de moderación de Navykus',
    footer: 'Esta es una notificación automática sobre tu cuestionario de participante de Navykus.',
  },
  tr: {
    subject: (decision) => decision === 'approved'
      ? 'Navykus anketiniz yayınlandı'
      : 'Navykus anketiniz onaylanmadı',
    greeting: (name) => `Merhaba ${name}!`,
    body: (decision) => decision === 'approved'
      ? 'Katılımcı anketiniz incelendi ve «Takım Bul» bölümünde yayınlandı. Diğer katılımcılar sizi bulabilir ve anketinde belirttiğiniz iletişim bilgisi üzerinden yazabilir.'
      : 'Ne yazık ki katılımcı anketiniz moderasyondan geçmedi ve «Takım Bul» bölümünde yayınlanmayacak.',
    reasonLabel: 'Ret nedeni:',
    reasonFallback: 'Anket topluluk kurallarına uygun değil.',
    nextSteps: (decision) => decision === 'approved'
      ? 'Yayını takım arama sayfasında görebilirsiniz.'
      : 'Anketi yukarıdaki nedeni göz önünde bulundurarak düzenleyip istediğiniz zaman yeniden gönderebilirsiniz.',
    signature: 'Saygılarımızla,\nNavykus moderasyon ekibi',
    footer: 'Bu, Navykus katılımcı anketinize ilişkin otomatik bir bildirimdir.',
  },
};

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const asLanguage = (value: unknown): SupportedLanguage => {
  const normalized = typeof value === 'string' ? value.trim().split('-')[0].toLowerCase() : '';
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(normalized)
    ? (normalized as SupportedLanguage)
    : 'ru';
};

const card = (text: string, background: string, color: string) =>
  `<div style="margin:24px 0;padding:16px 20px;border-radius:12px;background:${background};color:${color};font-size:14px;line-height:1.6;">${text}</div>`;

const emailHtml = ({
  texts,
  name,
  decision,
  reason,
}: {
  texts: EmailLocalization;
  name: string;
  decision: Decision;
  reason?: string | null;
}) => {
  const reasonHtml = decision === 'rejected'
    ? card(
      `<strong>${escapeHtml(texts.reasonLabel)}</strong><br/>${escapeHtml((reason || '').trim() || texts.reasonFallback)}`,
      '#fef2f2',
      '#7f1d1d',
    )
    : '';

  return `<!doctype html>
<html lang="ru">
<body style="margin:0;padding:0;background:#fdf6f4;">
  <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(texts.subject(decision))}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6f4;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;padding:36px 32px;font-family:Georgia,'Times New Roman',serif;color:#1b1816;">
          <tr><td>
            <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#bc4638;font-family:Arial,Helvetica,sans-serif;font-weight:bold;">Navykus</div>
            <h1 style="margin:16px 0 0;font-size:24px;font-weight:normal;">${escapeHtml(texts.greeting(name))}</h1>
            <p style="margin:20px 0 0;font-size:15px;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(texts.body(decision))}</p>
            ${reasonHtml}
            <p style="margin:16px 0 0;font-size:14px;line-height:1.7;font-family:Arial,Helvetica,sans-serif;color:#5b6472;">${escapeHtml(texts.nextSteps(decision))}</p>
            <p style="margin:28px 0 0;">
              <a href="${SITE_ORIGIN}/find-team" style="display:inline-block;background:#1b1816;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:12px;font-size:13px;font-family:Arial,Helvetica,sans-serif;font-weight:bold;">navykus.tech</a>
            </p>
            <p style="margin:28px 0 0;font-size:13px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;color:#5b6472;white-space:pre-line;">${escapeHtml(texts.signature)}</p>
            <hr style="margin:28px 0 0;border:none;border-top:1px solid #eee2dd;" />
            <p style="margin:16px 0 0;font-size:11px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;color:#a29890;">${escapeHtml(texts.footer)}</p>
          </td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const emailText = ({
  texts,
  name,
  decision,
  reason,
}: {
  texts: EmailLocalization;
  name: string;
  decision: Decision;
  reason?: string | null;
}) => [
  texts.greeting(name),
  '',
  texts.body(decision),
  ...(decision === 'rejected'
    ? ['', texts.reasonLabel, (reason || '').trim() || texts.reasonFallback]
    : []),
  '',
  texts.nextSteps(decision),
  `${SITE_ORIGIN}/find-team`,
  '',
  texts.signature,
].join('\n');

/**
 * Sends the typed decision letter (approval or rejection) to the email stored
 * on the questionnaire, on behalf of the moderation mailbox. Never throws:
 * a failed notification must not break the moderation action itself.
 */
export const sendModerationDecisionEmail = async (
  payload: Payload,
  doc: {
    email?: string | null;
    name?: string | null;
    moderationStatus?: string | null;
    moderationComment?: string | null;
    originalLanguage?: string | null;
  },
): Promise<void> => {
  try {
    const to = String(doc.email || '').trim();
    if (!to) return;

    const decision: Decision | undefined = doc.moderationStatus === 'approved'
      ? 'approved'
      : doc.moderationStatus === 'rejected'
        ? 'rejected'
        : undefined;
    if (!decision) return;

    const language = asLanguage(doc.originalLanguage);
    const texts = L[language];
    const name = String(doc.name || '').trim() || to.split('@')[0];

    await payload.sendEmail({
      to,
      from: MODERATION_FROM_EMAIL,
      subject: texts.subject(decision),
      html: emailHtml({ texts, name, decision, reason: doc.moderationComment }),
      text: emailText({ texts, name, decision, reason: doc.moderationComment }),
    });
  } catch (error) {
    console.error('[moderation-emails] failed to send decision email:', error);
  }
};
