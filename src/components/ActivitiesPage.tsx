import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, ArrowUpRight, Calendar, Clock, Users, Info, ExternalLink, CheckCircle2, Lightbulb, Target, Trophy, Search, X,
  BookOpen, Wrench, Heart, Video, Zap, Users as UsersIcon, Briefcase, ChevronDown, HelpCircle, ArrowDown
} from 'lucide-react';
import {
  fadeUp, fadeUpLarge, fadeInScale, cardStaggerContainer, cardItemFadeUp,
} from '../motion-animations';
import { ActivityItem, ActivityCategory, ActivityStatus } from '../types';
import { ACTIVITIES } from '../data';

type CategoryFilter = ActivityCategory | 'all';

interface ActivitiesPageProps {
  onBackToHome: () => void;
  onNavigateToSection: (sectionId: string) => void;
  onOpenApplyModal: () => void;
}

const CATEGORY_MAP: Record<ActivityCategory, { label: string; icon: React.ReactNode; color: string }> = {
  educational: { label: 'Образовательные', icon: <BookOpen className="w-4 h-4" />, color: 'from-[#bc4638] to-[#d4694f]' },
  project: { label: 'Проектные', icon: <Wrench className="w-4 h-4" />, color: 'from-[#6b8f71] to-[#4a7c5c]' },
  social: { label: 'Социальные', icon: <Heart className="w-4 h-4" />, color: 'from-[#bd5b82] to-[#d47ea8]' },
  'online-meeting': { label: 'Онлайн-встречи', icon: <Video className="w-4 h-4" />, color: 'from-[#3d6b8f] to-[#5a8fb4]' },
  workshop: { label: 'Воркшопы', icon: <Zap className="w-4 h-4" />, color: 'from-[#c9a96e] to-[#dbbf88]' },
  team: { label: 'Для команд', icon: <UsersIcon className="w-4 h-4" />, color: 'from-[#8a6b9d] to-[#a888b8]' },
};

const STATUS_MAP: Record<ActivityStatus, { label: string; color: string; bgColor: string }> = {
  coming: { label: 'Скоро', color: 'text-[#bc4638]', bgColor: 'bg-[#bc4638]/10' },
  ongoing: { label: 'Идёт сейчас', color: 'text-emerald-600', bgColor: 'bg-emerald-500/10' },
  completed: { label: 'Завершено', color: 'text-brand-slate', bgColor: 'bg-brand-slate/10' },
};

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: 'Все активности',
  educational: 'Образовательные',
  project: 'Проектные',
  social: 'Социальные',
  'online-meeting': 'Онлайн-встречи',
  workshop: 'Воркшопы',
  team: 'Для команд',
};

