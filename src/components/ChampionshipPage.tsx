import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  Calendar, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  HelpCircle, 
  Info, 
  Settings, 
  Edit, 
  UserCheck, 
  RefreshCw, 
  FileText, 
  Check, 
  Plus, 
  Trash2, 
  Sparkles, 
  TrendingUp, 
  Compass,
  ArrowUpRight,
  Globe,
  Lock,
  ChevronDown,
  Clock,
  UserPlus,
  BookOpen
} from 'lucide-react';

interface Mentor {
  name: string;
  role: string;
  expertise: string;
}

interface ChampionshipData {
  id: string;
  title: string;
  type: string;
  date: string;
  registrationDeadline: string;
  description: string;
  pitch: string;
  targetAudience: string;
  ageLimit: string;
  format: string;
  teamsAllowed: string;
  lang: string;
  maxParticipants: number;
  expectedResult: string;
  evaluationCriteria: string[];
  themes: string[];
  mentors: Mentor[];
  registrationStatus: 'open' | 'suspended' | 'closed';
}

interface FAQItem {
  question: string;
  answer: string;
}

interface ChampionshipPageProps {
  onBackToHome: () => void;
  onNavigateToSection: (sectionId: string) => void;
  onOpenApplyModal: () => void;
}

export default function ChampionshipPage({ 
  onBackToHome, 
  onNavigateToSection, 
  onOpenApplyModal 
}: ChampionshipPageProps) {

  // CMS/Editable state with prefilled default championship data
  const [cmsData, setCmsData] = useState<ChampionshipData>({
    id: 'cup-1',
    title: 'Navykus Global Case Cup: Sustainable Cities',
    type: 'Кейс-чемпионат',
    date: '18–25 Сентября 2026',
    registrationDeadline: '15 Сентября 2026',
    description: 'Разработка инновационных решений для урбанистических проблем будущего. Международное жюри, реальные кейсы от урбанистов, архитекторов и экологов со всего мира.',
    pitch: 'Реши глобальный урбанистический кейс, собери международную команду мечты и защити свое решение перед менторами из MIT и экспертами Smart Cities.',
    targetAudience: 'Школьники и студенты 8–11 классов, увлеченные экологией, ИТ, урбанистикой и дизайном.',
    ageLimit: '14–19 лет',
    format: 'Международный онлайн-чемпионат (Групповая работа в Miro/Figma, презентация решений в Zoom)',
    teamsAllowed: 'Индивидуально или в команде (от 2 до 5 человек)',
    lang: 'Русский / Английский',
    maxParticipants: 120,
    expectedResult: 'Интерактивный проект/презентация по реновации городского пространства, план снижения углеродного следа или ИТ-решение для умного города.',
    evaluationCriteria: [
      'Инновационность и креативность подхода (25%)',
      'Техническая и экономическая реализуемость идеи (25%)',
      'Глубина анализа проблемы и проработка деталей (25%)',
      'Качество защиты, дизайн презентации и командный дух (25%)'
    ],
    themes: [
      'Реновация «зеленых зон» и микроурбанистика',
      'Инновационная переработка и сортировка бытовых отходов',
      'Альтернативные источники энергии в жилых кварталах',
      'Интеллектуальные ИТ-решения для общественного транспорта'
    ],
    mentors: [
      {
        name: 'д-р Марк Шпильман',
        role: 'Профессор урбанистики в MIT',
        expertise: 'Устойчивое городское планирование, Smart Cities'
      },
      {
        name: 'Елена Самарина',
        role: 'Руководитель проектов УрбанХаб',
        expertise: 'Проектирование общественных пространств, соучаствующее проектирование'
      },
      {
        name: 'Артур де Гроот',
        role: 'Главный аналитик Роттердамского университета',
        expertise: 'Экологический аудит и циркулярная экономика городов'
      }
    ],
    registrationStatus: 'open'
  });

  // CMS toggle and state
  const [isCmsPanelOpen, setIsCmsPanelOpen] = useState(false);
  const [tempTitle, setTempTitle] = useState(cmsData.title);
  const [tempPitch, setTempPitch] = useState(cmsData.pitch);
  const [tempDate, setTempDate] = useState(cmsData.date);
  const [tempDeadline, setTempDeadline] = useState(cmsData.registrationDeadline);
  const [tempAge, setTempAge] = useState(cmsData.ageLimit);
  const [tempFormat, setTempFormat] = useState(cmsData.format);
  const [tempTeams, setTempTeams] = useState(cmsData.teamsAllowed);
  const [tempStatus, setTempStatus] = useState<ChampionshipData['registrationStatus']>(cmsData.registrationStatus);

  // New mentor input state
  const [newMentorName, setNewMentorName] = useState('');
  const [newMentorRole, setNewMentorRole] = useState('');
  const [newMentorExpertise, setNewMentorExpertise] = useState('');

  // New theme input state
  const [newTheme, setNewTheme] = useState('');

  // Interactive UI states (scenarios, tabs, accordions)
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeTimelineStep, setActiveTimelineStep] = useState<number>(0);
  const [selectedSuitabilityTab, setSelectedSuitabilityTab] = useState<'all' | 'teamless' | 'ambitious' | 'creative'>('all');

  // Application Form submission state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    city: '',
    contact: '',
    hasTeam: 'no', // 'no' (no team, wants matching), 'yes' (has team), 'solo' (wants to participate alone)
    teamSize: '1',
    interests: 'Урбанистика & Экология',
    portfolioLink: '',
    coverLetter: ''
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formErrorMsg, setFormErrorMsg] = useState('');
  const [generatedTicket, setGeneratedTicket] = useState<{
    ticketId: string;
    seatNum: number;
    regTime: string;
  } | null>(null);

  // Apply changes from temp CMS state
  const handleApplyCmsChanges = () => {
    setCmsData(prev => ({
      ...prev,
      title: tempTitle,
      pitch: tempPitch,
      date: tempDate,
      registrationDeadline: tempDeadline,
      ageLimit: tempAge,
      format: tempFormat,
      teamsAllowed: tempTeams,
      registrationStatus: tempStatus
    }));
    // Show user a quick toast/confirmation or just close
    setIsCmsPanelOpen(false);
  };

  // Add new mentor via CMS
  const handleAddMentor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMentorName.trim() || !newMentorRole.trim()) return;
    
    setCmsData(prev => ({
      ...prev,
      mentors: [
        ...prev.mentors,
        {
          name: newMentorName,
          role: newMentorRole,
          expertise: newMentorExpertise || 'Общая экспертиза'
        }
      ]
    }));
    setNewMentorName('');
    setNewMentorRole('');
    setNewMentorExpertise('');
  };

  // Delete mentor via CMS
  const handleDeleteMentor = (index: number) => {
    setCmsData(prev => ({
      ...prev,
      mentors: prev.mentors.filter((_, idx) => idx !== index)
    }));
  };

  // Add new theme via CMS
  const handleAddTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTheme.trim()) return;
    setCmsData(prev => ({
      ...prev,
      themes: [...prev.themes, newTheme.trim()]
    }));
    setNewTheme('');
  };

  // Delete theme via CMS
  const handleDeleteTheme = (index: number) => {
    setCmsData(prev => ({
      ...prev,
      themes: prev.themes.filter((_, idx) => idx !== index)
    }));
  };

  // Form submit simulator
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormErrorMsg('Пожалуйста, введите ваше имя');
      setFormStatus('error');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormErrorMsg('Введите корректный email адрес');
      setFormStatus('error');
      return;
    }
    const ageNum = Number(formData.age);
    if (!formData.age.trim() || isNaN(ageNum) || ageNum < 10 || ageNum > 24) {
      setFormErrorMsg('Укажите корректный возраст (от 10 до 24 лет)');
      setFormStatus('error');
      return;
    }
    if (!formData.contact.trim()) {
      setFormErrorMsg('Укажите контакт для быстрой связи (Telegram или WhatsApp)');
      setFormStatus('error');
      return;
    }

    setFormErrorMsg('');
    setFormStatus('submitting');

    setTimeout(() => {
      const ticketId = 'NV-CUP-' + Math.floor(100000 + Math.random() * 900000);
      const seatNum = Math.floor(12 + Math.random() * 98);
      const regTime = new Date().toLocaleString('ru-RU', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      setGeneratedTicket({ ticketId, seatNum, regTime });
      setFormStatus('success');
    }, 1500);
  };

  // Reset form
  const handleResetForm = () => {
    setFormData({
      name: '',
      email: '',
      age: '',
      city: '',
      contact: '',
      hasTeam: 'no',
      teamSize: '1',
      interests: 'Урбанистика & Экология',
      portfolioLink: '',
      coverLetter: ''
    });
    setFormStatus('idle');
    setGeneratedTicket(null);
  };

  const handleNavigateFromChampionship = (sectionId: string) => {
    onBackToHome();
    setTimeout(() => {
      onNavigateToSection(sectionId);
    }, 150);
  };

  // Static items for visual timeline & faq
  const TIMELINE_STEPS = [
    {
      step: 1,
      title: 'Быстрая онлайн-регистрация',
      desc: 'Заполните анкету на этой странице, укажите ваши интересы и выберите формат участия (индивидуальный или командный).',
      highlight: 'Дедлайн: ' + cmsData.registrationDeadline
    },
    {
      step: 2,
      title: 'Мэтчинг и сбор команд',
      desc: 'Если у вас нет команды, наша умная платформа автоматически предложит вам близких по духу сокомандников или откроет доступ в закрытый чат.',
      highlight: 'Помощь без команды: да'
    },
    {
      step: 3,
      title: 'Публикация кейсов и старт',
      desc: 'В день старта команды получают доступ в личный кабинет с подробным техническим заданием от компаний-партнеров.',
      highlight: 'Старт: ' + cmsData.date.split('–')[0]
    },
    {
      step: 4,
      title: 'Работа над проектом и воркшопы',
      desc: 'Вы проектируете решение в Miro/Figma, посещаете ежедневные вебинары от спикеров и улучшаете прототип на основе инструкций.',
      highlight: '1-2 онлайн-воркшопа ежедневно'
    },
    {
      step: 5,
      title: 'Обратная связь от менторов',
      desc: 'Каждой команде выделяется персональный эксперт (трекер), который проводит сессию разбора и помогает устранить ошибки.',
      highlight: 'Индивидуальный разбор 30 минут'
    },
    {
      step: 6,
      title: 'Финальный питч проектов',
      desc: 'Команды представляют свои презентации и прототипы перед международным жюри в прямом онлайн-эфире.',
      highlight: 'Защита: до 5 минут на команду'
    },
    {
      step: 7,
      title: 'Итоги, призы и фидбек-сессия',
      desc: 'Жюри выставляет баллы, оглашает победителей и призеров, а каждый участник получает персональный сертификат и развернутый отзыв.',
      highlight: 'Сертификат в портфолио всем участникам'
    }
  ];

  const FAQ_ITEMS: FAQItem[] = [
    {
      question: 'Можно ли участвовать, если у меня нет команды?',
      answer: 'Да! Более половины участников регистрируются по одному. Мы предусмотрели интерактивный процесс мэтчинга, живые зум-встречи для знакомства и специальный каталог анкет, в котором вы сможете легко собрать команду за 2 дня до старта.'
    },
    {
      question: 'Участие платное? И какие требования к технике?',
      answer: 'Участие абсолютно бесплатное. Вам понадобятся только стабильный интернет, доступ к Zoom/Discord, а также базовые навыки работы в Google Презентациях или Miro/Figma. Никакого сложного софта устанавливать не нужно.'
    },
    {
      question: 'Сколько времени в день будет занимать кубок?',
      answer: 'Обычно это занимает 2-3 часа свободного времени в день. Воркшопы проходят во внеучебное время (вечером по МСК) и сохраняются в записи, поэтому вы сможете легко совмещать кубок с уроками в школе или парами в колледже.'
    },
    {
      question: 'Можно ли участвовать школьникам из других стран?',
      answer: 'Да, чемпионат является международным и проводится полностью в онлайн-формате. Мы ждем ребят из СНГ, Европы, Азии и Америки. Основной рабочий язык чемпионата — русский, но защита проектов и материалы также доступны на английском.'
    },
    {
      question: 'Какой документ я получу по итогам участия?',
      answer: 'Каждый участник, дошедший до этапа защиты и приславший решение, получает официальный международный сертификат участника с подписью организаторов и логотипами наших партнеров, который верифицирует полученные hard и soft skills для вашего портфолио.'
    },
    {
      question: 'Где и когда будут опубликованы результаты?',
      answer: 'Результаты и баллы будут опубликованы на церемонии закрытия в прямом эфире, а также продублированы на платформе и отправлены всем участникам в личные кабинеты и на почту в течение 24 часов после окончания защит.'
    }
  ];

  return (
    <div className="relative w-full text-brand-dark pb-16 pt-24">
      <div className="max-w-6xl mx-auto px-[6%] md:px-[10%] space-y-16">
        
        {/* Back navigation & CMS Trigger button */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 z-20 relative">
          <button 
            onClick={onBackToHome}
            className="group inline-flex items-center gap-2 px-4 py-2 border border-[#d8d1cc]/60 hover:border-brand-dark text-xs font-mono tracking-wider uppercase text-brand-slate hover:text-brand-dark transition-all rounded-xl cursor-pointer bg-white/20 backdrop-blur-sm self-start"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180 transition-transform group-hover:-translate-x-0.5" />
            <span>Вернуться на главную</span>
          </button>

          {/* CMS Simulation Badge / Button */}
          <button
            onClick={() => {
              setIsCmsPanelOpen(!isCmsPanelOpen);
              // Synch temp states on open
              setTempTitle(cmsData.title);
              setTempPitch(cmsData.pitch);
              setTempDate(cmsData.date);
              setTempDeadline(cmsData.registrationDeadline);
              setTempAge(cmsData.ageLimit);
              setTempFormat(cmsData.format);
              setTempTeams(cmsData.teamsAllowed);
              setTempStatus(cmsData.registrationStatus);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand-dark/5 hover:bg-brand-dark/10 border border-brand-dark/10 text-brand-dark text-xs font-mono tracking-wider uppercase rounded-xl transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4 animate-spin-slow" />
            <span>Управление CMS (Прототип)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>
        </div>

        {/* --- CMS CONTROLLER OVERLAY / PANEL --- */}
        <AnimatePresence>
          {isCmsPanelOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-brand-dark text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative border border-white/10 z-30"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-brand-terracotta" />
                  <h3 className="font-serif text-lg font-bold">Панель администратора / CMS-редактор</h3>
                </div>
                <button 
                  onClick={() => setIsCmsPanelOpen(false)}
                  className="text-white/60 hover:text-white text-xs font-mono border border-white/10 px-2.5 py-1 rounded-lg cursor-pointer"
                >
                  Закрыть ✕
                </button>
              </div>

              <p className="text-xs text-white/70 leading-relaxed font-light">
                Этот интерактивный блок симулирует CMS-систему Навыкуса. Любые изменения, внесенные ниже (название кубка, дедлайны, возрастные ограничения, статус регистрации или состав жюри), мгновенно перестроят и перерисуют весь UX-прототип страницы чемпионата ниже, демонстрируя гибкость архитектуры.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Text fields inputs */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50">Название чемпионата (CMS)</label>
                    <input 
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-terracotta"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50">Короткий питч (Hero)</label>
                    <textarea 
                      value={tempPitch}
                      onChange={(e) => setTempPitch(e.target.value)}
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-terracotta"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50">Даты проведения</label>
                      <input 
                        type="text"
                        value={tempDate}
                        onChange={(e) => setTempDate(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50">Дедлайн регистрации</label>
                      <input 
                        type="text"
                        value={tempDeadline}
                        onChange={(e) => setTempDeadline(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50">Возрастной ценз</label>
                      <input 
                        type="text"
                        value={tempAge}
                        onChange={(e) => setTempAge(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50">Тип участия</label>
                      <input 
                        type="text"
                        value={tempTeams}
                        onChange={(e) => setTempTeams(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50">Статус регистрации (Поведение CTA)</label>
                    <div className="flex gap-2">
                      {(['open', 'suspended', 'closed'] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setTempStatus(status)}
                          className={`flex-1 py-2 text-center rounded-xl text-xs font-mono uppercase tracking-wider border cursor-pointer ${
                            tempStatus === status 
                              ? 'bg-brand-terracotta text-white border-brand-terracotta' 
                              : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {status === 'open' && 'Открыта'}
                          {status === 'suspended' && 'Приостановлена'}
                          {status === 'closed' && 'Закрыта'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Theme & Mentors CMS Editing */}
                <div className="space-y-4 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                  
                  {/* Dynamic Themes Edit */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50">Тематические направления кубка ({cmsData.themes.length})</label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-white/5 rounded-xl">
                      {cmsData.themes.map((theme, tIdx) => (
                        <span key={tIdx} className="inline-flex items-center gap-1 bg-white/10 text-white/90 text-[10px] px-2 py-1 rounded-lg">
                          <span className="truncate max-w-[120px]">{theme}</span>
                          <button 
                            type="button" 
                            onClick={() => handleDeleteTheme(tIdx)}
                            className="text-red-400 hover:text-red-300 ml-1 font-bold cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <form onSubmit={handleAddTheme} className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Новая тема..."
                        value={newTheme}
                        onChange={(e) => setNewTheme(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <button 
                        type="submit"
                        className="bg-brand-terracotta hover:bg-brand-terracotta/90 px-3 py-1.5 rounded-xl text-xs font-mono font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </form>
                  </div>

                  {/* Dynamic Mentors Edit */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50">Управление жюри и менторами ({cmsData.mentors.length})</label>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto p-1 bg-white/5 rounded-xl">
                      {cmsData.mentors.map((mentor, mIdx) => (
                        <div key={mIdx} className="flex items-center justify-between bg-white/10 px-3 py-1.5 rounded-lg text-xs">
                          <div className="truncate pr-2">
                            <span className="font-semibold text-white/95">{mentor.name}</span>
                            <span className="text-[10px] text-white/60 block truncate">{mentor.role}</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleDeleteMentor(mIdx)}
                            className="text-red-400 hover:text-red-300 cursor-pointer p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <form onSubmit={handleAddMentor} className="space-y-1.5 pt-1.5 border-t border-white/10">
                      <input 
                        type="text" 
                        placeholder="Имя эксперта..."
                        value={newMentorName}
                        onChange={(e) => setNewMentorName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Должность/ВУЗ..."
                          value={newMentorRole}
                          onChange={(e) => setNewMentorRole(e.target.value)}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                        />
                        <button 
                          type="submit" 
                          className="bg-brand-terracotta hover:bg-brand-terracotta/90 px-4 py-1.5 rounded-xl text-xs font-mono font-bold cursor-pointer uppercase tracking-wider"
                        >
                          Добавить
                        </button>
                      </div>
                    </form>
                  </div>

                </div>

              </div>

              <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
                <button 
                  onClick={() => {
                    // Reset defaults
                    setCmsData(prev => ({
                      ...prev,
                      title: 'Navykus Global Case Cup: Sustainable Cities',
                      pitch: 'Реши глобальный урбанистический кейс, собери международную команду мечты и защити свое решение перед менторами из MIT и экспертами Smart Cities.',
                      date: '18–25 Сентября 2026',
                      registrationDeadline: '15 Сентября 2026',
                      ageLimit: '14–19 лет',
                      format: 'Международный онлайн-чемпионат (Групповая работа в Miro/Figma, презентация решений в Zoom)',
                      registrationStatus: 'open'
                    }));
                    setIsCmsPanelOpen(false);
                  }}
                  className="px-4 py-2 border border-white/20 hover:border-white text-xs font-mono rounded-xl cursor-pointer text-white/70"
                >
                  Сбросить к дефолту
                </button>
                <button 
                  onClick={handleApplyCmsChanges}
                  className="px-6 py-2 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white hover:opacity-95 text-xs font-mono uppercase tracking-wider font-bold rounded-xl cursor-pointer"
                >
                  Применить изменения
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. HERO BLOCK OF CHAMPIONSHIP */}
        <section className="relative z-10 text-center space-y-6 max-w-4xl mx-auto mb-8">
          {/* Status badge based on CMS registration state */}
          <div className="flex justify-center">
            {cmsData.registrationStatus === 'open' && (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full text-[10px] font-mono uppercase tracking-widest font-semibold animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Регистрация открыта • До {cmsData.registrationDeadline}
              </span>
            )}
            {cmsData.registrationStatus === 'suspended' && (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full text-[10px] font-mono uppercase tracking-widest font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                Приостановлено • Лимит мест почти исчерпан
              </span>
            )}
            {cmsData.registrationStatus === 'closed' && (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-full text-[10px] font-mono uppercase tracking-widest font-semibold">
                <Lock className="w-3 h-3" />
                Регистрация закрыта
              </span>
            )}
          </div>

          <motion.h1 
            key={cmsData.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-light tracking-tight text-brand-dark leading-tight"
          >
            {cmsData.title}
          </motion.h1>

          <motion.p 
            key={cmsData.pitch}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-brand-slate text-sm sm:text-base md:text-lg leading-relaxed font-light max-w-3xl mx-auto text-balance"
          >
            {cmsData.pitch}
          </motion.p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {cmsData.registrationStatus !== 'closed' ? (
              <a
                href="#apply-form-section"
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white rounded-xl text-xs font-mono tracking-widest uppercase font-semibold shadow-lg shadow-[#bc4638]/15 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
              >
                <span>Подать заявку</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <button
                disabled
                className="w-full sm:w-auto px-8 py-3.5 bg-gray-300 text-gray-500 rounded-xl text-xs font-mono tracking-widest uppercase cursor-not-allowed flex items-center justify-center gap-2"
              >
                Регистрация окончена
              </button>
            )}

            <button
              onClick={() => handleNavigateFromChampionship('scenarios')}
              className="w-full sm:w-auto px-8 py-3.5 bg-white border border-[#d8d1cc] text-[#5b6472] hover:border-[#bc4638]/60 hover:text-brand-dark rounded-xl text-xs font-mono tracking-widest uppercase transition-all text-center cursor-pointer"
            >
              Найти команду
            </button>
          </div>
        </section>

        {/* 2. COMPACT KEY INFO CARDS BLOCK */}
        <section className="relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            <div className="bg-white/40 backdrop-blur-md border border-white/80 p-4 rounded-2xl text-left flex flex-col justify-between space-y-2">
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#bc4638]">Даты проведения</span>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-serif font-bold text-brand-dark">{cmsData.date}</p>
                <p className="text-[10px] text-brand-slate font-light">Онлайн-формат</p>
              </div>
            </div>

            <div className="bg-white/40 backdrop-blur-md border border-white/80 p-4 rounded-2xl text-left flex flex-col justify-between space-y-2">
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#bd5b82]">Формат участия</span>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-serif font-bold text-brand-dark">100% Онлайн</p>
                <p className="text-[10px] text-brand-slate font-light">Zoom, Figma, Miro</p>
              </div>
            </div>

            <div className="bg-white/40 backdrop-blur-md border border-white/80 p-4 rounded-2xl text-left flex flex-col justify-between space-y-2">
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#bc4638]">Кто участвует</span>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-serif font-bold text-brand-dark">Возраст {cmsData.ageLimit}</p>
                <p className="text-[10px] text-brand-slate font-light">Школы и колледжи</p>
              </div>
            </div>

            <div className="bg-white/40 backdrop-blur-md border border-white/80 p-4 rounded-2xl text-left flex flex-col justify-between space-y-2">
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#bd5b82]">Язык кубка</span>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-serif font-bold text-brand-dark">{cmsData.lang}</p>
                <p className="text-[10px] text-brand-slate font-light">Синхронный перевод</p>
              </div>
            </div>

            <div className="bg-white/40 backdrop-blur-md border border-white/80 p-4 rounded-2xl text-left flex flex-col justify-between space-y-2">
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#bc4638]">Дедлайн заявок</span>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-serif font-bold text-[#bc4638]">{cmsData.registrationDeadline}</p>
                <p className="text-[10px] text-brand-slate font-light">До 23:59 по МСК</p>
              </div>
            </div>

            <div className="bg-white/40 backdrop-blur-md border border-white/80 p-4 rounded-2xl text-left flex flex-col justify-between space-y-2">
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#bd5b82]">Состав команды</span>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-serif font-bold text-brand-dark">1–5 человек</p>
                <p className="text-[10px] text-[#bd5b82] font-semibold">Поможем найти</p>
              </div>
            </div>

          </div>
        </section>

        {/* 3. ABOUT THE CHAMPIONSHIP (О чём чемпионат) */}
        <section className="relative z-10 py-12 px-6 sm:px-10 bg-white/20 backdrop-blur-lg border border-[#d8d1cc]/40 rounded-3xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-5 space-y-6">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#bc4638] font-bold">О ЧЁМ ЧЕМПИОНАТ</span>
            <h2 className="text-3xl font-serif text-brand-dark leading-tight">
              Разберитесь в реальных вызовах экологии и урбанистики
            </h2>
            <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
              {cmsData.description}
            </p>
            <div className="p-4 bg-white/35 rounded-2xl border border-white/50">
              <span className="text-[9px] font-mono uppercase tracking-wider text-brand-slate block mb-1">Ожидаемый результат (MVP):</span>
              <p className="text-xs text-brand-dark font-medium leading-relaxed font-serif">
                {cmsData.expectedResult}
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            
            {/* Themes list from CMS */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-brand-dark font-semibold">Ключевые направления (Темы кейсов):</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cmsData.themes.map((theme, idx) => (
                  <div key={idx} className="bg-white/40 border border-white/60 p-3.5 rounded-xl text-left flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#bc4638]/5 border border-[#bc4638]/10 font-mono text-[9px] font-bold text-[#bc4638] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-xs text-brand-dark font-medium leading-normal">{theme}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Evaluation Criteria */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-brand-dark font-semibold">Что будет оценивать жюри:</span>
              <div className="space-y-2">
                {cmsData.evaluationCriteria.map((crit, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-brand-slate font-light">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{crit}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* 4. SUITABILITY SEGMENTATION (Кому подойдет кубок) */}
        <section className="relative z-10 space-y-6">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-[10px] font-mono tracking-[0.2em] text-[#bd5b82] uppercase font-bold">КОМУ ПОДОЙДЁТ</span>
            <h2 className="text-2xl sm:text-3xl font-serif text-brand-dark tracking-tight">Подходит каждому активному школьнику</h2>
            <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
              Не важно, умеете ли вы писать код или рисовать презентации. Кубок устроен так, чтобы каждый участник раскрыл свои сильные стороны.
            </p>
          </div>

          {/* Interactive tabs for different archetypes */}
          <div className="flex flex-wrap justify-center gap-2 border-b border-[#d8d1cc]/40 pb-4 max-w-2xl mx-auto">
            {[
              { id: 'all', label: 'Всем участникам' },
              { id: 'teamless', label: 'Если нет команды 🤝' },
              { id: 'creative', label: 'Гуманитариям & Креаторам 🎨' },
              { id: 'ambitious', label: 'Будущим лидерам 🚀' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedSuitabilityTab(tab.id as any)}
                className={`px-4 py-2 text-xs font-mono rounded-xl transition-all border cursor-pointer ${
                  selectedSuitabilityTab === tab.id 
                    ? 'bg-brand-dark text-white border-brand-dark font-bold shadow-sm' 
                    : 'bg-white/40 text-brand-slate hover:text-brand-dark border-white/60 hover:bg-white/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content renders based on selected suitability archetype */}
          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedSuitabilityTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white/30 backdrop-blur-md border border-white/50 rounded-2xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-left"
              >
                {selectedSuitabilityTab === 'all' && (
                  <>
                    <div className="space-y-4">
                      <h4 className="font-serif font-semibold text-lg text-brand-dark">Максимальный рост для каждого</h4>
                      <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
                        Кубок предоставляет равные шансы для ребят с любым уровнем подготовки. Мы даем учебные воркшопы, шаблоны и менторскую поддержку, чтобы ваш первый проект получился профессиональным.
                      </p>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2.5 text-xs text-brand-slate font-light">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Освоение востребованных Soft Skills</span>
                        </li>
                        <li className="flex items-center gap-2.5 text-xs text-brand-slate font-light">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Международное портфолио</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-gradient-to-br from-[#bc4638]/5 to-[#bd5b82]/5 rounded-xl p-5 flex flex-col justify-between border border-white/40">
                      <div>
                        <span className="text-[9px] font-mono uppercase tracking-wider text-[#bc4638] font-bold">СОВЕТ UX-ДИЗАЙНЕРА</span>
                        <p className="text-xs text-brand-slate mt-1.5 font-light leading-relaxed">
                          «Попробуйте распределить роли в команде: один сильный спикер, один генератор идей, один дизайнер слайдов и один аналитик. Такое разделение труда гарантирует лучшие оценки жюри!»
                        </p>
                      </div>
                      <a href="#apply-form-section" className="text-xs font-mono font-bold text-[#bc4638] hover:underline inline-flex items-center gap-1 mt-4">
                        Подать заявку прямо сейчас <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </>
                )}

                {selectedSuitabilityTab === 'teamless' && (
                  <>
                    <div className="space-y-4">
                      <h4 className="font-serif font-semibold text-lg text-brand-dark">Без команды? Мы решим эту проблему!</h4>
                      <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
                        Не бойтесь регистрироваться по одному. Навыкус — это прежде всего нетворкинг-платформа. Мы организуем систему автоматического подбора команд по вашим интересам и компетенциям.
                      </p>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2.5 text-xs text-brand-slate font-light">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Авто-мэтчинг в личном кабинете</span>
                        </li>
                        <li className="flex items-center gap-2.5 text-xs text-brand-slate font-light">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Живая Zoom-сессия знакомств перед стартом</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-brand-dark text-white rounded-xl p-5 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-mono uppercase tracking-wider text-brand-terracotta font-bold">ГОТОВЫЙ СЦЕНАРИЙ</span>
                        <p className="text-xs text-white/85 mt-1.5 font-light leading-relaxed">
                          Регистрируйтесь в индивидуальном формате, в анкете выберите пункт «Ищу команду». Сразу после этого вы получите ссылку на закрытое комьюнити с более чем 100 соавторами.
                        </p>
                      </div>
                      <button
                        onClick={() => handleNavigateFromChampionship('scenarios')}
                        className="text-xs font-mono font-bold text-brand-terracotta hover:underline inline-flex items-center gap-1 mt-4 cursor-pointer text-left"
                      >
                        Перейти к траекториям мэтчинга <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}

                {selectedSuitabilityTab === 'creative' && (
                  <>
                    <div className="space-y-4">
                      <h4 className="font-serif font-semibold text-lg text-brand-dark">Креатив, дизайн и смыслы рулят!</h4>
                      <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
                        Решение кейсов — это не программирование. Это прежде всего исследование людей, генерация ярких метафор, создание красивых визуальных схем и рассказ увлекательных историй.
                      </p>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2.5 text-xs text-brand-slate font-light">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Шаблоны презентаций для Miro / Figma</span>
                        </li>
                        <li className="flex items-center gap-2.5 text-xs text-brand-slate font-light">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Воркшопы по питчингу и сторителлингу</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-[#d8d1cc]/40 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-mono uppercase tracking-wider text-[#bd5b82] font-bold font-semibold">ОТ КРЕАТИВНОГО ДИРЕКТОРА</span>
                        <p className="text-xs text-brand-slate mt-1.5 font-light leading-relaxed">
                          «Кейсы по Sustainable Cities на 50% состоят из понимания психологии горожан и дизайна пространств. Проявите креативность, предложите нестандартное визуальное решение!»
                        </p>
                      </div>
                      <a href="#apply-form-section" className="text-xs font-mono font-bold text-[#bd5b82] hover:underline inline-flex items-center gap-1 mt-4">
                        Зарегистрироваться на кубок <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </>
                )}

                {selectedSuitabilityTab === 'ambitious' && (
                  <>
                    <div className="space-y-4">
                      <h4 className="font-serif font-semibold text-lg text-brand-dark">Заявите о себе лидерам глобального EdTech</h4>
                      <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
                        Наш кубок посещают скауты международных университетов и HR-специалисты крупных компаний. Это ваш шанс получить приглашение на оплачиваемую стажировку или рекомендательное письмо.
                      </p>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2.5 text-xs text-brand-slate font-light">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Рекомендации в ВУЗы</span>
                        </li>
                        <li className="flex items-center gap-2.5 text-xs text-brand-slate font-light">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Стажировки в зеленых стартапах</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-gradient-to-br from-brand-dark/5 to-[#bd5b82]/5 rounded-xl p-5 border border-white/60 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-mono uppercase tracking-wider text-brand-dark font-bold">ПОБЕДИТЕЛЯМ</span>
                        <p className="text-xs text-brand-slate mt-1.5 font-light leading-relaxed">
                          Главный приз кубка — менторская поддержка стартапа до полноценного релиза и рекомендательные письма от профессоров MIT и трекеров Y Combinator.
                        </p>
                      </div>
                      <a href="#apply-form-section" className="text-xs font-mono font-bold text-brand-dark hover:underline inline-flex items-center gap-1 mt-4">
                        Занять свое место в сетке <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* 5. INTERACTIVE TIMELINE BLOCK (Как проходит чемпионат) */}
        <section className="relative z-10 space-y-6">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-[10px] font-mono tracking-[0.2em] text-[#bc4638] uppercase font-bold">ЭТАПЫ И СЦЕНАРИИ</span>
            <h2 className="text-2xl sm:text-3xl font-serif text-brand-dark tracking-tight">Как устроен процесс участия (Timeline)</h2>
            <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
              Мы разработали понятный пошаговый онлайн-маршрут. Кликните на этапы, чтобы изучить подробности и важные маркеры.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
            
            {/* Steps Left List (Clickable menu) */}
            <div className="lg:col-span-5 space-y-2">
              {TIMELINE_STEPS.map((step, idx) => (
                <button
                  key={step.step}
                  onClick={() => setActiveTimelineStep(idx)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all border flex items-center justify-between cursor-pointer ${
                    activeTimelineStep === idx 
                      ? 'bg-brand-dark text-white border-brand-dark shadow-md' 
                      : 'bg-white/40 text-brand-slate hover:text-brand-dark border-white/50 hover:bg-white/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border ${
                      activeTimelineStep === idx ? 'bg-white text-brand-dark border-white' : 'bg-brand-dark/5 text-brand-dark border-brand-dark/10'
                    }`}>
                      {step.step}
                    </span>
                    <span className="text-xs font-serif font-medium truncate max-w-[200px] sm:max-w-none">{step.title}</span>
                  </div>
                  <ArrowRight className={`w-3.5 h-3.5 transition-transform ${activeTimelineStep === idx ? 'translate-x-1' : 'opacity-30'}`} />
                </button>
              ))}
            </div>

            {/* Step Detail Right Viewer */}
            <div className="lg:col-span-7 h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTimelineStep}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white/40 backdrop-blur-md border border-white/80 p-6 sm:p-8 rounded-3xl text-left space-y-6 h-full flex flex-col justify-between shadow-lg"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#d8d1cc]/40 pb-3">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#bc4638] font-bold">ЭТАП 0{TIMELINE_STEPS[activeTimelineStep].step} ИЗ 07</span>
                      <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-bold">
                        {TIMELINE_STEPS[activeTimelineStep].highlight}
                      </span>
                    </div>

                    <h3 className="text-xl font-serif text-brand-dark">
                      {TIMELINE_STEPS[activeTimelineStep].title}
                    </h3>
                    
                    <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
                      {TIMELINE_STEPS[activeTimelineStep].desc}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-[#d8d1cc]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-[10px] text-brand-slate font-mono font-semibold">
                      {activeTimelineStep < 6 ? 'Следующий шаг: ' + TIMELINE_STEPS[activeTimelineStep + 1].title : 'Финиш марафона!'}
                    </span>
                    
                    {activeTimelineStep < 6 ? (
                      <button 
                        onClick={() => setActiveTimelineStep(prev => prev + 1)}
                        className="w-full sm:w-auto px-4 py-2 bg-brand-dark text-white hover:bg-brand-dark/90 rounded-lg text-xs font-mono tracking-wider uppercase transition-all cursor-pointer"
                      >
                        Далее
                      </button>
                    ) : (
                      <a 
                        href="#apply-form-section"
                        className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white rounded-lg text-xs font-mono tracking-wider uppercase text-center cursor-pointer font-bold"
                      >
                        Перейти к анкете
                      </a>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </section>

        {/* 6. CONDITIONS OF PARTICIPATION (Условия участия) */}
        <section className="relative z-10 py-12 px-6 sm:px-12 bg-white/20 backdrop-blur-lg border border-[#d8d1cc]/40 rounded-3xl">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#bc4638] font-bold">ПРАВИЛА И ТРЕБОВАНИЯ</span>
              <h2 className="text-2xl sm:text-3xl font-serif text-brand-dark">Простые условия участия</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left pt-4 border-t border-[#d8d1cc]/30">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-mono text-[#bc4638] uppercase tracking-wider font-bold">Кто может подать заявку?</h4>
                  <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
                    Школьники с 8 по 11 классы, студенты 1–2 курсов колледжей и лицеев. Опыт участия в проектах или хакатонах не обязателен. Мы предоставим базовую логику проектирования и лекции.
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-mono text-[#bd5b82] uppercase tracking-wider font-bold">Нужен ли состав команды?</h4>
                  <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
                    Вы можете зарегистрироваться как готовой командой (от 2 до 5 человек), так и индивидуально. Платформа поможет укомплектовать команду в первые дни перед стартом кубка.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-mono text-[#bc4638] uppercase tracking-wider font-bold">Технические требования</h4>
                  <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
                    Наличие компьютера, ноутбука или планшета со стабильным доступом в интернет. Все инструменты полностью бесплатны и работают прямо в браузере.
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-mono text-[#bd5b82] uppercase tracking-wider font-bold">Что делать, если команды нет?</h4>
                  <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
                    Не беспокойтесь. После заполнения анкеты платформа вышлет вам ссылку в закрытое сообщество в Telegram, где ежедневно проходят онлайн-питчи идей и идет активный набор участников.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#d8d1cc]/30 text-center">
              <p className="text-xs font-mono tracking-wide text-brand-dark">
                Остались сомнения? Напишите нашему куратору в Telegram: <a href="https://t.me/navykus_com" target="_blank" rel="noreferrer" className="text-[#bc4638] font-bold underline">@navykus_com</a>
              </p>
            </div>
          </div>
        </section>

        {/* 7. EXPERTS / JURY BLOCK (Жюри кубка - CMS РЕДАКТИРУЕМЫЙ) */}
        <section className="relative z-10 space-y-6">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-[10px] font-mono tracking-[0.2em] text-[#bd5b82] uppercase font-bold">МЕНТОРЫ И ЖЮРИ</span>
            <h2 className="text-2xl sm:text-3xl font-serif text-brand-dark tracking-tight">Жюри и эксперты чемпионата</h2>
            <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
              Ваши проекты будут оценивать профессора ведущих ВУЗов мира и практики из международных корпораций. Состав управляется через CMS-систему в реальном времени.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {cmsData.mentors.map((mentor, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="bg-white/40 backdrop-blur-md border border-white/60 p-6 rounded-2xl text-left flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#bc4638]/5 to-[#bd5b82]/5 border border-white/80 flex items-center justify-center font-serif text-sm font-bold text-[#bc4638]">
                    {mentor.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-bold text-brand-dark">{mentor.name}</h3>
                    <p className="text-[11px] font-mono text-brand-slate tracking-wide mt-0.5 leading-tight">{mentor.role}</p>
                  </div>
                </div>
                <div className="border-t border-[#d8d1cc]/40 pt-3">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-[#bc4638] block mb-1">Сфера экспертизы:</span>
                  <p className="text-xs text-brand-slate font-light leading-relaxed">{mentor.expertise}</p>
                </div>
              </motion.div>
            ))}

            {/* Interactive CMS Empty State slot */}
            <div className="bg-dashed border-2 border-dashed border-[#d8d1cc]/80 rounded-2xl p-6 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 rounded-full bg-brand-dark/5 text-brand-dark/60 flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-serif font-semibold text-brand-dark">Добавить еще эксперта?</h4>
                <p className="text-[10px] text-brand-slate font-light max-w-[180px] leading-relaxed">Вы можете добавить эксперта с помощью кнопки CMS Управление вверху страницы.</p>
              </div>
              <button
                onClick={() => setIsCmsPanelOpen(true)}
                className="px-3.5 py-1.5 bg-brand-dark text-white rounded-lg text-[10px] font-mono uppercase tracking-wider cursor-pointer font-bold"
              >
                Открыть CMS
              </button>
            </div>
          </div>
        </section>

        {/* 8. WHY PARTICIPATE BLOCK (Почему стоит участвовать) */}
        <section className="relative z-10 space-y-6">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-[10px] font-mono tracking-[0.2em] text-[#bc4638] uppercase font-bold">ЦЕННОСТЬ ДЛЯ ТЕБЯ</span>
            <h2 className="text-2xl sm:text-3xl font-serif text-brand-dark tracking-tight">Зачем участвовать в Navykus Case Cup?</h2>
            <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
              Участие в международном чемпионате — это не просто соревнование, это мощный социальный лифт и образовательный буст.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            
            <div className="bg-white/40 border border-white/60 rounded-2xl p-6 text-left space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#bc4638]/5 text-[#bc4638] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-brand-dark">Реальный международный проект</h3>
              <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
                Добавьте в свое портфолио не абстрактные школьные рефераты, а проработанный экологический кейс, решенный по методологии MIT.
              </p>
            </div>

            <div className="bg-white/40 border border-white/60 rounded-2xl p-6 text-left space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#bd5b82]/5 text-[#bd5b82] flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-brand-dark">Кросс-культурный нетворкинг</h3>
              <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
                Найдите друзей и соавторов из более чем 10 стран. Научитесь координировать задачи в онлайне и работать с разными культурами.
              </p>
            </div>

            <div className="bg-white/40 border border-white/60 rounded-2xl p-6 text-left space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#bc4638]/5 text-[#bc4638] flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-brand-dark">Прокачка навыков будущего</h3>
              <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed">
                Освойте системное проектирование, командную работу, грамотный поиск информации, создание презентаций и навыки защиты идей.
              </p>
            </div>

          </div>
        </section>

        {/* 9. EMBEDDED FORM & UX STATES (Блок заявки) */}
        <section id="apply-form-section" className="relative z-10 max-w-3xl mx-auto scroll-mt-24">
          <div className="bg-white/30 backdrop-blur-2xl border border-white/80 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8">
            
            <div className="text-center space-y-2 border-b border-[#d8d1cc]/40 pb-5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#bc4638] font-bold">ПОДАТЬ ЗАЯВКУ</span>
              <h2 className="text-2xl sm:text-3xl font-serif text-brand-dark">Быстрая регистрация участника</h2>
              <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed max-w-md mx-auto">
                Заполните простую форму ниже, чтобы забронировать место. Мы обработаем анкету и вышлем дальнейшие инструкции на email.
              </p>
            </div>

            {/* SUCCESS OR INPUT STATE */}
            <AnimatePresence mode="wait">
              {formStatus === 'success' && generatedTicket ? (
                <motion.div
                  key="form-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 py-6"
                >
                  <div className="w-16 h-16 bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Check className="w-8 h-8 stroke-[2.5]" />
                  </div>

                  <div className="text-center space-y-1.5">
                    <h3 className="text-xl sm:text-2xl font-serif text-brand-dark">Вы успешно зарегистрированы!</h3>
                    <p className="text-xs sm:text-sm text-brand-slate font-light max-w-md mx-auto leading-relaxed">
                      Мы забронировали место в сетке участников кубка. Письмо со ссылкой в личный кабинет и инструкциями отправлено на указанную вами почту.
                    </p>
                  </div>

                  {/* Virtual Ticket UX Prototype display */}
                  <div className="bg-white border border-[#d8d1cc] rounded-2xl overflow-hidden shadow-md max-w-md mx-auto relative">
                    
                    {/* Ticket Header */}
                    <div className="bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white p-4 text-left flex justify-between items-center">
                      <div>
                        <span className="text-[9px] font-mono uppercase tracking-widest text-white/80">ВХОДНОЙ БИЛЕТ</span>
                        <h4 className="text-xs sm:text-sm font-serif font-semibold mt-0.5 truncate max-w-[200px]">Navykus Global Case Cup</h4>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-white/10 rounded uppercase font-bold text-white border border-white/20">Active</span>
                    </div>

                    {/* Ticket Content */}
                    <div className="p-5 text-left grid grid-cols-2 gap-4 text-xs bg-brand-pink-dust/10">
                      <div>
                        <span className="text-[8px] font-mono uppercase text-brand-slate block">УЧАСТНИК</span>
                        <span className="font-serif font-bold text-brand-dark">{formData.name}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-mono uppercase text-brand-slate block">БИЛЕТ ID</span>
                        <span className="font-mono text-[11px] font-bold text-[#bc4638]">{generatedTicket.ticketId}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-mono uppercase text-brand-slate block">ФОРМАТ С КЛАССАМИ</span>
                        <span className="font-serif font-medium text-brand-dark">Индивидуальный ({formData.hasTeam === 'no' ? 'Ищу команду' : 'В команде'})</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-mono uppercase text-brand-slate block">КЛАСС / ВОЗРАСТ</span>
                        <span className="font-serif font-medium text-brand-dark">{formData.age} лет</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-mono uppercase text-brand-slate block">ДАТА РЕГИСТРАЦИИ</span>
                        <span className="font-mono text-[10px] text-brand-slate">{generatedTicket.regTime}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-mono uppercase text-brand-slate block">МЕСТО В ОТБОРЕ</span>
                        <span className="font-serif font-bold text-brand-dark">№ {generatedTicket.seatNum}</span>
                      </div>
                    </div>

                    {/* Ticket footer helpful links */}
                    <div className="p-3 bg-white border-t border-[#d8d1cc]/40 text-center text-[10px] text-brand-slate font-mono">
                      <span>Покажите билет куратору в Telegram: </span>
                      <a href="https://t.me/navykus_com" target="_blank" rel="noreferrer" className="text-[#bc4638] font-bold underline">@navykus_com</a>
                    </div>
                  </div>

                  {/* Teamless helper logic trigger if user says they don't have a team */}
                  {formData.hasTeam === 'no' && (
                    <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl text-left max-w-md mx-auto space-y-2.5">
                      <div className="flex gap-2 items-center text-amber-800">
                        <Users className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-mono uppercase tracking-wider font-bold">РЕКОМЕНДУЕМЫЙ СЦЕНАРИЙ</span>
                      </div>
                      <p className="text-xs text-brand-slate font-light leading-relaxed">
                        Поскольку вы зарегистрировались без команды, мы советуем вам перейти в наш раздел сценарного мэтчинга, где вы сможете заполнить карточку компетенций и присоединиться к другим активным ребятам.
                      </p>
                      <button
                        onClick={() => handleNavigateFromChampionship('scenarios')}
                        className="text-xs font-mono font-bold text-[#bc4638] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        Перейти к поиску соавторов <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex justify-center pt-2">
                    <button
                      onClick={handleResetForm}
                      className="inline-flex items-center gap-1.5 px-5 py-2 border border-[#d8d1cc] hover:border-brand-dark rounded-xl text-xs font-mono uppercase tracking-wider cursor-pointer transition-all bg-white"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Подать другую анкету</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {cmsData.registrationStatus === 'closed' && (
                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 text-center text-rose-800 space-y-2">
                      <Lock className="w-8 h-8 text-rose-500 mx-auto" />
                      <h4 className="font-serif font-semibold text-base">Регистрация в данный момент закрыта</h4>
                      <p className="text-xs text-rose-700/80 max-w-sm mx-auto leading-relaxed">К сожалению, прием новых заявок на текущий чемпионат Sustainable Cities временно приостановлен или завершен по достижению лимита участников.</p>
                    </div>
                  )}

                  {cmsData.registrationStatus !== 'closed' && (
                    <>
                      {/* Form inputs fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1 text-left">
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-slate">Ваше Имя и Фамилия <span className="text-[#bc4638]">*</span></label>
                          <input 
                            type="text" 
                            required
                            placeholder="Например: Иван Иванов"
                            value={formData.name}
                            onChange={(e) => setFormData(e.target.value)}
                            className="w-full bg-white border border-[#d8d1cc] focus:border-[#bc4638]/60 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-dark transition-all"
                          />
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-slate">Ваш Email <span className="text-[#bc4638]">*</span></label>
                          <input 
                            type="email" 
                            required
                            placeholder="mail@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData(e.target.value)}
                            className="w-full bg-white border border-[#d8d1cc] focus:border-[#bc4638]/60 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-dark transition-all"
                          />
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-slate">Ваш возраст / Класс <span className="text-[#bc4638]">*</span></label>
                          <input 
                            type="text" 
                            required
                            placeholder="Например: 16 лет, 10 класс"
                            value={formData.age}
                            onChange={(e) => setFormData(e.target.value)}
                            className="w-full bg-white border border-[#d8d1cc] focus:border-[#bc4638]/60 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-dark transition-all"
                          />
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-slate">Город и Страна проживания</label>
                          <input 
                            type="text" 
                            placeholder="Например: Алматы, Казахстан"
                            value={formData.city}
                            onChange={(e) => setFormData(e.target.value)}
                            className="w-full bg-white border border-[#d8d1cc] focus:border-[#bc4638]/60 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-dark transition-all"
                          />
                        </div>
                      </div>

                      {/* Contact and team radio logic */}
                      <div className="space-y-4 pt-2">
                        <div className="space-y-1 text-left">
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-slate">Telegram @юзернейм или WhatsApp <span className="text-[#bc4638]">*</span></label>
                          <input 
                            type="text" 
                            required
                            placeholder="Например: @ivan_navykus"
                            value={formData.contact}
                            onChange={(e) => setFormData(e.target.value)}
                            className="w-full bg-white border border-[#d8d1cc] focus:border-[#bc4638]/60 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-dark transition-all"
                          />
                        </div>

                        {/* Interactive Scenario Selection in the form */}
                        <div className="space-y-2 text-left">
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-slate">У вас есть команда для участия?</label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                              { id: 'no', label: 'Нет, ищу команду 🤝', sub: 'Запишем на мэтчинг' },
                              { id: 'yes', label: 'Да, есть команда 👥', sub: 'Укажем тиммейтов' },
                              { id: 'solo', label: 'Участвую один 👤', sub: 'Индивидуальный проект' }
                            ].map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, hasTeam: opt.id }))}
                                className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                                  formData.hasTeam === opt.id 
                                    ? 'bg-[#bc4638]/5 border-[#bc4638]/50 ring-1 ring-[#bc4638]/30' 
                                    : 'bg-white/50 border-[#d8d1cc]/60 hover:bg-white'
                                }`}
                              >
                                <span className="block text-xs font-serif font-bold text-brand-dark">{opt.label}</span>
                                <span className="block text-[10px] text-brand-slate font-light mt-0.5">{opt.sub}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {formData.hasTeam === 'yes' && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-1.5 text-left border-l-2 border-[#bc4638]/40 pl-3.5"
                          >
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-slate">Сколько человек в вашей команде (включая вас)?</label>
                            <select 
                              value={formData.teamSize}
                              onChange={(e) => setFormData(prev => ({ ...prev, teamSize: e.target.value }))}
                              className="bg-white border border-[#d8d1cc] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#bc4638]"
                            >
                              <option value="2">2 человека</option>
                              <option value="3">3 человека</option>
                              <option value="4">4 человека</option>
                              <option value="5">5+ человек</option>
                            </select>
                          </motion.div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1 text-left">
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-slate">Направление интересов</label>
                            <select 
                              value={formData.interests}
                              onChange={(e) => setFormData(prev => ({ ...prev, interests: e.target.value }))}
                              className="w-full bg-white border border-[#d8d1cc] rounded-xl px-3 py-2.5 text-xs text-brand-dark focus:outline-none"
                            >
                              <option value="Урбанистика & Экология">Урбанистика & Экология 🌿</option>
                              <option value="ИТ-разработка & Умный город">ИТ-разработка & Умный город 💻</option>
                              <option value="Дизайн, 3D & Креатив">Дизайн, 3D & Креатив 🎨</option>
                              <option value="Бизнес-анализ & Менеджмент">Бизнес-анализ & Менеджмент 📈</option>
                            </select>
                          </div>

                          <div className="space-y-1 text-left">
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-slate">Ссылка на портфолио / резюме (если есть)</label>
                            <input 
                              type="text" 
                              placeholder="Behance, GitHub, Google Drive..."
                              value={formData.portfolioLink}
                              onChange={(e) => setFormData(prev => ({ ...prev, portfolioLink: e.target.value }))}
                              className="w-full bg-white border border-[#d8d1cc] focus:border-[#bc4638]/60 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-dark transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-slate">Расскажите немного о себе и своих целях на кубок</label>
                          <textarea 
                            rows={3}
                            placeholder="Почему вы хотите участвовать? Какую пользу хотите получить?"
                            value={formData.coverLetter}
                            onChange={(e) => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))}
                            className="w-full bg-white border border-[#d8d1cc] focus:border-[#bc4638]/60 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-dark transition-all"
                          />
                        </div>

                      </div>

                      {/* Submit status displays */}
                      {formStatus === 'error' && formErrorMsg && (
                        <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs text-left rounded-xl font-medium">
                          {formErrorMsg}
                        </div>
                      )}

                      <div className="pt-4 flex flex-col items-center justify-center space-y-3">
                        <button
                          type="submit"
                          disabled={formStatus === 'submitting'}
                          className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white hover:opacity-95 disabled:opacity-50 text-xs font-mono tracking-widest uppercase font-bold rounded-xl transition-all shadow-lg shadow-[#bc4638]/15 cursor-pointer flex items-center justify-center gap-2"
                        >
                          {formStatus === 'submitting' ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Бронируем билет в CMS...</span>
                            </>
                          ) : (
                            <>
                              <span>Отправить анкету участника</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                        <p className="text-[10px] text-brand-slate font-light">Нажимая кнопку, вы соглашаетесь с условиями хранения персональных данных и регламентом Навыкуса.</p>
                      </div>
                    </>
                  )}
                </form>
              )}
            </AnimatePresence>

          </div>
        </section>

        {/* 10. FAQ ACCORDION BLOCK (Ответы на вопросы) */}
        <section className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#bd5b82] font-bold">ОСТАЛИСЬ ВОПРОСЫ?</span>
            <h2 className="text-2xl sm:text-3xl font-serif text-brand-dark">FAQ по чемпионату</h2>
          </div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-white/30 backdrop-blur-sm border border-white/60 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-serif font-semibold text-brand-dark text-xs sm:text-sm md:text-base cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 text-brand-slate/60 transition-transform duration-300 flex-shrink-0 ${activeFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence initial={false}>
                  {activeFaq === idx && (
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

        {/* 11. FINAL CALL TO ACTION (Финальный CTA) */}
        <section className="relative z-10 max-w-5xl mx-auto pb-8">
          <div className="bg-gradient-to-br from-[#bc4638]/10 via-white/40 to-[#bd5b82]/10 backdrop-blur-2xl border border-white/80 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl">
            <span className="text-[10px] font-mono tracking-[0.2em] text-[#bc4638] uppercase font-bold">ГОТОВ ПРИНЯТЬ УЧАСТИЕ?</span>
            
            <h2 className="text-3xl sm:text-4xl font-serif text-brand-dark tracking-tight leading-tight max-w-2xl mx-auto">
              Начни проектировать умные города сегодня
            </h2>
            <p className="text-xs sm:text-sm text-brand-slate font-light leading-relaxed max-w-md mx-auto">
              Осталось {cmsData.maxParticipants} мест на отборочный этап. Успей подать заявку до закрытия регистрационной формы.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {cmsData.registrationStatus !== 'closed' ? (
                <a
                  href="#apply-form-section"
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#bc4638] to-[#bd5b82] text-white hover:opacity-95 text-xs font-mono tracking-widest rounded-xl transition-all shadow-lg shadow-[#bc4638]/15 font-bold uppercase"
                >
                  Подать заявку
                </a>
              ) : (
                <button
                  disabled
                  className="w-full sm:w-auto px-8 py-3.5 bg-gray-300 text-gray-500 rounded-xl text-xs font-mono tracking-widest uppercase cursor-not-allowed font-bold"
                >
                  Регистрация закрыта
                </button>
              )}

              <button
                onClick={() => handleNavigateFromChampionship('scenarios')}
                className="w-full sm:w-auto px-8 py-3.5 bg-white/50 border border-[#d8d1cc] text-[#5b6472] hover:border-[#bc4638]/60 text-xs font-mono tracking-widest rounded-xl transition-all cursor-pointer uppercase font-semibold"
              >
                Найти команду
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
