import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { TeamApplicationContext } from '../types';
import TeamMemberApplicationForm from './TeamMemberApplicationForm';

const PARTICIPATION_MODAL_SOURCE_TYPES: Array<TeamApplicationContext['sourceType']> = [
  'championship',
  'event',
  'opportunity',
  'activities',
  'about',
  'home',
];

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: TeamApplicationContext;
}

export default function ApplicationModal({ isOpen, onClose, context }: ApplicationModalProps) {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const isParticipationModal = Boolean(context?.sourceType && PARTICIPATION_MODAL_SOURCE_TYPES.includes(context.sourceType));

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.setTimeout(() => {
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      firstFocusable?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !modalRef.current) return;
      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
      ).filter((element) => !element.hasAttribute('disabled'));

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="modal-portal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            id="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-dark/20 backdrop-blur-md"
          />

          <motion.div
            ref={modalRef}
            id="modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-modal-title"
            className="relative z-10 max-h-[calc(100vh-2rem)] w-[96%] max-w-3xl overflow-y-auto rounded-3xl border border-white/60 bg-white/35 p-4 shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.45),0_40px_120px_rgba(27,24,22,0.12)] backdrop-blur-3xl sm:w-full sm:p-6 lg:p-7"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-20 rounded-full p-2 text-brand-dark transition-colors duration-200 hover:bg-brand-bg-3/50 sm:right-5 sm:top-5"
              aria-label={t('ui.applicationmodal.877618185f')}
            >
              <X className="h-5 w-5" />
            </button>
            {isParticipationModal ? (
              <div className="space-y-8">
                <div className="text-center space-y-2 pb-5">
                  <h2 id="application-modal-title" className="text-2xl sm:text-3xl font-serif text-brand-dark">
                    {t('ui.championshippage.795d6a19a2')}
                  </h2>
                  <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed max-w-md mx-auto">
                    {t('ui.championshippage.5788077ace')}
                  </p>
                </div>
                <TeamMemberApplicationForm compact context={context} />
              </div>
            ) : (
              <TeamMemberApplicationForm context={context} titleId="application-modal-title" />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
