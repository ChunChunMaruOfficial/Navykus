import { useEffect, useState, type ReactNode } from 'react';
import i18n from '../i18n';

interface I18nGateProps {
  children: ReactNode;
}

export function I18nGate({ children }: I18nGateProps) {
  const currentLang = (i18n.resolvedLanguage || i18n.language || 'ru').split('-')[0];

  const [ready, setReady] = useState(
    () => i18n.isInitialized && i18n.hasResourceBundle(currentLang, 'translation'),
  );

  useEffect(() => {
    if (ready) return;

    const lang = (i18n.resolvedLanguage || i18n.language || 'ru').split('-')[0];

    // Check if already initialized (race between render and effect)
    if (i18n.isInitialized && i18n.hasResourceBundle(lang, 'translation')) {
      setReady(true);
      return;
    }

    const onInitialized = () => {
      setReady(true);
    };

    i18n.on('initialized', onInitialized);

    // Safety net — show content after 3 seconds even if loading fails
    const timeout = setTimeout(() => {
      setReady(true);
    }, 3000);

    return () => {
      i18n.off('initialized', onInitialized);
      clearTimeout(timeout);
    };
  }, [ready]);

  return (
    <div
      className="i18n-gate"
      style={{
        opacity: ready ? 1 : 0,
        pointerEvents: ready ? 'auto' : 'none' as const,
        transition: 'opacity 0.2s ease-in',
      }}
    >
      {children}
    </div>
  );
}
