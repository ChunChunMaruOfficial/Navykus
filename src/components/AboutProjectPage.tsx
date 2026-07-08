import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Target, 
  ChevronDown, 
  CheckCircle2, 
  ArrowRight, 
  GraduationCap, 
  Globe, 
  Award, 
  HelpCircle, 
  Briefcase, 
  Shield, 
  Activity, 
  Compass, 
  Calendar, 
  BookOpen, 
  MessageSquare,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';

interface Segment {
  id: string;
  title: string;
  subtitle: string;
  benefits: string[];
  ctaText: string;
  targetRole: string;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
}


interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const AUDIENCE_SEGMENTS: Segment[] = [
  {
    id: "seg-1",
    title: "Школьникам",
    subtitle: "Развитие и международный нетворкинг",
    benefits: [
      "Решение реальных кейсов крупных брендов",
      "Формирование международного портфолио проектов",
      "Поиск единомышленников и создание команд",
      "Ценные призы, гранты и стажировки"
    ],
    ctaText: "Посмотреть чемпионаты",
    targetRole: "championships"
  },
  {
    id: "seg-2",
    title: "Родителям",
    subtitle: "Инвестиция в успешное будущее ребенка",
    benefits: [
      "Освоение востребованных Soft & Hard Skills",
      "Безопасная развивающая онлайн-среда",
      "Ранняя профориентация и выбор ВУЗа",
      "Консультации от экспертов топовых университетов"
    ],
    ctaText: "Узнать об экспертах",
    targetRole: "mentors"
  },
  {
    id: "seg-3",
    title: "Школам и организациям",
    subtitle: "Повышение престижа и вовлеченности",
    benefits: [
      "Готовые проектные программы под ключ",
      "Интеграция с международными стандартами",
      "Повышение рейтинга школы за счет побед учащихся",
      "Обучение педагогов современным методикам"
    ],
    ctaText: "Связаться с проектом",
    targetRole: "contact"
  },
  {
    id: "seg-4",
    title: "Экспертам и наставникам",
    subtitle: "Развитие талантов нового поколения",
    benefits: [
      "Менторство над перспективными молодежными командами",
      "Вклад в развитие глобального EdTech",
      "Скаутинг талантливых ребят для своих лабораторий",
      "Обмен опытом с коллегами из MIT, Сорбонны и YC"
    ],
    ctaText: "Стать экспертом",
    targetRole: "contact"
  },
  {
    id: "seg-5",
    title: "Партнёрам и спонсорам",
    subtitle: "Прямой контакт с лидерами завтрашнего дня",
    benefits: [
      "Решение корпоративных задач руками креативных школьников",
      "Брендинг среди активной молодежной аудитории",
      "Реализация инициатив корпоративной социальной ответственности",
      "Привлечение лояльных молодых специалистов"
    ],
    ctaText: "Обсудить партнерство",
    targetRole: "contact"
  }
];

const ACTIVITIES_ITEMS: ActivityItem[] = [
  {
    id: "act-1",
    title: "Участвовать в чемпионатах",
    description: "Решайте глобальные кейсы в сфере экологии, урбанистики, ИТ и дипломатии. Соревнуйтесь со школьниками из других стран за гранты и признание."
  },
  {
    id: "act-2",
    title: "Создавать проекты",
    description: "Превращайте свои смелые идеи в работающие прототипы и стартапы по проверенным методикам ведущих инкубаторов мира."
  },
  {
    id: "act-3",
    title: "Находить команду",
    description: "Используйте нашу умную систему мэтчинга, чтобы найти соавторов, дизайнеров, кодеров или присоединиться к перспективной инициативе."
  },
  {
    id: "act-4",
    title: "Получать обратную связь",
    description: "Представляйте свои идеи экспертам из MIT, Y Combinator и ведущих корпораций. Качественный фидбек ускоряет рост в разы."
  },
  {
    id: "act-5",
    title: "Участвовать в активностях",
    description: "Посещайте вебинары, мастер-классы и воркшопы по программированию, питчингу, аналитике и дизайну абсолютно бесплатно."
  },
  {
    id: "act-6",
    title: "Развивать навыки будущего",
    description: "Осваивайте критическое мышление, системный подход, цифровую грамотность и эмоциональный интеллект в прикладном формате."
  }
];


