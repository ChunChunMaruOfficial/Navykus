import { useTranslation } from 'react-i18next';

interface PrivacyConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: boolean;
}

export default function PrivacyConsentCheckbox({ checked, onChange, error = false }: PrivacyConsentCheckboxProps) {
  const { t } = useTranslation();

  return (
    <label className={`flex items-start gap-2 rounded-xl border p-3 ${error ? 'border-red-500/80 bg-red-50/40' : 'border-[#d8d1cc] bg-white/55'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-[#d8d1cc] text-brand-terracotta focus:ring-2 focus:ring-brand-terracotta/20 focus:ring-offset-2 transition-colors cursor-pointer"
        required
      />
      <span className="text-xs text-brand-slate leading-relaxed">
        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-terracotta underline underline-offset-2 hover:text-brand-dark">
          {t('ui.applicationmodal.privacyConsentLabel')}
        </a>
      </span>
    </label>
  );
}