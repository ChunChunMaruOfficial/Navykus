import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { SearchX } from 'lucide-react';
import { heroFadeUpLarge } from '../motion-animations';

interface NotFoundPageProps {
  onBackToHome: () => void;
}

const NotFoundPage = ({ onBackToHome }: NotFoundPageProps) => {
  const { t } = useTranslation();

  return (
    <main className="relative z-10 min-h-[78vh] px-[6%] pb-20 pt-36 md:px-[10%] md:pb-28 md:pt-44">
      <motion.section
        {...heroFadeUpLarge}
        className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 overflow-hidden rounded-[2rem] border border-white/[0.18] bg-white/[0.14] p-6 shadow-[0_28px_90px_rgba(91,100,114,0.14)] backdrop-blur-2xl sm:p-10 lg:grid-cols-12 lg:p-12"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(188,70,56,0.13),transparent_28%),radial-gradient(circle_at_84%_18%,rgba(189,91,130,0.12),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.32),rgba(255,255,255,0.08))]" />
        <div className="pointer-events-none absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-[#c9a96e]/18 blur-[78px]" />

        <div className="relative lg:col-span-7">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#bc4638]/15 bg-white/45 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#bc4638] shadow-[inset_0_1px_1px_rgba(255,255,255,0.52)]">
            <SearchX className="h-3.5 w-3.5" strokeWidth={1.8} />
            {t('ui.app.notFoundEyebrow')}
          </div>

          <h1 className="max-w-3xl text-4xl font-serif font-light leading-[1.02] tracking-tight text-brand-dark sm:text-5xl md:text-6xl">
            {t('ui.app.notFoundTitle')}
          </h1>

          <p className="mt-5 max-w-xl text-sm font-normal leading-relaxed text-brand-slate sm:text-base md:font-light">
            {t('ui.app.notFoundDescription')}
          </p>
        </div>

        <div className="relative lg:col-span-5">
          <div className="relative mx-auto flex aspect-square w-full max-w-[360px] items-center justify-center rounded-[2rem] border border-white/[0.22] bg-white/[0.16] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_20px_70px_rgba(188,70,56,0.08)] backdrop-blur-xl">
            <div className="absolute inset-5 rounded-[1.5rem] border border-[#d8d1cc]/35" />
            <div className="absolute left-8 top-8 h-3 w-3 rounded-full bg-[#6b8f71]/70 shadow-[0_0_26px_rgba(107,143,113,0.38)]" />
            <div className="absolute bottom-10 right-10 h-4 w-4 rounded-full bg-[#c9a96e]/75 shadow-[0_0_30px_rgba(201,169,110,0.38)]" />
            <div className="relative text-center">
              <div className="font-serif text-[5.5rem] font-semibold leading-none tracking-normal text-brand-dark sm:text-[7rem]">
                404
              </div>
              <div className="mx-auto mt-4 h-px w-28 bg-gradient-to-r from-transparent via-[#bc4638]/45 to-transparent" />
              <div className="mt-4 text-[10px] font-mono font-semibold uppercase tracking-[0.24em] text-brand-slate">
                {t('ui.app.notFoundCodeLabel')}
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </main>
  );
};

export default NotFoundPage;