const FAQ_ITEMS: FAQItem[] = [
  {
    id: "faq-1",
    question: "Кто может стать участником проекта?",
    answer: "Проект создан для активных школьников и студентов в возрасте от 10 до 22 лет, интересующихся проектной деятельностью, стартапами, технологиями, социальными инновациями и международным общением."
  },
  {
    id: "faq-2",
    question: "Нужен ли предварительный опыт участия в хакатонах?",
    answer: "Абсолютно нет! Наши чемпионаты и программы построены так, что в них комфортно заходить новичкам. Командные трекеры и вебинары помогут освоить базу проектной логики с нуля."
  },
  {
    id: "faq-3",
    question: "Можно ли зарегистрироваться, если у меня нет команды?",
    answer: "Да, конечно. Более половины наших участников регистрируются поодиночке. Сразу после подачи заявки платформа предоставит доступ в закрытое комьюнити и чаты, где вы легко соберете команду или примкнете к существующей."
  },
  {
    id: "faq-4",
    question: "Как устроен процесс поиска команды?",
    answer: "Вы можете искать сокомандников через специальный каталог анкет на платформе, отфильтровав ребят по компетенциям (дизайнер, спикер, генератор идей), либо принять участие в живой питч-сессии мэтчинга перед стартом чемпионата."
  },
  {
    id: "faq-5",
    question: "Как проходят мероприятия и защита проектов?",
    answer: "Все процессы проходят полностью в онлайн-формате на нашей платформе. Воркшопы и лекции транслируются в записи и живом эфире, работа ведется в Miro/Figma, а защита проектов проходит перед жюри в Zoom или Discord."
  },
  {
    id: "faq-6",
    question: "Как можно связаться с организаторами Навыкус?",
    answer: "Вы всегда можете написать нашей круглосуточной службе поддержки по почте info@navykus.org или в официальном Telegram-аккаунте @navykus_com. Мы ответим на любые организационные или технические вопросы."
  }
];

interface AboutProjectPageProps {
  onBackToHome: () => void;
  onNavigateToSection: (sectionId: string) => void;
  onOpenApplyModal: () => void;
}

