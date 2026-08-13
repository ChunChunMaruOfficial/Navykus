import { SUPPORTED_LANGUAGES } from './i18n/languages';

export type AdminContentFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'checkbox'
  | 'select'
  | 'multiselect'
  | 'list'
  | 'date'
  | 'hidden';

export type AdminContentField = {
  name: string;
  label: string;
  type: AdminContentFieldType;
  required?: boolean;
  options?: readonly string[];
  defaultValue?: string | number | boolean | string[];
  help?: string;
};

export type AdminContentType = {
  key: string;
  label: string;
  collection: string;
  group: 'content' | 'settings';
  titleField: string;
  searchFields: readonly string[];
  listFields: readonly string[];
  supportsDraftStatus?: boolean;
  usesPublishedFlag?: boolean;
  requiresPublishedFlag?: boolean;
  publicPath?: string;
  fields: readonly AdminContentField[];
};

const languageField: AdminContentField = {
  name: 'originalLanguage',
  label: 'Original language',
  type: 'select',
  options: SUPPORTED_LANGUAGES,
  defaultValue: 'ru',
};

const seoFields: AdminContentField[] = [
  { name: 'seoTitle', label: 'SEO title', type: 'text' },
  { name: 'seoDescription', label: 'SEO description', type: 'textarea' },
];

const publishedFields: AdminContentField[] = [
  { name: 'isPublished', label: 'Published', type: 'checkbox', defaultValue: true },
  { name: '_status', label: 'Draft status', type: 'select', options: ['draft', 'published'], defaultValue: 'published' },
];

const draftStatusFields: AdminContentField[] = [
  { name: '_status', label: 'Draft status', type: 'select', options: ['draft', 'published'], defaultValue: 'published' },
];

const legacyPublishedFields: AdminContentField[] = [
  { name: 'isPublished', label: 'Published', type: 'checkbox', defaultValue: true },
];

