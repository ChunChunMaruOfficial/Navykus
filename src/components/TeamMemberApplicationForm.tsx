import { useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Check, Link2, Upload, X } from 'lucide-react';

import { submitTeamMemberApplication } from '../api';
import type { ApplicationForm, TeamApplicationContext, TeamRole } from '../types';

const FIELD_CLASS =
  'w-full rounded-xl border border-[#d8d1cc] bg-white/70 px-3 py-2.5 text-xs text-brand-dark outline-none transition-colors placeholder:text-brand-slate/40 focus:border-brand-dark/45 focus:bg-white sm:px-4 sm:text-sm';

const UPLOAD_CLASS =
  'group relative flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-[#d8d1cc] bg-white/70 px-4 py-3.5 transition-colors hover:bg-white focus-within:border-brand-dark/45 focus-within:bg-white';

const CONTACT_TYPES = ['telegram', 'email', 'discord'] as const;
const ROLE_OPTIONS: TeamRole[] = ['developer', 'designer', 'researcher', 'product_manager', 'marketer', 'team_lead', 'analyst', 'other'];
const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

type Props = {
  context?: TeamApplicationContext;
  compact?: boolean;
  onSubmitted?: () => void;
};

const emptyForm = (context?: TeamApplicationContext): ApplicationForm => ({
  name: '',
  email: '',
  age: '',
  country: '',
  city: '',
  contact: '',
  contactType: 'telegram',
  shortBio: '',
  interests: [],
  skills: [],
  targetRoles: ['other'],
  targetProject: '',
  whyLooking: '',
  portfolioLink: '',
  portfolioFiles: [],
  sourceContext: context?.sourceTitle,
  sourceType: context?.sourceType || 'modal',
  sourceId: context?.sourceId,
  tournamentId: context?.tournamentId || context?.sourceId,
});

const splitList = (value: string) => value
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

