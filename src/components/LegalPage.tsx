import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { fetchOperatorSettings, type OperatorSettingsData } from '../api';

interface LegalPageProps {
  page: 'privacy' | 'terms';
  onBackToHome: () => void;
}

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
      transition: { staggerChildren: 0.04, delayChildren: 0.05 },
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
  'bg-white/70 border border-[#d8d1cc] rounded-2xl p-5 sm:p-7 lg:p-8 space-y-3';

const headingClass =
  'text-base sm:text-lg font-serif font-semibold tracking-tight text-brand-dark';

const bodyClass =
  'text-sm text-brand-slate leading-relaxed';

const listClass =
  'list-disc pl-5 space-y-1.5 text-sm text-brand-slate leading-relaxed';

const linkClass =
  'text-brand-terracotta hover:text-brand-dark underline underline-offset-2 decoration-brand-terracotta/30 hover:decoration-brand-dark/50 transition-colors';

export default function LegalPage({ page, onBackToHome }: LegalPageProps) {
  const { t, i18n } = useTranslation();
  const [operatorSettings, setOperatorSettings] = useState<OperatorSettingsData | null>(null);

  useEffect(() => {
    fetchOperatorSettings().then((data) => {
      if (data) setOperatorSettings(data);
    });
  }, []);

  const isPrivacy = page === 'privacy';

  const sections = isPrivacy
    ? [
        {
          title: t('ui.legalpage.operatorTitle'),
          content: (
            <ul className={listClass}>
              <li>
                <strong>{t('ui.legalpage.operatorName').split(':')[0]}:</strong>{' '}
                {operatorSettings?.operatorName || t('ui.legalpage.operatorName').split(':').slice(1).join(':').trim() || t('ui.legalpage.operatorName')}
              </li>
              <li>
                <strong>{t('ui.legalpage.operatorInn').split(':')[0]}:</strong>{' '}
                {operatorSettings?.operatorInn || t('ui.legalpage.operatorInn').split(':').slice(1).join(':').trim() || t('ui.legalpage.operatorInn')}
              </li>
              <li>
                <strong>{t('ui.legalpage.operatorOgrn').split(':')[0]}:</strong>{' '}
                {operatorSettings?.operatorOgrn || t('ui.legalpage.operatorOgrn').split(':').slice(1).join(':').trim() || t('ui.legalpage.operatorOgrn')}
              </li>
              <li>
                <strong>{t('ui.legalpage.operatorAddress').split(':')[0]}:</strong>{' '}
                {operatorSettings?.operatorAddress || t('ui.legalpage.operatorAddress').split(':').slice(1).join(':').trim() || t('ui.legalpage.operatorAddress')}
              </li>
              <li>{t('ui.legalpage.operatorRkn')}</li>
              {operatorSettings?.operatorRegistryNumber && (
                <li>
                  <strong>{i18n.language?.startsWith('ru') ? 'Реестр Роскомнадзора' : 'RKN Registry entry'}:</strong>{' '}
                  {operatorSettings.operatorRegistryNumber}
                  {operatorSettings.operatorRegistryDate ? ` (${operatorSettings.operatorRegistryDate})` : ''}
                </li>
              )}
            </ul>
          ),
        },
        {
          title: t('ui.legalpage.registryInfoTitle'),
          content: <p className={bodyClass}>{t('ui.legalpage.registryInfoText')}</p>,
        },
        {
          title: t('ui.legalpage.dataCollected'),
          content: (
            <ul className={listClass}>
              <li>{t('ui.legalpage.dataName')}</li>
              <li>{t('ui.legalpage.dataEmail')}</li>
              <li>{t('ui.legalpage.dataAge')}</li>
              <li>{t('ui.legalpage.dataLocation')}</li>
              <li>{t('ui.legalpage.dataSkills')}</li>
              <li>{t('ui.legalpage.dataInterests')}</li>
              <li>{t('ui.legalpage.dataLinks')}</li>
              <li>{t('ui.legalpage.dataFiles')}</li>
              <li>{t('ui.legalpage.dataTech')}</li>
            </ul>
          ),
        },
        {
          title: t('ui.legalpage.purposesTitle'),
          content: (
            <>
              <ul className={listClass}>
                <li>{t('ui.legalpage.purposeRegistration')}</li>
                <li>{t('ui.legalpage.purposeNotifications')}</li>
                <li>{t('ui.legalpage.purposeTeam')}</li>
                <li>{t('ui.legalpage.purposeAdmin')}</li>
              </ul>
              <p className={bodyClass}>{t('ui.legalpage.purposesComplianceText')}</p>
            </>
          ),
        },
        {
          title: t('ui.legalpage.processingActionsTitle'),
          content: <p className={bodyClass}>{t('ui.legalpage.processingActionsText')}</p>,
        },
        {
          title: t('ui.legalpage.legalBasisTitle'),
          content: <p className={bodyClass}>{t('ui.legalpage.legalBasisText')}</p>,
        },
        {
          title: t('ui.legalpage.consentTitle'),
          content: (
            <>
              <p className={`mb-2 ${bodyClass}`}>{t('ui.legalpage.consentAdultText')}</p>
              <p className={`mb-2 ${bodyClass}`}>{t('ui.legalpage.consent1418Text')}</p>
              <p className={bodyClass}>{t('ui.legalpage.consentUnder14Text')}</p>
            </>
          ),
        },
        {
          title: t('ui.legalpage.thirdPartyTitle'),
          content: <p className={bodyClass}>{t('ui.legalpage.thirdPartyText')}</p>,
        },
        {
          title: t('ui.legalpage.crossBorderTitle'),
          content: <p className={bodyClass}>{t('ui.legalpage.crossBorderText')}</p>,
        },
        {
          title: t('ui.legalpage.dbLocationTitle'),
          content: <p className={bodyClass}>{t('ui.legalpage.dbLocationText')}</p>,
        },
        {
          title: t('ui.legalpage.storageTitle'),
          content: (
            <>
              <p className={`mb-2 ${bodyClass}`}>{t('ui.legalpage.storageText')}</p>
              <p className={bodyClass}>{t('ui.legalpage.storagePeriodText')}</p>
            </>
          ),
        },
        {
          title: t('ui.legalpage.securityMeasuresTitle'),
          content: <p className={bodyClass}>{t('ui.legalpage.securityMeasuresText')}</p>,
        },
        {
          title: t('ui.legalpage.withdrawTitle'),
          content: <p className={bodyClass}>{t('ui.legalpage.withdrawText')}</p>,
        },
        {
          title: t('ui.legalpage.rightsTitle'),
          content: (
            <ul className={listClass}>
              <li>{t('ui.legalpage.rightAccess')}</li>
              <li>{t('ui.legalpage.rightRectify')}</li>
              <li>{t('ui.legalpage.rightDelete')}</li>
              <li>{t('ui.legalpage.rightRestrict')}</li>
              <li>{t('ui.legalpage.rightPort')}</li>
              <li>{t('ui.legalpage.rightWithdraw')}</li>
              <li>{t('ui.legalpage.rightComplain')}</li>
            </ul>
          ),
        },
        {
          title: t('ui.legalpage.contactsTitle'),
          content: (
            <div className={`space-y-2 ${bodyClass}`}>
              <p>{t('ui.legalpage.contactsText')}</p>
              <p>
                <strong>{t('ui.legalpage.contactsOperatorLabel')}</strong>{' '}
                {operatorSettings?.operatorName || t('ui.legalpage.operatorName')}
              </p>
              <p>
                <strong>{t('ui.legalpage.contactsEmailLabel')}</strong>{' '}
                <a href={`mailto:${operatorSettings?.contactsEmail || 'info@navykus.online'}`} className={linkClass}>
                  {operatorSettings?.contactsEmail || 'info@navykus.online'}
                </a>
              </p>
              <p>
                <strong>{t('ui.legalpage.contactsPostalLabel')}</strong>{' '}
                {operatorSettings?.contactsPostalAddress || t('ui.legalpage.contactsPostalValue')}.
              </p>
              <p>
                <strong>{t('ui.legalpage.contactsRknLabel')}</strong>{' '}
                {t('ui.legalpage.contactsRknValue')}
              </p>
              <p className="pt-1">{t('ui.legalpage.contactsResponse')}</p>
            </div>
          ),
        },
      ]
    : [
        {
          title: t('ui.legalpage.termsGeneralTitle'),
          content: <p className={bodyClass}>{t('ui.legalpage.termsGeneralText')}</p>,
        },
        {
          title: t('ui.legalpage.termsRegistrationTitle'),
          content: <p className={bodyClass}>{t('ui.legalpage.termsRegistrationText')}</p>,
        },
        {
          title: t('ui.legalpage.termsUseTitle'),
          content: (
            <ul className={listClass}>
              <li>{t('ui.legalpage.termsUseFair')}</li>
              <li>{t('ui.legalpage.termsUseNoHarm')}</li>
              <li>{t('ui.legalpage.termsUseContent')}</li>
            </ul>
          ),
        },
        {
          title: t('ui.legalpage.termsIPTitle'),
          content: <p className={bodyClass}>{t('ui.legalpage.termsIPText')}</p>,
        },
        {
          title: t('ui.legalpage.termsDisclaimerTitle'),
          content: <p className={bodyClass}>{t('ui.legalpage.termsDisclaimerText')}</p>,
        },
        {
          title: t('ui.legalpage.termsAcceptTitle'),
          content: <p className={bodyClass}>{t('ui.legalpage.termsAcceptText')}</p>,
        },
      ];

  return (
    <main className="relative z-10 pb-20 pt-32 md:pb-28 md:pt-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 space-y-6">
        {/* Header */}
        <motion.header {...fadeUp} className="space-y-2">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-brand-terracotta">
            {isPrivacy ? t('ui.legalpage.privacyEyebrow') : t('ui.legalpage.termsEyebrow')}
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-light tracking-tight text-brand-dark leading-tight">
            {isPrivacy ? t('ui.legalpage.privacyTitle') : t('ui.legalpage.termsTitle')}
          </h1>
          <p className="text-sm text-brand-slate font-light leading-relaxed max-w-3xl">
            {isPrivacy ? t('ui.legalpage.privacySubtitle') : t('ui.legalpage.termsSubtitle')}
          </p>
          <p className="text-[11px] font-mono text-brand-slate/60 tracking-wider pt-1">
            {t('ui.legalpage.lastUpdated')}
          </p>
        </motion.header>

        {/* Sections */}
        <motion.div {...staggerContainer} className="space-y-4">
          {sections.map((section, idx) => (
            <motion.section
              key={idx}
              {...staggerItem}
              className={sectionClass}
              aria-labelledby={`legal-section-${idx}`}
            >
              <h2 id={`legal-section-${idx}`} className={headingClass}>
                {section.title}
              </h2>
              <div className={bodyClass}>{section.content}</div>
            </motion.section>
          ))}
        </motion.div>

        {/* Footer note */}
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