export default function ActivitiesPage({ onBackToHome, onNavigateToSection, onOpenApplyModal }: ActivitiesPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const filteredActivities = useMemo(() => {
    let result = ACTIVITIES;
    if (selectedCategory !== 'all') {
      result = result.filter(a => a.category === selectedCategory);
    }
    return result;
  }, [selectedCategory]);

  const activeActivities = filteredActivities.filter(a => a.status !== 'completed');
  const completedActivities = filteredActivities.filter(a => a.status === 'completed');
  const isExpanded = expandedActivity !== null;

  return (
    <div className="relative w-full text-brand-dark pb-16">
      {/* ===== HERO ===== */}
      <section className="relative z-10 py-16 md:py-24 text-center">
        <div className="max-w-6xl mx-auto px-[6%] md:px-[10%]">
          <motion.button
            onClick={onBackToHome}
            className="group inline-flex items-center gap-2 px-4 py-2 border border-[#d8d1cc]/60 hover:border-brand-dark text-xs font-mono tracking-wider uppercase text-brand-slate hover:text-brand-dark transition-all rounded-xl cursor-pointer bg-white/20 backdrop-blur-sm mb-8 sm:mb-12"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180 transition-transform group-hover:-translate-x-0.5" />
            <span>Вернуться на Главную</span>
          </motion.button>

          <motion.h1
            {...fadeUpLarge}
            className="text-4xl sm:text-5xl md:text-6xl font-serif font-light italic tracking-tight text-brand-dark leading-tight mb-6"
          >
            Активности
          </motion.h1>

          <motion.p
            {...fadeUp}
            className="text-sm sm:text-base md:text-lg text-brand-slate font-normal md:font-light leading-relaxed max-w-2xl mx-auto mb-8"
          >
            Здесь собраны образовательные, социальные и проектные возможности проекта Навыкус. Выбирайте формат, который подходит именно вам — и делайте первый шаг.
          </motion.p>

          <motion.div
            {...fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => {
                const el = document.getElementById('activities-feed');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-3.5 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white rounded-xl text-xs font-mono tracking-widest uppercase font-semibold shadow-lg shadow-[#bc4638]/15 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Смотреть активности
              <ArrowDown className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenApplyModal}
              className="px-8 py-3.5 bg-white/40 backdrop-blur-md border border-[#d8d1cc] hover:border-[#bc4638]/60 rounded-xl text-xs font-mono tracking-widest uppercase text-[#5b6472] hover:text-[#bc4638] transition-all cursor-pointer"
            >
              Подать заявку
            </button>
          </motion.div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="relative z-10 py-6 md:py-8 max-w-6xl mx-auto px-[6%] md:px-[10%]">
        <motion.div
          {...fadeUp}
          className="flex flex-wrap justify-center gap-2 sm:gap-3"
        >
          {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map((cat) => {
            const isActive = selectedCategory === cat;
            const catInfo = cat !== 'all' ? CATEGORY_MAP[cat as ActivityCategory] : null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs font-mono transition-all border cursor-pointer ${
                  isActive
                    ? 'bg-brand-dark text-white border-brand-dark shadow-md font-bold'
                    : 'bg-white/40 text-brand-slate hover:text-brand-dark border-white/60 hover:bg-white/60'
                }`}
              >
                {catInfo && catInfo.icon}
                <span>{CATEGORY_LABELS[cat]}</span>
              </button>
            );
          })}
        </motion.div>
      </section>

      {/* ===== ACTIVITIES FEED ===== */}
      <section id="activities-feed" className="relative z-10 py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-[6%] md:px-[10%]">
          {/* Active activities */}
          {activeActivities.length > 0 ? (
            <motion.div {...cardStaggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {activeActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  isExpanded={expandedActivity === activity.id}
                  onToggle={() => setExpandedActivity(expandedActivity === activity.id ? null : activity.id)}
                  onNavigateToSection={onNavigateToSection}
                  onOpenApplyModal={onOpenApplyModal}
                />
              ))}
            </motion.div>
          ) : (
            <EmptyState
              message={selectedCategory !== 'all' ? 'По этому фильтру пока нет активностей' : 'Активности скоро появятся'}
              primaryAction={{ label: 'Посмотреть чемпионат', onClick: () => onNavigateToSection('nearest-championship') }}
              secondaryAction={{ label: 'Найти команду', onClick: () => onNavigateToSection('scenarios') }}
            />
          )}

          {/* Completed activities */}
          {completedActivities.length > 0 && (
            <section className="py-8 md:py-12 space-y-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-brand-slate hover:text-brand-dark transition-colors cursor-pointer"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${showCompleted ? 'rotate-180' : ''}`} />
                  <span>Архив активностей ({completedActivities.length})</span>
                </button>
              </div>
              <AnimatePresence initial={false}>
                {showCompleted && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {completedActivities.map((activity) => (
                        <ActivityCard
                          key={activity.id}
                          activity={activity}
                          isExpanded={expandedActivity === activity.id}
                          onToggle={() => setExpandedActivity(expandedActivity === activity.id ? null : activity.id)}
                          onNavigateToSection={onNavigateToSection}
                          onOpenApplyModal={onOpenApplyModal}
                          isCompleted
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}
        </div>
      </section>

      {/* ===== HOW TO CHOOSE ===== */}
      <section className="relative z-10 py-16 md:py-24 max-w-6xl mx-auto px-[6%] md:px-[10%] space-y-12">
        <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-brand-dark tracking-tight">
            Как выбрать активность?
          </h2>
          <p className="text-xs sm:text-sm text-brand-slate font-normal md:font-light leading-relaxed">
            Не знаете, с чего начать? Определите свой уровень готовности и выберите подходящий формат.
          </p>
        </motion.div>

        <motion.div {...cardStaggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <Target className="w-6 h-6 text-[#bc4638]" />,
              title: 'Хочу попробовать',
              desc: 'Начните с короткого формата: лекция, мастер-класс или онлайн-встреча. Это бесплатно и поможет понять, что вам ближе.',
              cta: 'Смотреть воркшопы',
              action: () => setSelectedCategory('workshop'),
            },
            {
              icon: <Users className="w-6 h-6 text-[#bd5b82]" />,
              title: 'Хочу команду',
              desc: 'Присоединитесь к проектной активности или нетворкинг-встрече. Соберите команду и начните реальный проект.',
              cta: 'Найти команду',
              action: () => onNavigateToSection('scenarios'),
            },
            {
              icon: <Trophy className="w-6 h-6 text-[#c9a96e]" />,
              title: 'Готов к соревнованию',
              desc: 'Перейдите к чемпионату — там вас ждёт настоящий челлендж, экспертное жюри и международные призы.',
              cta: 'Выбрать чемпионат',
              action: () => onNavigateToSection('nearest-championship'),
            },
            {
              icon: <HelpCircle className="w-6 h-6 text-[#6b8f71]" />,
              title: 'Нет команды',
              desc: 'Используйте систему мэтчинга. Мы поможем найти единомышленников по интересам и навыкам.',
              cta: 'Найти команду',
              action: () => onNavigateToSection('scenarios'),
            },
          ].map((card, idx) => (
            <motion.div
              key={idx}
              variants={cardItemFadeUp.variants}
              className="bg-white/[0.12] glass-card border border-white/[0.15] p-6 rounded-2xl flex flex-col justify-between hover:bg-white/[0.2] transition-all duration-300"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#bc4638]/5 border border-white/80 flex items-center justify-center shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4)]">
                  {card.icon}
                </div>
                <div>
                  <h3 className="text-base font-serif font-semibold text-brand-dark mb-2">{card.title}</h3>
                  <p className="text-xs text-brand-slate font-normal md:font-light leading-relaxed">{card.desc}</p>
                </div>
              </div>
              <div className="pt-6 mt-6">
                <button
                  onClick={card.action}
                  className="w-full bg-white/40 hover:bg-[#bc4638] hover:text-white border border-[#d8d1cc] text-[#5b6472] text-[11px] font-mono tracking-wider py-2.5 rounded-xl transition-all duration-300 cursor-pointer text-center font-medium"
                >
                  {card.cta}
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative z-10 py-16 md:py-24 max-w-5xl mx-auto px-[6%] md:px-[10%]">
        <motion.div
          {...fadeInScale}
          className="bg-gradient-to-br from-[#bc4638]/8 via-white/[0.12] to-[#bd5b82]/8 glass-xl border border-white/[0.15] rounded-3xl p-8 sm:p-12 text-center space-y-6"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-brand-dark tracking-tight leading-tight max-w-2xl mx-auto">
            Не знаешь, с чего начать?
          </h2>
          <p className="text-sm sm:text-base text-brand-slate font-normal md:font-light leading-relaxed max-w-md mx-auto">
            Заполни короткую анкету — и наш координатор поможет подобрать формат, который подходит именно тебе.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onOpenApplyModal}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white hover:opacity-95 text-xs font-mono tracking-widest rounded-xl transition-all shadow-lg shadow-[#bc4638]/15 cursor-pointer font-bold uppercase"
            >
              Подать заявку
            </button>
            <button
              onClick={() => onNavigateToSection('scenarios')}
              className="w-full sm:w-auto px-8 py-3.5 bg-white/50 border border-[#d8d1cc] text-[#5b6472] hover:border-[#bc4638]/60 text-xs font-mono tracking-widest rounded-xl transition-all cursor-pointer uppercase font-semibold"
            >
              Найти команду
            </button>
            <button
              onClick={() => onNavigateToSection('footer-system')}
              className="w-full sm:w-auto px-8 py-3.5 bg-white/50 border border-[#d8d1cc] text-[#5b6472] hover:border-[#bc4638]/60 text-xs font-mono tracking-widest rounded-xl transition-all cursor-pointer uppercase font-semibold"
            >
              Контакты
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

/* ===== ACTIVITY CARD ===== */
type ActivityCardProps = {
  activity: ActivityItem;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigateToSection: (id: string) => void;
  onOpenApplyModal: () => void;
  isCompleted?: boolean;
  key?: string;
};

function ActivityCard({
  activity,
  isExpanded,
  onToggle,
  onNavigateToSection,
  onOpenApplyModal,
  isCompleted,
}: ActivityCardProps) {
  const statusInfo = STATUS_MAP[activity.status];
  const catInfo = activity.status !== 'completed' ? CATEGORY_MAP[activity.category] : null;

  return (
    <motion.div
      variants={cardItemFadeUp.variants}
      className={`bg-white/[0.12] glass-card border rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:bg-white/[0.2] ${
        isExpanded
          ? 'border-[#bc4638]/40 shadow-lg shadow-[#bc4638]/5'
          : 'border-white/[0.15] hover:border-[#bc4638]/30'
      }`}
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={activity.imageUrl}
          alt={activity.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
        {/* Status badge */}
        <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold ${statusInfo.bgColor} ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
        {/* Category badge */}
        {catInfo && (
          <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-white/80 backdrop-blur-sm text-brand-dark`}>
            {catInfo.label}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 space-y-3">
        <h3 className="text-sm sm:text-base font-serif font-semibold text-brand-dark leading-snug">
          {activity.title}
        </h3>

        <p className="text-xs text-brand-slate font-normal md:font-light leading-relaxed line-clamp-3">
          {activity.shortDescription}
        </p>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-brand-slate/80">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#bc4638]/60" />
            {activity.date}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#bd5b82]/60" />
            {activity.format}
          </span>
        </div>

        {/* Expand / Collapse */}
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#bc4638] hover:text-[#80261b] transition-colors cursor-pointer font-semibold mt-auto pt-2"
        >
          {isExpanded ? 'Свернуть' : 'Подробнее'}
          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        {/* Expanded content */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden space-y-4 pt-2"
            >
              <div className="space-y-2 pt-2 border-t border-white/20">
                <p className="text-xs text-brand-slate font-normal md:font-light leading-relaxed">
                  {activity.fullDescription}
                </p>
              </div>

              <div>
                <h4 className="text-[10px] font-mono uppercase tracking-wider text-brand-dark/70 font-semibold mb-1.5">
                  КОМУ ПОДХОДИТ
                </h4>
                <p className="text-xs text-brand-slate font-light">{activity.who}</p>
              </div>

              <div>
                <h4 className="text-[10px] font-mono uppercase tracking-wider text-brand-dark/70 font-semibold mb-1.5">
                  ЧТО ВЫ ПОЛУЧИТЕ
                </h4>
                <ul className="space-y-1">
                  {activity.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-brand-slate font-light">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-[10px] font-mono uppercase tracking-wider text-brand-dark/70 font-semibold mb-1.5">
                  ПРЕДВАРИТЕЛЬНЫЙ ОПЫТ
                </h4>
                <p className="text-xs text-brand-slate font-light">{activity.prerequisites}</p>
              </div>

              {/* CTA */}
              {!isCompleted ? (
                activity.status === 'completed' ? (
                  activity.ctaLink ? (
                    <a
                      href={activity.ctaLink}
                      className="block w-full bg-white/40 border border-[#d8d1cc] text-[#5b6472] text-[11px] font-mono tracking-wider py-2.5 rounded-xl transition-all text-center font-medium hover:bg-white/60"
                    >
                      {activity.ctaText}
                    </a>
                  ) : (
                    <button
                      onClick={onOpenApplyModal}
                      className="block w-full bg-white/40 border border-[#d8d1cc] text-[#5b6472] text-[11px] font-mono tracking-wider py-2.5 rounded-xl transition-all text-center font-medium hover:bg-white/60 cursor-pointer"
                    >
                      Записаться на следующую
                    </button>
                  )
                ) : (
                  <button
                    onClick={onOpenApplyModal}
                    className="block w-full bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white text-[11px] font-mono tracking-wider py-2.5 rounded-xl transition-all text-center font-bold shadow-md shadow-[#bc4638]/10 hover:scale-[1.01] cursor-pointer"
                  >
                    {activity.ctaText}
                    <ArrowUpRight className="w-3.5 h-3.5 inline ml-1" />
                  </button>
                )
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ===== EMPTY STATE ===== */
function EmptyState({
  message,
  primaryAction,
  secondaryAction,
}: {
  message: string;
  primaryAction: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 space-y-6"
    >
      <div className="w-16 h-16 bg-white/30 border border-white/60 rounded-2xl flex items-center justify-center mx-auto">
        <Search className="w-8 h-8 text-brand-slate/40" />
      </div>
      <p className="text-sm text-brand-slate font-light max-w-md mx-auto">{message}</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={primaryAction.onClick}
          className="px-6 py-2.5 bg-[#bc4638] text-white text-xs font-mono tracking-wider rounded-xl transition-all cursor-pointer font-medium"
        >
          {primaryAction.label}
        </button>
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="px-6 py-2.5 bg-white/40 border border-[#d8d1cc] text-[#5b6472] text-xs font-mono tracking-wider rounded-xl transition-all cursor-pointer"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </motion.div>
  );
}
