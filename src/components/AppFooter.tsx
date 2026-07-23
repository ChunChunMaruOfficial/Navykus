import { useTranslation } from 'react-i18next';
import type { ContactSettings } from '../api';

interface AppFooterProps {
  contactSettings: ContactSettings | null;
  /** Navigation callback: page name string ('about' | 'championship' | 'activities' | 'find-team' | 'blog') */
  onNavigate: (page: string) => void;
}

const AppFooter = ({ contactSettings, onNavigate }: AppFooterProps) => {
  const { t } = useTranslation();

  return (
    <footer id="footer-system" className="relative z-10 bg-white/20 backdrop-blur-sm py-16">
      <div className="max-w-6xl mx-auto px-[6%] md:px-[10%] space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-lg text-brand-dark tracking-tight">
                {t('ui.app.b1a2ec16fe')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-brand-slate font-normal md:font-light leading-relaxed max-w-xs">
              {t('ui.app.db07934f76')}
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="text-[10px] font-mono text-brand-dark uppercase tracking-widest font-semibold">
              {t('ui.app.fc95125398')}
            </h4>
            <ul className="space-y-1.5 text-xs text-brand-slate font-normal md:font-light">
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-[#bc4638] transition-colors cursor-pointer">
                  {t('ui.app.ffe3d3127f')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('championship')} className="hover:text-[#bc4638] transition-colors cursor-pointer">
                  {t('ui.app.2757f706cf')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('activities')} className="hover:text-[#bc4638] transition-colors cursor-pointer">
                  {t('ui.app.814b71a2da')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('find-team')} className="hover:text-[#bc4638] transition-colors cursor-pointer">
                  {t('ui.app.d13f387e64')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('blog')} className="hover:text-[#bc4638] transition-colors cursor-pointer">
                  {t('ui.blogpage.nav.label')}
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h4 className="text-[10px] font-mono text-brand-dark uppercase tracking-widest font-semibold">
              {t('ui.app.ce65e2cf6b')}
            </h4>
            <ul className="space-y-1.5 text-xs text-brand-slate font-normal md:font-light">
              <li>
                Email:{' '}
                <a
                  href={`mailto:${contactSettings?.email || 'info@navykus.org'}`}
                  className="hover:text-[#bc4638] transition-colors"
                >
                  {contactSettings?.email || 'info@navykus.org'}
                </a>
              </li>
              <li>
                Telegram:{' '}
                <a
                  href={`https://t.me/${(contactSettings?.telegram || '@navykus_com').replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#bc4638] transition-colors"
                >
                  {contactSettings?.telegram || '@navykus_com'}
                </a>
              </li>
              <li>
                {t('ui.app.ed16b5adfc')}
                <span className="text-brand-dark/80">{contactSettings?.phone || '+7 (999) 000-00-00'}</span>
              </li>
              {contactSettings?.address && (
                <li className="text-brand-dark/80">{contactSettings.address}</li>
              )}
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-4 text-[11px] text-brand-slate/80 font-normal md:font-light">
            <span>{t('ui.app.copyright')}</span>
            <a href={t('ui.app.a5307558')} className="hover:text-[#bc4638] transition-colors">
              {t('ui.app.9e059272f1')}
            </a>
            <a href={t('ui.app.4d9e7853')} className="hover:text-[#bc4638] transition-colors">
              {t('ui.app.3a86197ba3')}
            </a>
          </div>
          <a
            href="https://dioxoid.com"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-mono tracking-[0.15em] text-[#5b6472] opacity-40 lowercase cursor-pointer"
          >
            {t('ui.app.madeBy')}
          </a>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
