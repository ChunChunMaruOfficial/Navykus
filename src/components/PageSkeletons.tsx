import React from 'react';
import { motion } from 'motion/react';

export type SkeletonPage = 'home' | 'about' | 'championship' | 'activities' | 'find-team' | 'blog' | 'not-found' | 'opportunities';

const pageAccent: Record<SkeletonPage, string> = {
  home: 'from-[#bc4638]/18 via-[#f38b76]/10 to-[#bd5b82]/16',
  about: 'from-[#bd5b82]/16 via-white/20 to-[#bc4638]/12',
  championship: 'from-[#bc4638]/18 via-[#c9a96e]/12 to-[#6b8f71]/14',
  activities: 'from-[#6b8f71]/14 via-[#bc4638]/10 to-[#bd5b82]/14',
  'find-team': 'from-[#3d6b8f]/12 via-[#bd5b82]/12 to-[#bc4638]/14',
  blog: 'from-[#bc4638]/14 via-[#c9a96e]/12 to-[#6b8f71]/14',
  'not-found': 'from-[#bc4638]/14 via-[#bd5b82]/12 to-[#c9a96e]/12',
  opportunities: 'from-[#bc4638]/14 via-[#bd5b82]/12 to-[#c9a96e]/12',
};

const fadeIn = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

