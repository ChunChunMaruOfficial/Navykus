import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie, X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'navykus.cookieConsent';

export default function CookieConsent() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'dismissed');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] sm:w-auto sm:max-w-lg z-50"
        >
          <div className="relative bg-white/80 backdrop-blur-2xl border border-white/70 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.08),0_8px_24px_rgba(189,91,130,0.06)] p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="hidden sm:flex w-8 h-8 rounded-xl bg-gradient-to-br from-[#bc4638]/8 to-[#bd5b82]/8 border border-[#bc4638]/10 items-center justify-center flex-shrink-0 mt-0.5">
                <Cookie className="w-4 h-4 text-brand-terracotta" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-brand-dark font-medium leading-relaxed">
                  {t('ui.cookieconsent.message')}
                </p>
                <p className="text-[10px] sm:text-[11px] text-brand-slate/70 mt-1 leading-relaxed">
                  {t('ui.cookieconsent.description')}{' '}
                  <a href="/privacy" className="text-brand-terracotta underline underline-offset-2 hover:text-brand-dark">
                    {t('ui.cookieconsent.policyLink')}
                  </a>
                </p>
              </div>
              <button
                onClick={dismiss}
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-brand-slate/40 hover:text-brand-dark hover:bg-white/60 transition-all cursor-pointer"
                aria-label={t('ui.cookieconsent.close')}
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
