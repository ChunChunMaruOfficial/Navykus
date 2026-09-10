// Select options shared by the CMS collections, the schema/data fixes in server/payload.ts
// and the public site. Values are stable codes the site maps to translated labels, so they
// must never go through the AI translator.

export const ACTIVITY_CATEGORY_OPTIONS = [
  { label: 'Образовательная (лекция, курс)', value: 'educational' },
  { label: 'Проектная (хакатон, кейс)', value: 'project' },
  { label: 'Социальная (форум, нетворкинг)', value: 'social' },
  { label: 'Онлайн-встреча (вебинар)', value: 'online-meeting' },
  { label: 'Воркшоп / мастер-класс', value: 'workshop' },
  { label: 'Командная', value: 'team' },
] as const;

export const ACTIVITY_CATEGORY_VALUES = ACTIVITY_CATEGORY_OPTIONS.map((option) => option.value);

export const OPPORTUNITY_CATEGORY_OPTIONS = [
  { label: 'Чемпионаты', value: 'championships' },
  { label: 'Олимпиады', value: 'olympiads' },
  { label: 'Конкурсы', value: 'contests' },
  { label: 'Стажировки', value: 'internships' },
  { label: 'Проектные программы', value: 'projects' },
  { label: 'Исследования', value: 'research' },
  { label: 'Волонтёрство', value: 'volunteering' },
  { label: 'Гранты', value: 'grants' },
  { label: 'Стипендии', value: 'scholarships' },
  { label: 'Хакатоны', value: 'hackathons' },
  { label: 'Международные обмены', value: 'exchanges' },
  { label: 'Летние программы', value: 'summer' },
  { label: 'Онлайн-программы', value: 'online' },
] as const;

export const OPPORTUNITY_CATEGORY_VALUES = OPPORTUNITY_CATEGORY_OPTIONS.map((option) => option.value);

export const OPPORTUNITY_COST_OPTIONS = [
  { label: 'Бесплатно', value: 'free' },
  { label: 'Платно', value: 'paid' },
  { label: 'Есть стипендия / покрытие расходов', value: 'scholarship' },
] as const;

export const OPPORTUNITY_COST_VALUES = OPPORTUNITY_COST_OPTIONS.map((option) => option.value);

export const CONTENT_LANGUAGE_OPTIONS = [
  { label: 'Русский', value: 'ru' },
  { label: 'English', value: 'en' },
  { label: 'Қазақша', value: 'kk' },
  { label: 'O‘zbekcha', value: 'uz' },
  { label: 'العربية', value: 'ar' },
  { label: 'Deutsch', value: 'de' },
  { label: 'Español', value: 'es' },
  { label: 'Türkçe', value: 'tr' },
] as const;

export const CONTENT_LANGUAGE_VALUES = CONTENT_LANGUAGE_OPTIONS.map((option) => option.value);