function Bone({
  className = '',
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <span
      className={`skeleton-bone block overflow-hidden rounded-full ${className}`}
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

function GlassBlock({
  children,
  className = '',
  delay = 0,
}: {
  children?: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={`skeleton-card bg-white/[0.14] glass-card border border-white/[0.18] ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

function BackBone() {
  return (
    <div className="flex justify-start mb-8 sm:mb-12">
      <GlassBlock className="h-10 w-36 rounded-xl px-3 flex items-center gap-2">
        <Bone className="h-3 w-3" />
        <Bone className="h-2.5 w-20" delay={0.08} />
      </GlassBlock>
    </div>
  );
}

function HeroTitleSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <section className="relative z-10 text-center max-w-4xl mx-auto py-12 md:py-20">
      <div className="flex justify-center mb-5">
        <Bone className="h-3 w-28 rounded-md" />
      </div>
      <div className="space-y-4 flex flex-col items-center">
        <Bone className={`h-12 sm:h-14 md:h-16 ${wide ? 'w-[92%]' : 'w-[72%]'} max-w-2xl rounded-2xl`} delay={0.06} />
        <Bone className="h-4 w-[84%] max-w-xl rounded-lg" delay={0.12} />
        <Bone className="h-4 w-[58%] max-w-md rounded-lg" delay={0.18} />
      </div>
      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
        <Bone className="h-12 w-full sm:w-48 rounded-xl" delay={0.24} />
        <Bone className="h-12 w-full sm:w-44 rounded-xl" delay={0.3} />
      </div>
    </section>
  );
}

function CardGridSkeleton({
  count,
  columns = 'md:grid-cols-2 lg:grid-cols-3',
  image = false,
}: {
  count: number;
  columns?: string;
  image?: boolean;
}) {
  return (
    <div className={`grid grid-cols-1 ${columns} gap-6`}>
      {Array.from({ length: count }).map((_, index) => (
        <GlassBlock key={index} className="rounded-2xl overflow-hidden" delay={index * 0.04}>
          {image && <Bone className="h-40 w-full rounded-none" delay={index * 0.04} />}
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Bone className="h-10 w-10 rounded-xl" delay={index * 0.04 + 0.05} />
              <Bone className="h-6 w-20 rounded-full" delay={index * 0.04 + 0.1} />
            </div>
            <div className="space-y-2.5">
              <Bone className="h-5 w-3/4 rounded-md" delay={index * 0.04 + 0.15} />
              <Bone className="h-3 w-full rounded-md" delay={index * 0.04 + 0.2} />
              <Bone className="h-3 w-5/6 rounded-md" delay={index * 0.04 + 0.25} />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Bone className="h-6 w-20 rounded-full" delay={index * 0.04 + 0.3} />
              <Bone className="h-6 w-16 rounded-full" delay={index * 0.04 + 0.35} />
              <Bone className="h-6 w-24 rounded-full" delay={index * 0.04 + 0.4} />
            </div>
          </div>
        </GlassBlock>
      ))}
    </div>
  );
}

function AboutSkeleton() {
  return (
    <>
      <BackBone />
      <HeroTitleSkeleton />

      <GlassBlock className="rounded-3xl px-6 sm:px-12 py-12 md:py-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-[#bd5b82]/8 to-[#bc4638]/6" />
        <div className="relative max-w-4xl mx-auto space-y-8">
          <div className="flex justify-center">
            <Bone className="h-10 w-52 rounded-xl" />
          </div>
          <Bone className="h-7 w-full rounded-xl" delay={0.08} />
          <Bone className="h-7 w-[78%] mx-auto rounded-xl" delay={0.14} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 pt-2">
            <div className="space-y-3">
              <Bone className="h-3 w-full rounded-md" />
              <Bone className="h-3 w-11/12 rounded-md" delay={0.06} />
              <Bone className="h-3 w-4/5 rounded-md" delay={0.12} />
            </div>
            <div className="space-y-3">
              <Bone className="h-3 w-full rounded-md" delay={0.1} />
              <Bone className="h-3 w-10/12 rounded-md" delay={0.16} />
              <Bone className="h-3 w-9/12 rounded-md" delay={0.22} />
            </div>
          </div>
        </div>
      </GlassBlock>

      <section className="py-16 md:py-24">
        <div className="text-center space-y-3 mb-10">
          <Bone className="h-9 w-72 max-w-full mx-auto rounded-xl" />
          <Bone className="h-3 w-[68%] mx-auto rounded-md" delay={0.08} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 flex flex-row lg:flex-col overflow-hidden gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <GlassBlock key={index} className="h-20 w-64 lg:w-full flex-shrink-0 rounded-2xl p-5" delay={index * 0.05}>
                <Bone className="h-3 w-36 rounded-md" />
                <Bone className="h-2.5 w-44 mt-3 rounded-md" delay={index * 0.05 + 0.08} />
              </GlassBlock>
            ))}
          </div>
          <GlassBlock className="lg:col-span-7 rounded-3xl p-6 sm:p-8 space-y-6">
            <Bone className="h-3 w-44 rounded-md" />
            <Bone className="h-8 w-56 rounded-xl" delay={0.06} />
            <div className="space-y-3 pt-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Bone className="h-4 w-4 rounded-full" delay={index * 0.04} />
                  <Bone className="h-3 w-[78%] rounded-md" delay={index * 0.04 + 0.08} />
                </div>
              ))}
            </div>
            <Bone className="h-11 w-48 rounded-xl" delay={0.28} />
          </GlassBlock>
        </div>
      </section>

      <section className="pb-8 md:pb-12">
        <CardGridSkeleton count={6} />
      </section>
    </>
  );
}

function ChampionshipSkeleton() {
  return (
    <>
      <BackBone />
      <section className="relative z-10 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-7">
            <Bone className="h-7 w-48 rounded-full" />
            <div className="space-y-4">
              <Bone className="h-14 sm:h-16 w-full rounded-2xl" delay={0.06} />
              <Bone className="h-14 sm:h-16 w-10/12 rounded-2xl" delay={0.12} />
            </div>
            <div className="space-y-3">
              <Bone className="h-4 w-full rounded-md" delay={0.18} />
              <Bone className="h-4 w-4/5 rounded-md" delay={0.24} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <GlassBlock key={index} className="rounded-2xl p-4 space-y-3" delay={index * 0.05}>
                  <Bone className="h-8 w-8 rounded-xl" />
                  <Bone className="h-3 w-16 rounded-md" delay={0.08} />
                  <Bone className="h-5 w-20 rounded-md" delay={0.14} />
                </GlassBlock>
              ))}
            </div>
          </div>
          <GlassBlock className="lg:col-span-5 rounded-3xl p-6 space-y-5">
            <Bone className="h-6 w-44 rounded-xl" />
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-start gap-3">
                <Bone className="h-9 w-9 rounded-xl" delay={index * 0.05} />
                <div className="flex-1 space-y-2">
                  <Bone className="h-3 w-24 rounded-md" delay={index * 0.05 + 0.06} />
                  <Bone className="h-3 w-full rounded-md" delay={index * 0.05 + 0.12} />
                </div>
              </div>
            ))}
          </GlassBlock>
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <GlassBlock className="lg:col-span-5 rounded-3xl p-6 space-y-5">
            <Bone className="h-8 w-60 rounded-xl" />
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="flex gap-4">
                <Bone className="h-8 w-8 rounded-full" delay={index * 0.04} />
                <div className="flex-1 space-y-2">
                  <Bone className="h-3 w-2/3 rounded-md" delay={index * 0.04 + 0.06} />
                  <Bone className="h-3 w-full rounded-md" delay={index * 0.04 + 0.12} />
                </div>
              </div>
            ))}
          </GlassBlock>
          <GlassBlock className="lg:col-span-7 rounded-3xl p-6 sm:p-8 space-y-6">
            <Bone className="h-9 w-72 max-w-full rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Bone className="h-3 w-24 rounded-md" delay={index * 0.03} />
                  <Bone className="h-10 w-full rounded-xl" delay={index * 0.03 + 0.06} />
                </div>
              ))}
            </div>
            <Bone className="h-24 w-full rounded-2xl" delay={0.28} />
            <Bone className="h-12 w-full sm:w-56 rounded-xl" delay={0.34} />
          </GlassBlock>
        </div>
      </section>
    </>
  );
}

function ActivitiesSkeleton() {
  return (
    <>
      <BackBone />
      <HeroTitleSkeleton />
      <section className="py-4 md:py-8">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <Bone key={index} className="h-10 w-28 sm:w-36 rounded-xl" delay={index * 0.04} />
          ))}
        </div>
      </section>
      <section className="py-8 md:py-12">
        <CardGridSkeleton count={6} image />
      </section>
      <section className="py-12 md:py-20">
        <div className="text-center space-y-3 mb-10">
          <Bone className="h-9 w-72 max-w-full mx-auto rounded-xl" />
          <Bone className="h-3 w-[64%] mx-auto rounded-md" delay={0.08} />
        </div>
        <CardGridSkeleton count={4} columns="md:grid-cols-2 lg:grid-cols-4" />
      </section>
    </>
  );
}

function FindTeamSkeleton() {
  return (
    <>
      <section className="relative z-10 pt-8 pb-12 md:pt-16 md:pb-16">
        <div className="space-y-8">
          <BackBone />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7 space-y-5">
              <Bone className="h-7 w-52 rounded-full" />
              <Bone className="h-14 sm:h-16 w-full rounded-2xl" delay={0.08} />
              <Bone className="h-14 sm:h-16 w-3/4 rounded-2xl" delay={0.14} />
              <div className="space-y-3">
                <Bone className="h-4 w-full rounded-md" delay={0.2} />
                <Bone className="h-4 w-2/3 rounded-md" delay={0.26} />
              </div>
            </div>
            <GlassBlock className="lg:col-span-5 rounded-3xl p-5 space-y-4">
              <Bone className="h-4 w-32 rounded-md" />
              <Bone className="h-12 w-full rounded-xl" delay={0.06} />
              <div className="grid grid-cols-2 gap-3">
                <Bone className="h-10 w-full rounded-xl" delay={0.12} />
                <Bone className="h-10 w-full rounded-xl" delay={0.18} />
              </div>
            </GlassBlock>
          </div>

          <GlassBlock className="rounded-3xl p-4 sm:p-5 space-y-4">
            <Bone className="h-12 w-full rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Bone className="h-3 w-20 rounded-md" delay={index * 0.04} />
                  <Bone className="h-10 w-full rounded-xl" delay={index * 0.04 + 0.08} />
                </div>
              ))}
            </div>
          </GlassBlock>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="mb-6 flex items-center justify-between">
          <Bone className="h-3 w-36 rounded-md" />
          <Bone className="h-3 w-24 rounded-md" delay={0.08} />
        </div>
        <CardGridSkeleton count={6} columns="md:grid-cols-2" />
      </section>
    </>
  );
}

function HomeSkeleton() {
  return (
    <>
      <HeroTitleSkeleton wide />
      <section className="py-10 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <GlassBlock key={index} className="rounded-2xl p-5 text-center space-y-3" delay={index * 0.05}>
              <Bone className="h-10 w-16 mx-auto rounded-xl" />
              <Bone className="h-3 w-24 mx-auto rounded-md" delay={0.08} />
            </GlassBlock>
          ))}
        </div>
      </section>
      <CardGridSkeleton count={6} />
    </>
  );
}

function PageBody({ page }: { page: SkeletonPage }) {
  if (page === 'about') return <AboutSkeleton />;
  if (page === 'championship') return <ChampionshipSkeleton />;
  if (page === 'activities') return <ActivitiesSkeleton />;
  if (page === 'find-team') return <FindTeamSkeleton />;
  return <HomeSkeleton />;
}

export default function PageSkeleton({ page }: { page: SkeletonPage }) {
  return (
    <motion.div
      {...fadeIn}
      className="relative z-10 w-full min-h-[70vh] pt-24 pb-16 text-brand-dark"
      aria-hidden="true"
    >
      <div className="absolute inset-x-0 top-16 h-72 pointer-events-none overflow-hidden">
        <div className={`absolute left-1/2 top-0 h-64 w-[min(760px,88vw)] -translate-x-1/2 rounded-full blur-[90px] opacity-70 bg-gradient-to-r ${pageAccent[page]} skeleton-glow`} />
      </div>
      <div className="relative max-w-6xl mx-auto px-[6%] md:px-[10%]">
        <PageBody page={page} />
      </div>
    </motion.div>
  );
}
