import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { fetchOperatorSettings, type OperatorSettingsData } from '../api';

interface PrivacyPolicyPageProps {
  onBackToHome: () => void;
}

interface PolicySection {
  title: string;
  subs: Array<{
    h: string;
    blocks: string[];
  }>;
}

type ParsedBlock =
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'table'; head: string[]; rows: string[][] };

const cardEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: cardEase },
};

const staggerContainer = {
  initial: 'hidden',
  animate: 'visible',
  variants: {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.03, delayChildren: 0.05 },
    },
  },
};

const staggerItem = {
  variants: {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: cardEase },
    },
  },
};

const sectionClass =
  'bg-white/70 border border-[#d8d1cc] rounded-2xl p-5 sm:p-7 lg:p-8 space-y-4';

const subheadingClass =
  'text-sm sm:text-base font-serif font-semibold tracking-tight text-brand-dark';

const bodyClass =
  'text-sm text-brand-slate leading-relaxed';

const listClass =
  'list-disc pl-5 space-y-1.5 text-sm text-brand-slate leading-relaxed';

const codeClass =
  'px-1.5 py-0.5 rounded bg-white/70 border border-[#d8d1cc] font-mono text-[12px] text-brand-dark';

const inlineMarkupRegex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
const placeholderRegex = /\{\{(\w+)\}\}/g;

const renderInline = (text: string): React.ReactNode[] =>
  text.split(inlineMarkupRegex).map((part, index) => {
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={index} className={codeClass}>{part.slice(1, -1)}</code>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });

const parseBlock = (block: string): ParsedBlock => {
  if (block.startsWith('list|')) {
    return { type: 'list', items: block.slice(5).split('\n') };
  }
  if (block.startsWith('table|')) {
    const rows = block.slice(6).split('|').map((row) => row.split(';'));
    return { type: 'table', head: rows[0] || [], rows: rows.slice(1) };
  }
  return { type: 'p', text: block.startsWith('p|') ? block.slice(2) : block };
};

const SITE_URL_FALLBACK = 'https://navykus.tech';
const CONTACT_EMAIL_FALLBACK = 'info@navykus.tech';

const buildPlaceholderValues = (
  t: (key: string) => string,
  settings: OperatorSettingsData | null,
): Record<string, string> => ({
  siteUrl: typeof window !== 'undefined' ? window.location.origin : SITE_URL_FALLBACK,
  lastUpdated: t('privacypolicy.lastUpdatedDate'),
  operatorName: settings?.operatorName || '—',
  operatorInn: settings?.operatorInn || '—',
  operatorOgrnip: settings?.operatorOgrn || '—',
  operatorAddress: settings?.operatorAddress || '—',
  operatorRegistryNumber: settings?.operatorRegistryNumber || '—',
  operatorRegistryDate: settings?.operatorRegistryDate || '—',
  contactsEmail: settings?.contactsEmail || CONTACT_EMAIL_FALLBACK,
  contactsPostalAddress: settings?.contactsPostalAddress || '—',
});

const substitute = (text: string, values: Record<string, string>): string =>
  text.replace(placeholderRegex, (match, key: string) => values[key] ?? match);

function BlockView({ block, values }: { block: string; values: Record<string, string> }) {
  const parsed = parseBlock(block);
  if (parsed.type === 'list') {
    return (
      <ul className={listClass}>
        {parsed.items.map((item, index) => (
          <li key={index}>{renderInline(substitute(item, values))}</li>
        ))}
      </ul>
    );
  }
  if (parsed.type === 'table') {
    return (
      <div className="overflow-x-auto rounded-xl border border-[#d8d1cc] bg-white/40">
        <table className="w-full min-w-[520px] border-collapse text-left text-xs sm:text-sm">
          <thead>
            <tr className="bg-[#bc4638]/8 text-brand-dark">
              {parsed.head.map((cell, index) => (
                <th key={index} className="px-3 py-2.5 font-serif font-semibold tracking-tight border-b border-[#d8d1cc]">
                  {renderInline(substitute(cell, values))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parsed.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="odd:bg-white/30">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-2.5 align-top border-b border-[#e8e2dc] text-brand-slate">
                    {renderInline(substitute(cell, values))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return <p className={bodyClass}>{renderInline(substitute(parsed.text, values))}</p>;
}

export default function PrivacyPolicyPage({ onBackToHome }: PrivacyPolicyPageProps) {
  const { t } = useTranslation();
  const [operatorSettings, setOperatorSettings] = useState<OperatorSettingsData | null>(null);

  useEffect(() => {
    fetchOperatorSettings().then((data) => {
      if (data) setOperatorSettings(data);
    });
  }, []);

  const values = buildPlaceholderValues(t, operatorSettings);
  const sections = t('privacypolicy.sections', { returnObjects: true }) as unknown as PolicySection[];

  return (
    <main className="relative z-10 pb-20 pt-32 md:pb-28 md:pt-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 space-y-6">
        <motion.header {...fadeUp} className="space-y-2">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-brand-terracotta">
            {t('privacypolicy.eyebrow')}
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-light tracking-tight text-brand-dark leading-tight">
            {t('privacypolicy.title')}
          </h1>
          <p className="text-[11px] font-mono text-brand-slate/60 tracking-wider pt-1">
            {substitute(t('privacypolicy.lastUpdatedLabel'), values)}
          </p>
        </motion.header>

        <motion.div {...staggerContainer} className="space-y-6">
          {Array.isArray(sections) && sections.map((section, sectionIndex) => (
            <motion.section
              key={sectionIndex}
              {...staggerItem}
              className={sectionClass}
              aria-labelledby={`privacy-section-${sectionIndex}`}
            >
              <h2 id={`privacy-section-${sectionIndex}`} className="text-base sm:text-lg font-serif font-semibold tracking-tight text-brand-dark">
                {renderInline(substitute(section.title, values))}
              </h2>
              <div className="space-y-4">
                {(section.subs || []).map((sub, subIndex) => (
                  <div key={subIndex} className="space-y-2.5">
                    {sub.h && (
                      <h3 className={subheadingClass}>{renderInline(substitute(sub.h, values))}</h3>
                    )}
                    <div className="space-y-3">
                      {(sub.blocks || []).map((block, blockIndex) => (
                        <BlockView key={blockIndex} block={block} values={values} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          ))}
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.4, ease: cardEase, delay: 0.15 }}
          className="text-center pt-2"
        >
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white rounded-xl text-xs font-mono tracking-widest uppercase font-semibold shadow-lg shadow-[#bc4638]/15 hover:scale-[1.01] transition-all cursor-pointer"
          >
            <span>{t('ui.legalpage.backHome')}</span>
          </button>
        </motion.div>
      </div>
    </main>
  );
}