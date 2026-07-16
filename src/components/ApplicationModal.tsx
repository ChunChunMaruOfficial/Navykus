import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ArrowRight, Ticket as TicketIcon, Upload } from 'lucide-react';
import { Tournament, ApplicationForm, Ticket } from '../types';
import { useLocalizedData } from '../i18n/useLocalizedData';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTournamentId?: string;
}

const APPLICATION_FIELD_CLASS =
  'w-full rounded-xl border border-[#d8d1cc] bg-white/70 px-3 py-2 text-xs text-brand-dark outline-none transition-colors placeholder:text-brand-slate/40 focus:border-brand-dark/45 focus:bg-white sm:px-4 sm:py-2.5 sm:text-sm';

const APPLICATION_UPLOAD_CLASS =
  'group relative flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-[#d8d1cc] bg-white/70 px-4 py-3.5 transition-colors hover:bg-white focus-within:border-brand-dark/45 focus-within:bg-white';

export default function ApplicationModal({ isOpen, onClose, selectedTournamentId }: ApplicationModalProps) {
  const { t } = useTranslation();
  const { tournaments } = useLocalizedData();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [form, setForm] = useState<ApplicationForm>({
    name: '',
    email: '',
    grade: 'grade10',
    city: '',
    interest: 'projects',
    tournamentId: selectedTournamentId || '',
    projectFile: null
  });

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileError, setFileError] = useState('');

  // Sync state if selected tournament changes from outside
  React.useEffect(() => {
    if (selectedTournamentId) {
      setForm((f) => ({ ...f, tournamentId: selectedTournamentId }));
    }
  }, [selectedTournamentId]);

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

  const handleFileChange = (file?: File) => {
    setFileError('');
    if (!file) {
      setForm({ ...form, projectFile: null });
      return;
    }

    const allowedTypes = new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp',
    ]);
    const maxSize = 10 * 1024 * 1024;

    if (!allowedTypes.has(file.type)) {
      setFileError(t('ui.enhancements.fileTypeError'));
      setForm({ ...form, projectFile: null });
      return;
    }

    if (file.size > maxSize) {
      setFileError(t('ui.enhancements.fileSizeError'));
      setForm({ ...form, projectFile: null });
      return;
    }

    setForm({ ...form, projectFile: file });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.city) {
      return;
    }

    setIsSubmitting(true);

    // Simulate luxury-grade processing
    setTimeout(() => {
      const generatedId = `NVK-${Math.floor(10000 + Math.random() * 90000)}-${form.city.substring(0, 3).toUpperCase()}`;
      setTicket({
        ticketId: generatedId,
        userName: form.name,
        email: form.email,
        date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
        coordinate: '55.7558° N, 37.6173° E',
        status: 'confirmed'
      });
      setIsSubmitting(false);
    }, 1200);
  };

  const handleReset = () => {
    setForm({
      name: '',
      email: '',
      grade: 'grade10',
      city: '',
      interest: 'projects',
      tournamentId: ''
    });
    setTicket(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="modal-portal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Blur Overlay */}
          <motion.div
            id="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-dark/20 backdrop-blur-md"
          />

          {/* Modal Container */}
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
            className="relative max-h-[calc(100vh-2rem)] w-[96%] overflow-hidden sm:w-full max-w-2xl bg-white/35 backdrop-blur-3xl border border-white/60 rounded-3xl shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.45),0_40px_120px_rgba(27,24,22,0.12)] z-10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full hover:bg-brand-bg-3/50 text-brand-dark transition-colors duration-200 z-20"
              aria-label={t('ui.applicationmodal.877618185f')}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-4 sm:p-6 lg:p-7">
              {!ticket ? (
                /* Application Form */
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <div>
                    <h2 id="application-modal-title" className="text-xl sm:text-2xl font-serif text-brand-dark tracking-tight">{t('ui.applicationmodal.6b0f724b4e')}</h2>
                    <p className="text-xs sm:text-sm text-brand-slate mt-1 font-light">{t('ui.applicationmodal.21117adc83')}</p>
                  </div>

                  {/* Input fields */}
                  <div className="space-y-2.5 sm:space-y-3">
                    <div>
                      <label className="block text-[10px] sm:text-xs font-mono tracking-wider text-brand-dark/70 mb-1 uppercase">{t('ui.applicationmodal.34fda9e41a')}</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder={t('ui.applicationmodal.bd41d2e3e9')}
                        className={APPLICATION_FIELD_CLASS}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      <div>
                        <label className="block text-[10px] sm:text-xs font-mono tracking-wider text-brand-dark/70 mb-1 uppercase">{t('ui.applicationmodal.eda3ec0b43')}</label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="name@example.com"
                          className={APPLICATION_FIELD_CLASS}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] sm:text-xs font-mono tracking-wider text-brand-dark/70 mb-1 uppercase">{t('ui.applicationmodal.10b4770d7e')}</label>
                        <input
                          type="text"
                          required
                          value={form.city}
                          onChange={(e) => setForm({ ...form, city: e.target.value })}
                          placeholder={t('ui.applicationmodal.ba8d621178')}
                          className={APPLICATION_FIELD_CLASS}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      <div>
                        <label className="block text-[10px] sm:text-xs font-mono tracking-wider text-brand-dark/70 mb-1 uppercase">{t('ui.applicationmodal.478fefafd8')}</label>
                        <select
                          value={form.grade}
                          onChange={(e) => setForm({ ...form, grade: e.target.value })}
                          className={APPLICATION_FIELD_CLASS}
                        >
                          <option value="grade8" className="bg-brand-bg-2 text-brand-dark">{t('ui.applicationmodal.1157b5288a')}</option>
                          <option value="grade9" className="bg-brand-bg-2 text-brand-dark">{t('ui.applicationmodal.336b6070de')}</option>
                          <option value="grade10" className="bg-brand-bg-2 text-brand-dark">{t('ui.applicationmodal.17a8553b30')}</option>
                          <option value="grade11" className="bg-brand-bg-2 text-brand-dark">{t('ui.applicationmodal.55ecebcc56')}</option>
                          <option value="college" className="bg-brand-bg-2 text-brand-dark">{t('ui.applicationmodal.4bd776f65c')}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] sm:text-xs font-mono tracking-wider text-brand-dark/70 mb-1 uppercase">{t('ui.applicationmodal.887bcf29b0')}</label>
                        <select
                          value={form.interest}
                          onChange={(e) => setForm({ ...form, interest: e.target.value })}
                          className={APPLICATION_FIELD_CLASS}
                        >
                          <option value="projects" className="bg-brand-bg-2 text-brand-dark">{t('ui.app.d52e1ae8a0')}</option>
                          <option value="cases" className="bg-brand-bg-2 text-brand-dark">{t('ui.app.852dca4487')}</option>
                          <option value="diplomacy" className="bg-brand-bg-2 text-brand-dark">{t('ui.applicationmodal.8ea51ef768')}</option>
                          <option value="research" className="bg-brand-bg-2 text-brand-dark">{t('ui.app.ac41209943')}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] sm:text-xs font-mono tracking-wider text-brand-dark/70 mb-1 uppercase">{t('ui.applicationmodal.792b92b447')}</label>
                      <select
                        value={form.tournamentId}
                        onChange={(e) => setForm({ ...form, tournamentId: e.target.value })}
                        className={APPLICATION_FIELD_CLASS}
                      >
                        <option value="" className="bg-brand-bg-2 text-brand-dark">{t('ui.applicationmodal.0570fbe337')}</option>
                        {tournaments.map((t) => (
                          <option key={t.id} value={t.id} className="bg-brand-bg-2 text-brand-dark">
                            {t.title} ({t.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* File Upload */}
                    <div>
                      <label className="block text-[10px] sm:text-xs font-mono tracking-wider text-brand-dark/70 mb-1 uppercase">{t('ui.applicationmodal.a1534409f2')}</label>
                      <label className={APPLICATION_UPLOAD_CLASS}>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                          onChange={(e) => handleFileChange(e.target.files?.[0])}
                          className="sr-only"
                        />
                        {form.projectFile ? (
                          <div className="flex items-center gap-3 text-xs text-brand-dark w-full">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#bc4638]/10 to-[#bd5b82]/10 border border-white/60 flex items-center justify-center shrink-0">
                              <Upload className="w-4 h-4 text-brand-rose-deep" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{form.projectFile.name}</div>
                              <div className="text-[10px] text-brand-slate/70 mt-0.5">
                                {(form.projectFile.size / 1024 / 1024).toFixed(2)} {t('ui.applicationmodal.bc84a155')}</div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setForm({ ...form, projectFile: null });
                              }}
                              className="text-brand-slate/50 hover:text-brand-terracotta transition-colors p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#bc4638]/5 to-[#bd5b82]/5 border border-white/60 flex items-center justify-center">
                              <Upload className="w-4 h-4 text-brand-slate/60 group-hover:text-brand-rose-deep transition-colors" />
                            </div>
                            <span className="text-[11px] text-brand-slate/70 group-hover:text-brand-dark transition-colors">{t('ui.applicationmodal.f5717f85ba')}</span>
                            <span className="text-[9px] text-brand-slate/40">{t('ui.applicationmodal.6272f20d22')}</span>
                          </div>
                        )}
                      </label>
                      {fileError && <p className="mt-2 text-xs text-rose-700">{fileError}</p>}
                    </div>
                  </div>

                  {/* Submission actions */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="relative bg-brand-terracotta hover:bg-brand-terracotta/95 text-white text-sm font-medium px-6 py-3 rounded-xl transition-all duration-300 shadow-lg shadow-brand-terracotta/20 hover:shadow-brand-terracotta/35 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>{t('ui.applicationmodal.b55a7aad35')}</span>
                        </>
                      ) : (
                        <>
                          <span>{t('ui.applicationmodal.cf4f1950f8')}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Success Ticket View */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 shrink-0 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <Check className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-serif text-brand-dark tracking-tight">{t('ui.app.0d65b9d27c')}</h2>
                      <p className="text-sm text-brand-slate mt-1.5 max-w-sm">{t('ui.applicationmodal.15cd01515e')}</p>
                    </div>
                  </div>

                  {/* High-End Membership Ticket (Glass Ticket Design) */}
                  <div className="relative border border-white/60 bg-white/15 backdrop-blur-xl p-6 rounded-2xl overflow-hidden shadow-[inset_0_1px_2px_rgba(255,255,255,0.45),0_15px_35px_rgba(189,91,130,0.06)]">
                    {/* Semi-transparent vector badge background */}
                    <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
                      <TicketIcon className="w-64 h-64 text-brand-rose-deep" />
                    </div>

                    {/* Ticket Header */}
                    <div className="flex justify-between items-start border-b border-brand-pink-dust/20 pb-4 mb-4">
                      <div>
                        <div className="text-[13px] font-semibold text-brand-dark tracking-wide font-sans flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-rose-deep animate-pulse" />
                          {t('ui.applicationmodal.4c971178')}</div>
                        <div className="text-[10px] font-mono text-brand-slate mt-0.5">
                          {t('ui.applicationmodal.475f6e55')}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-medium text-brand-dark bg-white/80 border border-brand-pink-dust/30 px-2 py-0.5 rounded">
                          {ticket.ticketId}
                        </div>
                      </div>
                    </div>

                    {/* Ticket Content Grid */}
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs mb-5">
                      <div>
                        <div className="text-[10px] font-mono text-brand-slate uppercase">{t('ui.applicationmodal.87365d384d')}</div>
                        <div className="font-medium text-brand-dark mt-0.5 font-sans truncate pr-2">
                          {ticket.userName}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-brand-slate uppercase">{t('ui.applicationmodal.0d8a17ea')}</div>
                        <div className="font-medium text-brand-dark mt-0.5 font-sans truncate">
                          {ticket.email}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-brand-slate uppercase">{t('ui.applicationmodal.61bd187017')}</div>
                        <div className="font-medium text-brand-dark mt-0.5 font-sans">
                          {ticket.date}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-brand-slate uppercase">{t('ui.applicationmodal.6921c80f30')}</div>
                        <div className="font-mono text-brand-rose-deep font-semibold mt-0.5">
                          {ticket.coordinate}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-[10px] font-mono text-brand-slate uppercase">{t('ui.applicationmodal.1388cd1688')}</div>
                        <div className="font-medium text-brand-terracotta mt-0.5 font-sans">
                          {form.tournamentId 
                            ? tournaments.find(t => t.id === form.tournamentId)?.title
                            : t('ui.applicationmodal.c666439edb')}
                        </div>
                      </div>
                    </div>

                    {/* Ticket Footer (Stripe code + branding) */}
                    <div className="border-t border-brand-pink-dust/20 pt-4 flex items-center justify-between">
                      {/* Stylized CSS Barcode */}
                      <div className="flex items-center gap-0.5 h-7">
                        <div className="w-[1px] h-full bg-brand-dark" />
                        <div className="w-[3px] h-full bg-brand-dark" />
                        <div className="w-[1px] h-full bg-brand-dark" />
                        <div className="w-[2px] h-full bg-brand-dark" />
                        <div className="w-[1px] h-full bg-brand-dark" />
                        <div className="w-[4px] h-full bg-brand-dark" />
                        <div className="w-[1px] h-full bg-brand-dark" />
                        <div className="w-[2px] h-full bg-brand-dark" />
                        <div className="w-[1px] h-full bg-brand-dark" />
                        <div className="w-[3px] h-full bg-brand-dark" />
                        <div className="w-[1px] h-full bg-brand-dark" />
                        <div className="w-[2px] h-full bg-brand-dark" />
                        <div className="w-[1px] h-full bg-brand-dark" />
                        <div className="w-[1px] h-full bg-brand-dark" />
                        <div className="w-[3px] h-full bg-brand-dark" />
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-mono text-brand-slate block">{t('ui.applicationmodal.897d686d')}</span>
                        <span className="text-[10px] font-semibold text-emerald-600 block">{t('ui.applicationmodal.3b11c9a3')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={handleReset}
                      className="flex-1 bg-brand-bg-2 hover:bg-brand-bg-3 border border-brand-pink-dust/30 text-brand-dark text-xs font-medium py-3 rounded-xl transition-all duration-200 cursor-pointer text-center"
                    >{t('ui.applicationmodal.467dd34c6e')}</button>
                    <button
                      onClick={onClose}
                      className="flex-1 bg-brand-dark hover:bg-brand-dark/95 text-white text-xs font-medium py-3 rounded-xl transition-all duration-200 cursor-pointer text-center"
                    >{t('ui.applicationmodal.4b5dbcf3e2')}</button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
