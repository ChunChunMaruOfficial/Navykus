import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ArrowRight, ShieldCheck, Ticket as TicketIcon } from 'lucide-react';
import { Tournament, ApplicationForm, Ticket } from '../types';
import { TOURNAMENTS } from '../data';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTournamentId?: string;
}

export default function ApplicationModal({ isOpen, onClose, selectedTournamentId }: ApplicationModalProps) {
  const [form, setForm] = useState<ApplicationForm>({
    name: '',
    email: '',
    grade: '10 класс',
    city: '',
    interest: 'Разработка проектов',
    tournamentId: selectedTournamentId || ''
  });

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state if selected tournament changes from outside
  React.useEffect(() => {
    if (selectedTournamentId) {
      setForm((f) => ({ ...f, tournamentId: selectedTournamentId }));
    }
  }, [selectedTournamentId]);

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
      grade: '10 класс',
      city: '',
      interest: 'Разработка проектов',
      tournamentId: ''
    });
    setTicket(null);
  };

  const calculateProgress = () => {
    let score = 0;
    // Name field: gradual up to 33% based on length
    if (form.name.trim().length > 0) {
      score += Math.min(form.name.trim().length / 6, 1) * 33;
    }
    // Email field: 15% for typing, 33% if valid
    if (form.email.trim().length > 0) {
      if (form.email.includes('@') && form.email.includes('.')) {
        score += 33;
      } else {
        score += 15;
      }
    }
    // City field: gradual up to 34% based on length
    if (form.city.trim().length > 0) {
      score += Math.min(form.city.trim().length / 3, 1) * 34;
    }
    return Math.min(Math.round(score), 100);
  };

  const progress = calculateProgress();

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
            id="modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-[92%] sm:w-full max-w-xl bg-white/35 backdrop-blur-3xl border border-white/60 rounded-3xl shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.45),0_40px_120px_rgba(27,24,22,0.12)] max-h-[calc(100vh-2rem)] overflow-y-auto z-10"
          >
            {/* Top design line accent - Animated progress bar */}
            <div className="h-1.5 w-full bg-white/20 relative overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-brand-rose-deep via-brand-coral to-brand-terracotta"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 60, damping: 15 }}
              />
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full hover:bg-brand-bg-3/50 text-brand-dark transition-colors duration-200 z-20"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-4 sm:p-8 lg:p-10">
              {!ticket ? (
                /* Application Form */
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div>
                    <span className="text-[9px] sm:text-[10px] font-mono tracking-widest text-brand-rose-deep/80 block mb-1">
                      REGISTRATION FORM
                    </span>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif text-brand-dark tracking-tight">
                      Подать заявку на участие
                    </h2>
                    <p className="text-xs sm:text-sm text-brand-slate mt-1 font-light">
                      Заполните форму, чтобы присоединиться к международной платформе «Навыкус». Мы свяжемся с вами в течение 24 часов.
                    </p>
                  </div>

                  {/* Input fields */}
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-[10px] sm:text-xs font-mono tracking-wider text-brand-dark/70 mb-1 uppercase">
                        ФИО школьника
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Константин Константинопольский"
                        className="w-full bg-white/25 hover:bg-white/45 focus:bg-white/70 backdrop-blur-md border border-white/40 focus:border-brand-terracotta rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-brand-dark outline-none transition-all duration-300 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4)]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-[10px] sm:text-xs font-mono tracking-wider text-brand-dark/70 mb-1 uppercase">
                          Электронная почта
                        </label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="name@example.com"
                          className="w-full bg-white/25 hover:bg-white/45 focus:bg-white/70 backdrop-blur-md border border-white/40 focus:border-brand-terracotta rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-brand-dark outline-none transition-all duration-300 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4)]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] sm:text-xs font-mono tracking-wider text-brand-dark/70 mb-1 uppercase">
                          Город проживания
                        </label>
                        <input
                          type="text"
                          required
                          value={form.city}
                          onChange={(e) => setForm({ ...form, city: e.target.value })}
                          placeholder="Москва"
                          className="w-full bg-white/25 hover:bg-white/45 focus:bg-white/70 backdrop-blur-md border border-white/40 focus:border-brand-terracotta rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-brand-dark outline-none transition-all duration-300 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4)]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-[10px] sm:text-xs font-mono tracking-wider text-brand-dark/70 mb-1 uppercase">
                          Класс обучения
                        </label>
                        <select
                          value={form.grade}
                          onChange={(e) => setForm({ ...form, grade: e.target.value })}
                          className="w-full bg-white/25 hover:bg-white/45 focus:bg-white/70 backdrop-blur-md border border-white/40 focus:border-brand-terracotta rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-brand-dark outline-none transition-all duration-300 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4)]"
                        >
                          <option className="bg-brand-bg-2 text-brand-dark">8 класс</option>
                          <option className="bg-brand-bg-2 text-brand-dark">9 класс</option>
                          <option className="bg-brand-bg-2 text-brand-dark">10 класс</option>
                          <option className="bg-brand-bg-2 text-brand-dark">11 класс</option>
                          <option className="bg-brand-bg-2 text-brand-dark">Студент колледжа</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] sm:text-xs font-mono tracking-wider text-brand-dark/70 mb-1 uppercase">
                          Главное направление
                        </label>
                        <select
                          value={form.interest}
                          onChange={(e) => setForm({ ...form, interest: e.target.value })}
                          className="w-full bg-white/25 hover:bg-white/45 focus:bg-white/70 backdrop-blur-md border border-white/40 focus:border-brand-terracotta rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-brand-dark outline-none transition-all duration-300 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4)]"
                        >
                          <option className="bg-brand-bg-2 text-brand-dark">Разработка проектов</option>
                          <option className="bg-brand-bg-2 text-brand-dark">Решение кейсов</option>
                          <option className="bg-brand-bg-2 text-brand-dark">Дипломатия и дебаты</option>
                          <option className="bg-brand-bg-2 text-brand-dark">Научные исследования</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] sm:text-xs font-mono tracking-wider text-brand-dark/70 mb-1 uppercase">
                        Выбрать программу / мероприятие
                      </label>
                      <select
                        value={form.tournamentId}
                        onChange={(e) => setForm({ ...form, tournamentId: e.target.value })}
                        className="w-full bg-white/25 hover:bg-white/45 focus:bg-white/70 backdrop-blur-md border border-white/40 focus:border-brand-terracotta rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-brand-dark outline-none transition-all duration-300 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4)]"
                      >
                        <option value="" className="bg-brand-bg-2 text-brand-dark">Общая заявка в сообщество</option>
                        {TOURNAMENTS.map((t) => (
                          <option key={t.id} value={t.id} className="bg-brand-bg-2 text-brand-dark">
                            {t.title} ({t.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Submission actions */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs text-brand-slate">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Данные передаются по шифрованному каналу</span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="relative bg-brand-terracotta hover:bg-brand-terracotta/95 text-white text-sm font-medium px-6 py-3 rounded-xl transition-all duration-300 shadow-lg shadow-brand-terracotta/20 hover:shadow-brand-terracotta/35 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Проверка...</span>
                        </>
                      ) : (
                        <>
                          <span>Отправить заявку</span>
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
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mb-4 border border-emerald-100">
                      <Check className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-serif text-brand-dark tracking-tight">
                      Заявка успешно принята!
                    </h2>
                    <p className="text-sm text-brand-slate mt-1.5 max-w-sm mx-auto">
                      Вы были зарегистрированы. Ваша цифровая смарт-карта Navykus Pass сгенерирована ниже.
                    </p>
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
                          NAVYKUS MEMBER PASS
                        </div>
                        <div className="text-[10px] font-mono text-brand-slate mt-0.5">
                          SECURE SYSTEM REGISTRY
                        </div>
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
                        <div className="text-[10px] font-mono text-brand-slate uppercase">Владелец</div>
                        <div className="font-medium text-brand-dark mt-0.5 font-sans truncate pr-2">
                          {ticket.userName}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-brand-slate uppercase">EMAIL</div>
                        <div className="font-medium text-brand-dark mt-0.5 font-sans truncate">
                          {ticket.email}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-brand-slate uppercase">ДАТА РЕГИСТРАЦИИ</div>
                        <div className="font-medium text-brand-dark mt-0.5 font-sans">
                          {ticket.date}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-brand-slate uppercase">КООРДИНАТЫ СВЯЗИ</div>
                        <div className="font-mono text-brand-rose-deep font-semibold mt-0.5">
                          {ticket.coordinate}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-[10px] font-mono text-brand-slate uppercase">ВЫБРАННАЯ ПРОГРАММА</div>
                        <div className="font-medium text-brand-terracotta mt-0.5 font-sans">
                          {form.tournamentId 
                            ? TOURNAMENTS.find(t => t.id === form.tournamentId)?.title 
                            : 'Общая программа развития & Нетворкинг'}
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
                        <span className="text-[9px] font-mono text-brand-slate block">VERIFICATION PASS</span>
                        <span className="text-[10px] font-semibold text-emerald-600 block">STATUS: CONFIRMED</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={handleReset}
                      className="flex-1 bg-brand-bg-2 hover:bg-brand-bg-3 border border-brand-pink-dust/30 text-brand-dark text-xs font-medium py-3 rounded-xl transition-all duration-200 cursor-pointer text-center"
                    >
                      Оформить еще одну
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 bg-brand-dark hover:bg-brand-dark/95 text-white text-xs font-medium py-3 rounded-xl transition-all duration-200 cursor-pointer text-center"
                    >
                      Закрыть окно
                    </button>
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