export default function AboutProjectPage({ 
  onBackToHome, 
  onNavigateToSection, 
  onOpenApplyModal 
}: AboutProjectPageProps) {
  
  const [selectedSegmentIdx, setSelectedSegmentIdx] = useState(0);
  const [activeFaqIdx, setActiveFaqIdx] = useState<number | null>(null);

  const handleNavigateFromAbout = (sectionId: string) => {
    onBackToHome();
    setTimeout(() => {
      onNavigateToSection(sectionId);
    }, 150);
  };
  
  return (
    <div className="relative w-full text-brand-dark pb-16 pt-24">
      <div className="max-w-6xl mx-auto px-[6%] md:px-[10%]">
        
        {/* Back navigation */}
        <div className="flex justify-start mb-8 sm:mb-12">
          <button 
            onClick={onBackToHome}
            className="group inline-flex items-center gap-2 px-4 py-2 border border-[#d8d1cc]/60 hover:border-brand-dark text-xs font-mono tracking-wider uppercase text-brand-slate hover:text-brand-dark transition-all rounded-xl cursor-pointer bg-white/20 backdrop-blur-sm"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180 transition-transform group-hover:-translate-x-0.5" />
            <span>Вернуться на Главную</span>
          </button>
        </div>

        {/* 1. HERO BLOCK (Clean editorial text layout) */}
        <section className="relative z-10 text-center space-y-6 max-w-3xl mx-auto mb-16 md:mb-28">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl font-serif font-light italic tracking-tight text-brand-dark leading-tight"
          >
            О проекте Навыкус
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-brand-slate text-sm sm:text-base md:text-lg leading-relaxed font-light"
          >
            Мы создаем будущее образования, объединяя активных школьников, академических наставников и глобальные компании в единую поддерживающую экосистему развития.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button
              onClick={onOpenApplyModal}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white rounded-xl text-xs font-mono tracking-widest uppercase font-semibold shadow-lg shadow-[#bc4638]/15 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Принять участие</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleNavigateFromAbout('nearest-championship')}
              className="w-full sm:w-auto px-8 py-3.5 bg-white border border-[#d8d1cc] text-[#5b6472] hover:border-[#bc4638]/60 rounded-xl text-xs font-mono tracking-widest uppercase transition-all text-center cursor-pointer hover:text-brand-dark"
            >
              Посмотреть чемпионат
            </button>
          </motion.div>
        </section>

        {/* 2. MISSION BLOCK */}
        <section className="relative z-10 py-16 mb-16 md:mb-24 bg-white/20 backdrop-blur-lg border border-[#d8d1cc]/40 rounded-3xl shadow-xl px-6 sm:px-12 text-center overflow-hidden">
          {/* Faint watermark logo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none select-none z-0 -translate-y-12">
            <svg 
              viewBox="0 0 400 480" 
              className="w-72 h-80 sm:w-80 sm:h-96"
            >
              <defs>
                <linearGradient id="mission-logo-left-grad" x1="15%" y1="0%" x2="85%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                  <stop offset="25%" stopColor="#f38b76" stopOpacity="0.75" />
                  <stop offset="65%" stopColor="#bc4638" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#80261b" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="mission-logo-right-grad" x1="15%" y1="0%" x2="85%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                  <stop offset="25%" stopColor="#e28fb1" stopOpacity="0.75" />
                  <stop offset="65%" stopColor="#bd5b82" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#803251" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="mission-logo-h-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#bc4638" stopOpacity="0.85" />
                  <stop offset="20%" stopColor="#f38b76" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#d57e8c" stopOpacity="0.8" />
                  <stop offset="80%" stopColor="#e28fb1" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#bd5b82" stopOpacity="0.85" />
                </linearGradient>
              </defs>
              <circle cx="102.5" cy="75" r="42.5" fill="url(#mission-logo-left-grad)" />
              <circle cx="297.5" cy="75" r="42.5" fill="url(#mission-logo-right-grad)" />
              <path 
                d="M 60,180 A 42.5,42.5 0 0,1 145,180 L 145,220 C 145,236.5 158.5,250 175,250 L 225,250 C 241.5,250 255,236.5 255,220 L 255,180 A 42.5,42.5 0 0,1 340,180 L 340,400 A 42.5,42.5 0 0,1 255,400 L 255,360 C 255,343.5 241.5,330 225,330 L 175,330 C 158.5,330 145,343.5 145,360 L 145,400 A 42.5,42.5 0 0,1 60,400 Z" 
                fill="url(#mission-logo-h-grad)" 
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl sm:text-4xl font-serif text-brand-dark tracking-tight">
              Наша Миссия
            </h2>
            
            <p className="text-base sm:text-lg text-brand-dark font-medium leading-relaxed italic">
              « Традиционная школа фокусируется на академической теории, в то время как современный мир требует прикладных навыков, развитого проектного мышления и умения работать в кросс-культурных командах. »
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 text-left pt-4 border-t border-[#d8d1cc]/30">
              <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
                Навыкус был создан как мост между школьными партами и реальными профессиональными вызовами. Мы верим, что каждый школьник, вне зависимости от его географического положения, заслуживает иметь доступ к менторству мирового уровня, современным инструментам проектирования и глобальному сообществу единомышленников.
              </p>
              <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
                Наше сообщество объединяет ребят из более чем 15 стран, говорящих на разных языках, но объединенных одной страстью — создавать жизнеспособные проекты, которые меняют мир к лучшему.
              </p>
            </div>

            <div className="pt-6 border-t border-[#d8d1cc]/30">
              <p className="text-xs sm:text-sm font-mono tracking-wide text-[#bc4638] font-semibold">
                Навыкус — это не просто образовательный сайт. Это международная стартовая площадка, стирающая границы и формирующая новое поколение осознанных лидеров.
              </p>
            </div>
          </div>
        </section>

        {/* 3. AUDIENCE SEGMENTS BLOCK */}
        <section className="relative z-10 mb-16 md:mb-24">
          <div className="text-center space-y-4 mb-10 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-serif text-brand-dark tracking-tight">
              Для кого этот проект
            </h2>
            <p className="text-xs sm:text-sm text-brand-slate font-light max-w-2xl mx-auto">
              Навыкус объединяет ключевых участников образовательной экосистемы. Выберите свою роль, чтобы узнать преимущества и сделать первый шаг к сотрудничеству.
            </p>
          </div>

          {/* Audience Interactive Selector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Segments list switcher buttons */}
            <div className="lg:col-span-5 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-2 pb-3 lg:pb-0 scrollbar-none snap-x">
              {AUDIENCE_SEGMENTS.map((seg, idx) => (
                <button
                  key={seg.id}
                  onClick={() => setSelectedSegmentIdx(idx)}
                  className={`flex-shrink-0 snap-start w-64 lg:w-full text-left px-5 py-4 rounded-2xl transition-all border ${
                    selectedSegmentIdx === idx 
                      ? 'bg-brand-dark text-white border-brand-dark shadow-md' 
                      : 'bg-white/40 text-brand-slate hover:text-brand-dark border-white/60 hover:bg-white/60'
                  } cursor-pointer`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-mono font-semibold uppercase tracking-wider">
                        {seg.title}
                      </h4>
                      <p className={`text-[10px] mt-0.5 truncate max-w-[200px] ${selectedSegmentIdx === idx ? 'text-white/80' : 'text-brand-slate/70'}`}>
                        {seg.subtitle}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedSegmentIdx === idx ? 'translate-x-1' : 'opacity-40'}`} />
                  </div>
                </button>
              ))}
            </div>

            {/* Active Segment Detail Card */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedSegmentIdx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white/40 backdrop-blur-md border border-white/80 rounded-3xl p-6 sm:p-8 text-left shadow-lg space-y-6"
                >
                  <div className="space-y-1.5 pb-4 border-b border-[#d8d1cc]/40">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#bc4638] font-bold">
                      Ценность для аудитории
                    </span>
                    <h3 className="text-xl sm:text-2xl font-serif text-brand-dark">
                      {AUDIENCE_SEGMENTS[selectedSegmentIdx].title}
                    </h3>
                    <p className="text-xs text-brand-slate font-light">
                      {AUDIENCE_SEGMENTS[selectedSegmentIdx].subtitle}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h5 className="text-[10px] font-mono text-brand-dark uppercase tracking-wider font-semibold">
                      Что вы получаете:
                    </h5>
                    <ul className="space-y-2.5">
                      {AUDIENCE_SEGMENTS[selectedSegmentIdx].benefits.map((benefit, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-brand-slate font-light">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => {
                        const role = AUDIENCE_SEGMENTS[selectedSegmentIdx].targetRole;
                        if (role === 'championships') {
                          handleNavigateFromAbout('nearest-championship');
                        } else if (role === 'mentors') {
                          handleNavigateFromAbout('mentors-block');
                        } else if (role === 'contact') {
                          handleNavigateFromAbout('footer-system');
                        } else {
                          onOpenApplyModal();
                        }
                      }}
                      className="px-6 py-3 bg-brand-dark text-white hover:bg-brand-dark/90 rounded-xl text-xs font-mono tracking-widest uppercase transition-all flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>{AUDIENCE_SEGMENTS[selectedSegmentIdx].ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </section>

        {/* 4. WHAT CAN YOU DO BLOCK (Что можно делать в Навыкус) */}
        <section className="relative z-10 mb-16 md:mb-24">
          <div className="text-center space-y-4 mb-10 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-serif text-brand-dark tracking-tight">
              Что можно делать в Навыкус
            </h2>
            <p className="text-xs sm:text-sm text-brand-slate font-light">
              Платформа предоставляет непрерывный цикл развития — от первой идеи до презентации работающего MVP.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ACTIVITIES_ITEMS.map((item, idx) => {
              const icons = [Award, Compass, Users, GraduationCap, Calendar, Activity];
              const SelectedIcon = icons[idx % icons.length];

              return (
                <div 
                  key={item.id}
                  className="bg-white/40 backdrop-blur-md border border-white/60 hover:border-brand-terracotta/30 rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-lg flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-[#bc4638]/5 text-[#bc4638] flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                      <SelectedIcon className="w-5 h-5" />
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="text-base font-serif font-semibold text-brand-dark">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. FAQ-BLOCK (Часто задаваемые вопросы) */}
        <section className="relative z-10 max-w-4xl mx-auto mb-16 md:mb-24">
          <div className="text-center space-y-4 mb-10 max-w-3xl mx-auto">
            <div className="inline-flex p-2 rounded-2xl bg-[#bd5b82]/8 text-[#bd5b82] mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif text-brand-dark tracking-tight">
              Ответы на вопросы
            </h2>
            <p className="text-xs sm:text-sm text-brand-slate font-light">
              Мы собрали самые частые вопросы родителей, школьников и наставников.
            </p>
          </div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((faq, idx) => (
              <div 
                key={faq.id} 
                className="bg-white/30 backdrop-blur-sm border border-white/60 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFaqIdx(activeFaqIdx === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-serif font-semibold text-brand-dark text-sm sm:text-base cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 text-brand-slate/60 transition-transform duration-300 flex-shrink-0 ${activeFaqIdx === idx ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence initial={false}>
                  {activeFaqIdx === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="p-5 pt-0 text-xs sm:text-sm text-brand-slate font-light leading-relaxed border-t border-[#d8d1cc]/30 bg-white/10 text-left">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* 7. FINAL CALL TO ACTION (Финальный CTA) */}
        <section className="relative z-10 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-br from-[#bc4638]/10 via-white/40 to-[#bd5b82]/10 backdrop-blur-2xl border border-white/80 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl"
          >
            <span className="text-[10px] font-mono tracking-[0.2em] text-[#bc4638] uppercase font-bold">
              ВСТУПАЙ В СООБЩЕСТВО
            </span>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-brand-dark tracking-tight leading-tight max-w-2xl mx-auto">
              Хочешь стать частью международного сообщества?
            </h2>
            <p className="text-sm sm:text-base text-brand-slate font-light leading-relaxed max-w-md mx-auto">
              Не откладывай свое развитие. Зарегистрируйся на платформе прямо сейчас, найди свою команду мечты и начни создавать проекты будущего.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={onOpenApplyModal}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white hover:opacity-95 text-xs font-mono tracking-widest rounded-xl transition-all shadow-lg shadow-[#bc4638]/15 cursor-pointer font-bold uppercase"
              >
                Подать заявку
              </button>
              <button
                onClick={() => handleNavigateFromAbout('scenarios')}
                className="w-full sm:w-auto px-8 py-3.5 bg-white/50 border border-[#d8d1cc] text-[#5b6472] hover:border-[#bc4638]/60 text-xs font-mono tracking-widest rounded-xl transition-all cursor-pointer uppercase font-semibold"
              >
                НАЙТИ КОМАНДУ
              </button>
            </div>
          </motion.div>
        </section>

      </div>
    </div>
  );
}