export const ADMIN_CONTENT_TYPES = [
  {
    key: 'team-members',
    label: 'Participants',
    collection: 'team-members',
    group: 'content',
    titleField: 'name',
    searchFields: ['name', 'email', 'country', 'city', 'shortBio'],
    listFields: ['name', 'email', 'country', 'moderationStatus', 'isApproved'],
    supportsDraftStatus: true,
    publicPath: '/find-team',
    fields: [
      ...draftStatusFields,
      languageField,
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'text', required: true },
      { name: 'age', label: 'Age', type: 'number', required: true, defaultValue: 16 },
      { name: 'country', label: 'Country', type: 'text', required: true },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'shortBio', label: 'Short bio', type: 'textarea', required: true },
      { name: 'interests', label: 'Interests', type: 'list' },
      { name: 'skills', label: 'Skills', type: 'list' },
      { name: 'targetRoles', label: 'Target roles', type: 'multiselect', required: true, options: ['developer', 'designer', 'researcher', 'product_manager', 'marketer', 'team_lead', 'analyst', 'other'], defaultValue: ['developer'] },
      { name: 'targetProject', label: 'Target project', type: 'text' },
      { name: 'whyLooking', label: 'Why looking', type: 'textarea', required: true },
      { name: 'contact', label: 'Contact', type: 'text', required: true },
      { name: 'contactType', label: 'Contact type', type: 'select', required: true, options: ['telegram', 'email', 'discord'], defaultValue: 'telegram' },
      { name: 'portfolioLink', label: 'Portfolio link', type: 'text' },
      { name: 'sourceType', label: 'Source type', type: 'select', options: ['modal', 'championship', 'event', 'opportunity', 'find-team', 'home', 'about', 'activities', 'api'], defaultValue: 'modal' },
      { name: 'sourceId', label: 'Source ID', type: 'text' },
      { name: 'sourceContext', label: 'Source context', type: 'text' },
      { name: 'tournamentId', label: 'Tournament ID', type: 'text' },
      { name: 'moderationStatus', label: 'Moderation', type: 'select', required: true, options: ['pending', 'approved', 'rejected', 'needs_edit'], defaultValue: 'approved' },
      { name: 'isApproved', label: 'Approved', type: 'checkbox', defaultValue: true },
      ...seoFields,
    ],
  },
  {
    key: 'championships',
    label: 'Championships',
    collection: 'tournaments',
    group: 'content',
    titleField: 'title',
    searchFields: ['title', 'description', 'type'],
    listFields: ['title', 'type', 'registrationStatus', 'isPublished'],
    supportsDraftStatus: true,
    usesPublishedFlag: true,
    publicPath: '/championship',
    fields: [
      ...publishedFields,
      languageField,
      { name: 'isFeatured', label: 'Featured', type: 'checkbox', defaultValue: false },
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text' },
      { name: 'type', label: 'Type', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true, help: 'Main championship description. The Payload admin field is configured with extra rows.' },
      { name: 'pitch', label: 'Pitch', type: 'textarea', help: 'Short hero text. Falls back to description.' },
      { name: 'date', label: 'Date', type: 'text', required: true },
      { name: 'registrationDeadline', label: 'Registration deadline', type: 'text', required: true },
      { name: 'registrationStatus', label: 'Registration status', type: 'select', required: true, options: ['open', 'suspended', 'closed'], defaultValue: 'open' },
      { name: 'maxParticipants', label: 'Max participants', type: 'number', required: true, defaultValue: 100 },
      { name: 'skills', label: 'Skills', type: 'list' },
      { name: 'mentors', label: 'Mentors', type: 'list' },
      { name: 'suitableFor', label: 'Suitable for', type: 'textarea' },
      { name: 'format', label: 'Format', type: 'textarea' },
      { name: 'targetAudience', label: 'Target audience', type: 'textarea' },
      { name: 'ageLimit', label: 'Age limit', type: 'text' },
      { name: 'teamsAllowed', label: 'Teams allowed', type: 'text' },
      { name: 'language', label: 'Language', type: 'text' },
      { name: 'expectedResult', label: 'Expected result', type: 'textarea' },
      { name: 'themesText', label: 'Themes', type: 'textarea' },
      { name: 'evaluationCriteriaText', label: 'Evaluation criteria', type: 'textarea' },
      ...seoFields,
    ],
  },
  {
    key: 'events',
    label: 'Events',
    collection: 'events',
    group: 'content',
    titleField: 'title',
    searchFields: ['title', 'shortDescription', 'fullDescription', 'speaker', 'country'],
    listFields: ['title', 'eventType', 'eventDate', 'format', 'isPublished'],
    supportsDraftStatus: true,
    usesPublishedFlag: true,
    publicPath: '/activities/events',
    fields: [
      ...publishedFields,
      languageField,
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text' },
      { name: 'shortDescription', label: 'Short description', type: 'textarea', required: true },
      { name: 'fullDescription', label: 'Full description', type: 'textarea' },
      { name: 'imageUrl', label: 'Image URL', type: 'text' },
      { name: 'eventType', label: 'Event type', type: 'text', required: true },
      { name: 'eventDate', label: 'Event date', type: 'date', required: true },
      { name: 'timeZone', label: 'Time zone', type: 'text', defaultValue: 'Europe/Moscow' },
      { name: 'registrationDeadline', label: 'Registration deadline', type: 'date' },
      { name: 'participantLimit', label: 'Participant limit', type: 'number' },
      { name: 'format', label: 'Format', type: 'select', required: true, options: ['online', 'offline', 'hybrid'], defaultValue: 'online' },
      { name: 'country', label: 'Country', type: 'text' },
      { name: 'venue', label: 'Venue', type: 'text' },
      { name: 'onlineLink', label: 'Online link', type: 'text' },
      { name: 'registrationUrl', label: 'Registration URL', type: 'text' },
      { name: 'speaker', label: 'Speaker', type: 'text' },
      { name: 'languages', label: 'Languages', type: 'list' },
      { name: 'materials', label: 'Materials', type: 'list' },
      ...seoFields,
    ],
  },
  {
    key: 'opportunities',
    label: 'Opportunities',
    collection: 'opportunities',
    group: 'content',
    titleField: 'title',
    searchFields: ['title', 'shortDescription', 'fullDescription', 'organization', 'country'],
    listFields: ['title', 'organization', 'opportunityType', 'deadline', 'isPublished'],
    supportsDraftStatus: true,
    usesPublishedFlag: true,
    publicPath: '/activities/opportunities',
    fields: [
      ...publishedFields,
      languageField,
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text' },
      { name: 'organization', label: 'Organization', type: 'text', required: true },
      { name: 'opportunityType', label: 'Opportunity type', type: 'text', required: true },
      { name: 'source', label: 'Source', type: 'select', options: ['navykus', 'verified', 'partner'], defaultValue: 'verified' },
      { name: 'category', label: 'Category', type: 'select', options: ['championships', 'olympiads', 'contests', 'internships', 'projects', 'research', 'volunteering', 'grants', 'scholarships', 'hackathons', 'exchanges', 'summer', 'online'], defaultValue: 'projects' },
      { name: 'direction', label: 'Direction', type: 'select', options: ['business', 'science', 'tech', 'social', 'creative', 'leadership'], defaultValue: 'social' },
      { name: 'participation', label: 'Participation', type: 'select', options: ['individual', 'team', 'both'], defaultValue: 'both' },
      { name: 'shortDescription', label: 'Short description', type: 'textarea', required: true },
      { name: 'fullDescription', label: 'Full description', type: 'textarea' },
      { name: 'logoUrl', label: 'Logo URL', type: 'text' },
      { name: 'imageUrl', label: 'Image URL', type: 'text' },
      { name: 'country', label: 'Country', type: 'text' },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'format', label: 'Format', type: 'select', options: ['online', 'offline', 'hybrid'], defaultValue: 'online' },
      { name: 'ageMin', label: 'Age min', type: 'number' },
      { name: 'ageMax', label: 'Age max', type: 'number' },
      { name: 'cost', label: 'Cost', type: 'text' },
      { name: 'funding', label: 'Funding', type: 'checkbox', defaultValue: false },
      { name: 'deadline', label: 'Deadline', type: 'date' },
      { name: 'startDate', label: 'Start date', type: 'date' },
      { name: 'finalDeadline', label: 'Final deadline', type: 'checkbox', defaultValue: false },
      { name: 'registrationOpen', label: 'Registration open', type: 'checkbox', defaultValue: true },
      { name: 'seats', label: 'Seats', type: 'number', defaultValue: 0 },
      { name: 'savedCount', label: 'Saved count', type: 'number', defaultValue: 0 },
      { name: 'editorPick', label: 'Editor pick', type: 'checkbox', defaultValue: false },
      { name: 'recommended', label: 'Recommended', type: 'checkbox', defaultValue: false },
      { name: 'portfolioValue', label: 'Portfolio value', type: 'number', defaultValue: 0 },
      { name: 'publishedAt', label: 'Published at', type: 'date' },
      { name: 'languages', label: 'Languages', type: 'list' },
      { name: 'skills', label: 'Skills', type: 'list' },
      { name: 'keywords', label: 'Keywords', type: 'list' },
      { name: 'grades', label: 'Grades', type: 'list' },
      { name: 'requirements', label: 'Requirements', type: 'list' },
      { name: 'benefits', label: 'Benefits', type: 'list' },
      { name: 'documents', label: 'Documents', type: 'list' },
      { name: 'officialUrl', label: 'Official URL', type: 'text' },
      { name: 'internalApplicationsEnabled', label: 'Internal applications', type: 'checkbox', defaultValue: false },
      ...seoFields,
    ],
  },
  {
    key: 'activities',
    label: 'Activities',
    collection: 'activities',
    group: 'content',
    titleField: 'title',
    searchFields: ['title', 'shortDescription', 'fullDescription', 'format'],
    listFields: ['title', 'category', 'status', 'date', 'isPublished'],
    requiresPublishedFlag: true,
    publicPath: '/activities/events',
    fields: [
      ...legacyPublishedFields,
      languageField,
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'shortDescription', label: 'Short description', type: 'textarea', required: true },
      { name: 'fullDescription', label: 'Full description', type: 'textarea', required: true },
      { name: 'format', label: 'Format', type: 'text', required: true },
      { name: 'date', label: 'Date', type: 'text', required: true },
      { name: 'imageUrl', label: 'Image URL', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', required: true, options: ['educational', 'project', 'social', 'online-meeting', 'workshop', 'team'], defaultValue: 'educational' },
      { name: 'status', label: 'Status', type: 'select', required: true, options: ['coming', 'ongoing', 'completed'], defaultValue: 'coming' },
      { name: 'who', label: 'Who', type: 'textarea', required: true },
      { name: 'benefits', label: 'Benefits', type: 'list' },
      { name: 'prerequisites', label: 'Prerequisites', type: 'textarea', required: true },
      { name: 'ctaText', label: 'CTA text', type: 'text', required: true },
      { name: 'ctaLink', label: 'CTA link', type: 'text' },
      ...seoFields,
    ],
  },
  {
    key: 'experts',
    label: 'Experts & jury',
    collection: 'experts',
    group: 'content',
    titleField: 'name',
    searchFields: ['name', 'role', 'expertise', 'description'],
    listFields: ['name', 'type', 'role', 'isPublished'],
    supportsDraftStatus: true,
    usesPublishedFlag: true,
    publicPath: '/championship',
    fields: [
      ...publishedFields,
      languageField,
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', required: true, options: ['jury', 'mentor', 'expert'], defaultValue: 'expert' },
      { name: 'role', label: 'Role', type: 'text', required: true },
      { name: 'expertise', label: 'Expertise', type: 'textarea', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'tournamentId', label: 'Tournament ID', type: 'text' },
      ...seoFields,
    ],
  },
  {
    key: 'faqs',
    label: 'FAQ',
    collection: 'faqs',
    group: 'content',
    titleField: 'question',
    searchFields: ['question', 'answer', 'page'],
    listFields: ['question', 'page', 'isPublished'],
    supportsDraftStatus: true,
    usesPublishedFlag: true,
    publicPath: '/about',
    fields: [
      ...publishedFields,
      languageField,
      { name: 'page', label: 'Page', type: 'select', required: true, options: ['home', 'about', 'championship', 'activities', 'find-team', 'opportunities'], defaultValue: 'about' },
      { name: 'question', label: 'Question', type: 'text', required: true },
      { name: 'answer', label: 'Answer', type: 'textarea', required: true },
      ...seoFields,
    ],
  },
  {
    key: 'page-texts',
    label: 'Page texts',
    collection: 'page-texts',
    group: 'content',
    titleField: 'label',
    searchFields: ['label', 'translationKey', 'value', 'page'],
    listFields: ['page', 'label', 'isPublished'],
    requiresPublishedFlag: true,
    publicPath: '/about',
    fields: [
      ...legacyPublishedFields,
      { name: 'page', label: 'Page', type: 'select', required: true, options: ['about', 'championship'], defaultValue: 'about' },
      { name: 'translationKey', label: 'Translation key', type: 'text', required: true },
      { name: 'label', label: 'Label', type: 'text', required: true },
      { name: 'value', label: 'Russian text', type: 'textarea', required: true },
    ],
  },
  {
    key: 'pillars',
    label: 'Pillars',
    collection: 'pillars',
    group: 'content',
    titleField: 'title',
    searchFields: ['label', 'title', 'description'],
    listFields: ['label', 'title', 'isPublished'],
    requiresPublishedFlag: true,
    publicPath: '/',
    fields: [
      ...legacyPublishedFields,
      languageField,
      { name: 'label', label: 'Label', type: 'text', required: true },
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      ...seoFields,
    ],
  },
  {
    key: 'scenarios',
    label: 'Scenarios',
    collection: 'scenarios',
    group: 'content',
    titleField: 'title',
    searchFields: ['title', 'who', 'why'],
    listFields: ['title', 'actionType', 'isPublished'],
    requiresPublishedFlag: true,
    publicPath: '/activities/events',
    fields: [
      ...legacyPublishedFields,
      languageField,
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'who', label: 'Who', type: 'textarea', required: true },
      { name: 'why', label: 'Why', type: 'textarea', required: true },
      { name: 'ctaText', label: 'CTA text', type: 'text', required: true },
      { name: 'actionType', label: 'Action type', type: 'select', required: true, options: ['apply', 'team', 'activity', 'general'], defaultValue: 'general' },
      ...seoFields,
    ],
  },
  {
    key: 'stats',
    label: 'Stats',
    collection: 'stats',
    group: 'content',
    titleField: 'label',
    searchFields: ['label', 'value'],
    listFields: ['label', 'value', 'isPublished'],
    requiresPublishedFlag: true,
    publicPath: '/',
    fields: [
      ...legacyPublishedFields,
      languageField,
      { name: 'value', label: 'Value', type: 'text', required: true },
      { name: 'label', label: 'Label', type: 'text', required: true },
      ...seoFields,
    ],
  },
  {
    key: 'trust-points',
    label: 'Trust points',
    collection: 'trust-points',
    group: 'content',
    titleField: 'title',
    searchFields: ['title', 'description'],
    listFields: ['title', 'isPublished'],
    requiresPublishedFlag: true,
    publicPath: '/',
    fields: [
      ...legacyPublishedFields,
      languageField,
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      ...seoFields,
    ],
  },
  {
    key: 'contact-settings',
    label: 'Contact settings',
    collection: 'contact-settings',
    group: 'settings',
    titleField: 'label',
    searchFields: ['label', 'email'],
    listFields: ['label', 'email'],
    fields: [
      { name: 'label', label: 'Label', type: 'text', required: true, defaultValue: 'Site Contacts' },
      { name: 'email', label: 'Email', type: 'text' },
    ],
  },
  {
    key: 'operator-settings',
    label: 'Operator settings',
    collection: 'operator-settings',
    group: 'settings',
    titleField: 'label',
    searchFields: ['label', 'operatorName', 'contactsEmail'],
    listFields: ['label', 'operatorName', 'contactsEmail'],
    fields: [
      { name: 'label', label: 'Label', type: 'text', required: true, defaultValue: 'Operator Settings' },
      { name: 'operatorName', label: 'Operator name', type: 'text' },
      { name: 'operatorInn', label: 'INN', type: 'text' },
      { name: 'operatorOgrn', label: 'OGRN', type: 'text' },
      { name: 'operatorAddress', label: 'Operator address', type: 'textarea' },
      { name: 'operatorRegistryNumber', label: 'RKN registry number', type: 'text' },
      { name: 'operatorRegistryDate', label: 'RKN registry date', type: 'text' },
      { name: 'contactsEmail', label: 'Contacts email', type: 'text' },
      { name: 'contactsPostalAddress', label: 'Contacts postal address', type: 'textarea' },
    ],
  },
] as const satisfies readonly AdminContentType[];

export type AdminContentKey = (typeof ADMIN_CONTENT_TYPES)[number]['key'];

export const ADMIN_CONTENT_TYPE_KEYS = ADMIN_CONTENT_TYPES.map((type) => type.key) as AdminContentKey[];

export const getAdminContentType = (key: string): AdminContentType | undefined =>
  ADMIN_CONTENT_TYPES.find((type) => type.key === key);

export const getAdminContentTypeByCollection = (collection: string): AdminContentType | undefined =>
  ADMIN_CONTENT_TYPES.find((type) => type.collection === collection);