export default function TeamMemberApplicationForm({ context, compact = false, onSubmitted }: Props) {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState<ApplicationForm>(() => emptyForm(context));
  const [skillsInput, setSkillsInput] = useState('');
  const [interestsInput, setInterestsInput] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [fileError, setFileError] = useState('');
  const [portfolioMode, setPortfolioMode] = useState<'files' | 'link'>('files');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const sourceLabel = useMemo(() => context?.sourceTitle || form.sourceContext || '', [context?.sourceTitle, form.sourceContext]);

  const isParticipationForm =
    context?.sourceType === 'event' ||
    context?.sourceType === 'opportunity' ||
    context?.sourceType === 'activities';

  const setField = <K extends keyof ApplicationForm>(key: K, value: ApplicationForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleFiles = (fileList?: FileList | null) => {
    setFileError('');
    if (!fileList) return;
    const nextFiles = Array.from(fileList);
    if (nextFiles.length + (form.portfolioFiles?.length || 0) > MAX_FILES) {
      setFileError(t('ui.applicationmodal.maxFilesError', { count: MAX_FILES, defaultValue: `Up to ${MAX_FILES} files can be attached` }));
      return;
    }
    const invalidFile = nextFiles.find((file) => !ALLOWED_FILE_TYPES.has(file.type) || file.size > MAX_FILE_SIZE);
    if (invalidFile) {
      setFileError(
        invalidFile.size > MAX_FILE_SIZE
          ? t('ui.enhancements.fileSizeError')
          : t('ui.enhancements.fileTypeError'),
      );
      return;
    }
    setField('portfolioFiles', [...(form.portfolioFiles || []), ...nextFiles]);
  };

  const validate = () => {
    const nextErrors: string[] = [];
    if (!form.name.trim()) nextErrors.push(t('ui.app.02ce21d910'));
    if (!form.email.trim() || !form.email.includes('@')) nextErrors.push(t('ui.championshippage.7dab316a67'));
    const age = Number(form.age);
    if (!form.age.trim() || Number.isNaN(age) || age < 10 || age > 24) nextErrors.push(t('ui.championshippage.7b04173c40'));
    if (!form.country.trim()) nextErrors.push(t('ui.app.92ca287f55'));
    if (!form.contact.trim()) nextErrors.push(t('ui.app.a4bae5e597'));
    if (!form.shortBio.trim()) nextErrors.push(t('ui.findteampage.bioRequired', { defaultValue: 'Add a short bio' }));
    if (!isParticipationForm && !form.whyLooking.trim()) nextErrors.push(t('ui.findteampage.whyRequired', { defaultValue: 'Explain why you are looking for a team' }));
    if (!isParticipationForm && !form.targetRoles.length) nextErrors.push(t('ui.findteampage.rolesRequired', { defaultValue: 'Choose a role' }));
    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setStatus('submitting');
    try {
      const language = (i18n.resolvedLanguage || i18n.language || 'ru').split('-')[0];
      await submitTeamMemberApplication({
        ...form,
        skills: form.skills.length ? form.skills : splitList(skillsInput),
        interests: form.interests.length ? form.interests : splitList(interestsInput),
        sourceContext: sourceLabel || form.sourceContext,
      }, language);
      setStatus('success');
      setForm(emptyForm(context));
      setSkillsInput('');
      setInterestsInput('');
      setPortfolioMode('files');
      onSubmitted?.();
    } catch {
      setErrors([t('ui.applicationmodal.submitError', { defaultValue: 'Could not send the form. Try again.' })]);
      setStatus('idle');
    }
  };

  if (status === 'success') {
    return (
      <div className="space-y-5 py-2">
        <div className="flex items-start gap-4">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600">
            <Check className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-serif tracking-tight text-brand-dark">{t('ui.app.0d65b9d27c')}</h2>
            <p className="mt-1.5 max-w-sm text-sm text-brand-slate">
              {t('ui.applicationmodal.moderationSuccess', { defaultValue: 'The form was sent for moderation. After review it will appear on the team search page.' })}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="w-full rounded-xl bg-brand-dark py-3 text-xs font-medium text-white transition-colors hover:bg-brand-dark/95"
        >
          {t('ui.applicationmodal.467dd34c6e')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={compact ? 'space-y-3' : 'space-y-4'}>
      <div>
        <h2 className="text-xl font-serif tracking-tight text-brand-dark sm:text-2xl">{t('ui.applicationmodal.6b0f724b4e')}</h2>
        <p className="mt-1 text-xs font-light text-brand-slate sm:text-sm">
          {sourceLabel || t('ui.applicationmodal.21117adc83')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-[10px] font-mono uppercase tracking-wider text-brand-dark/70">
          {t('ui.applicationmodal.34fda9e41a')}*
          <input value={form.name} onChange={(event) => setField('name', event.target.value)} className={FIELD_CLASS} required />
        </label>
        <label className="grid gap-1 text-[10px] font-mono uppercase tracking-wider text-brand-dark/70">
          Email*
          <input type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} className={FIELD_CLASS} required />
        </label>
        <label className="grid gap-1 text-[10px] font-mono uppercase tracking-wider text-brand-dark/70">
          {t('ui.championshippage.b520139c06')}*
          <input type="number" min={10} max={24} value={form.age} onChange={(event) => setField('age', event.target.value)} className={FIELD_CLASS} required />
        </label>
        <label className="grid gap-1 text-[10px] font-mono uppercase tracking-wider text-brand-dark/70">
          {t('ui.findteampage.d45e4de05b')}*
          <input value={form.country} onChange={(event) => setField('country', event.target.value)} className={FIELD_CLASS} required />
        </label>
        <label className="grid gap-1 text-[10px] font-mono uppercase tracking-wider text-brand-dark/70">
          {t('ui.championshippage.450778ada1')}
          <input value={form.city} onChange={(event) => setField('city', event.target.value)} className={FIELD_CLASS} />
        </label>
        <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-2">
          <label className="grid gap-1 text-[10px] font-mono uppercase tracking-wider text-brand-dark/70">
            {t('ui.findteampage.c8d0e2f4a7')}*
            <select value={form.contactType} onChange={(event) => setField('contactType', event.target.value as ApplicationForm['contactType'])} className={FIELD_CLASS}>
              {CONTACT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-[10px] font-mono uppercase tracking-wider text-brand-dark/70">
            {t('ui.findteampage.3765795ef8')}*
            <input value={form.contact} onChange={(event) => setField('contact', event.target.value)} className={FIELD_CLASS} required />
          </label>
        </div>
      </div>

      <label className="grid gap-1 text-[10px] font-mono uppercase tracking-wider text-brand-dark/70">
        {t('ui.findteampage.53fa567ce7')}*
        <textarea rows={3} value={form.shortBio} onChange={(event) => setField('shortBio', event.target.value)} className={FIELD_CLASS} required />
      </label>

      {!isParticipationForm && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-[10px] font-mono uppercase tracking-wider text-brand-dark/70">
            {t('ui.findteampage.e4f6b0a2c1')}
            <input value={skillsInput} onChange={(event) => {
              setSkillsInput(event.target.value);
              setField('skills', splitList(event.target.value));
            }} placeholder="React, design, research" className={FIELD_CLASS} />
          </label>
          <label className="grid gap-1 text-[10px] font-mono uppercase tracking-wider text-brand-dark/70">
            {t('ui.findteampage.a6b8c0d2e5')}
            <input value={interestsInput} onChange={(event) => {
              setInterestsInput(event.target.value);
              setField('interests', splitList(event.target.value));
            }} placeholder="urbanism, tech, social" className={FIELD_CLASS} />
          </label>
        </div>
      )}

      {!isParticipationForm && (
        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-brand-dark/70">{t('ui.findteampage.20be1bd637')}*</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ROLE_OPTIONS.map((role) => (
              <label key={role} className="flex min-h-10 items-center gap-2 rounded-xl border border-[#d8d1cc] bg-white/60 px-3 text-[11px] text-brand-slate">
                <input
                  type="checkbox"
                  checked={form.targetRoles.includes(role)}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...form.targetRoles.filter((item) => item !== 'other'), role]
                      : form.targetRoles.filter((item) => item !== role);
                    setField('targetRoles', next.length ? next : ['other']);
                  }}
                />
                {role.replace('_', ' ')}
              </label>
            ))}
          </div>
        </div>
      )}

      {!isParticipationForm && (
        <label className="grid gap-1 text-[10px] font-mono uppercase tracking-wider text-brand-dark/70">
          {t('ui.findteampage.43584e6c75')}
          <input value={form.targetProject || ''} onChange={(event) => setField('targetProject', event.target.value)} className={FIELD_CLASS} />
        </label>
      )}

      {!isParticipationForm && (
        <label className="grid gap-1 text-[10px] font-mono uppercase tracking-wider text-brand-dark/70">
          {t('ui.findteampage.0d5ce0304e')}*
          <textarea rows={3} value={form.whyLooking} onChange={(event) => setField('whyLooking', event.target.value)} className={FIELD_CLASS} required />
        </label>
      )}

      <div className="space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-brand-dark/70">{t('ui.applicationmodal.portfolioSection')}</div>
        <div className="flex rounded-xl border border-[#d8d1cc] bg-white/55 p-1">
          <button
            type="button"
            onClick={() => setPortfolioMode('files')}
            aria-pressed={portfolioMode === 'files'}
            className={`inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all ${
              portfolioMode === 'files' ? 'bg-brand-dark text-white shadow-md' : 'text-brand-slate hover:bg-white/70 hover:text-brand-dark'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            {t('ui.applicationmodal.portfolioTabFiles')}
          </button>
          <button
            type="button"
            onClick={() => setPortfolioMode('link')}
            aria-pressed={portfolioMode === 'link'}
            className={`inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all ${
              portfolioMode === 'link' ? 'bg-brand-dark text-white shadow-md' : 'text-brand-slate hover:bg-white/70 hover:text-brand-dark'
            }`}
          >
            <Link2 className="h-3.5 w-3.5" />
            {t('ui.applicationmodal.portfolioTabLink')}
          </button>
        </div>

        {portfolioMode === 'files' ? (
          <div>
            <label className={UPLOAD_CLASS}>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                onChange={(event) => handleFiles(event.target.files)}
                className="sr-only"
              />
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/60 bg-gradient-to-br from-[#bc4638]/5 to-[#bd5b82]/5">
                  <Upload className="h-4 w-4 text-brand-slate/60 transition-colors group-hover:text-brand-rose-deep" />
                </div>
                <span className="text-[11px] text-brand-slate/70 transition-colors group-hover:text-brand-dark">{t('ui.applicationmodal.f5717f85ba')}</span>
                <span className="text-[9px] text-brand-slate/40">{t('ui.applicationmodal.6272f20d22')}</span>
              </div>
            </label>
            {form.portfolioFiles && form.portfolioFiles.length > 0 && (
              <div className="mt-2 grid gap-1.5">
                {form.portfolioFiles.map((file) => (
                  <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-xl bg-white/55 px-3 py-2 text-xs text-brand-slate">
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setField('portfolioFiles', form.portfolioFiles?.filter((item) => item !== file) || [])}
                      className="p-1 text-brand-slate/50 hover:text-brand-terracotta"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {fileError && <p className="mt-2 text-xs text-rose-700">{fileError}</p>}
          </div>
        ) : (
          <label className="grid gap-1 text-[10px] font-mono uppercase tracking-wider text-brand-dark/70">
            {t('ui.championshippage.40aa3bf48b')}
            <input value={form.portfolioLink || ''} onChange={(event) => setField('portfolioLink', event.target.value)} placeholder="Behance, GitHub, Google Drive..." className={FIELD_CLASS} />
          </label>
        )}
      </div>

      {errors.length > 0 && (
        <div className="space-y-1 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs text-rose-800">
          {errors.map((error) => <div key={error}>{error}</div>)}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-terracotta px-6 py-3 text-sm font-medium text-white shadow-lg shadow-brand-terracotta/20 transition-all hover:bg-brand-terracotta/95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === 'submitting' ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span>{t('ui.applicationmodal.b55a7aad35')}</span>
            </>
          ) : (
            <>
              <span>{t('ui.applicationmodal.cf4f1950f8')}</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
