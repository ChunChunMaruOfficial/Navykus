import type { Transition } from 'motion/react';

/* ============================================================
 * Animation presets for the Navykus project.
 * 
 * Важно:
 * - Motion анимирует transform/opacity.
 * - CSS transition-all нельзя ставить на тот же motion.div.
 * ============================================================ */

const smoothEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const fadeUp = {
  initial: { opacity: 0, y: 25 },
  whileInView: { opacity: 1, y: 0 },
  viewport: {
    once: true,
    amount: 0.25,
    margin: '0px 0px -80px 0px',
  },
  transition: {
    duration: 0.65,
    ease: smoothEase,
  } satisfies Transition,
};

export const fadeUpLarge = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: {
    once: true,
    amount: 0.25,
    margin: '0px 0px -80px 0px',
  },
  transition: {
    duration: 0.75,
    ease: smoothEase,
  } satisfies Transition,
};

export const fadeInScale = {
  initial: { opacity: 0, scale: 0.98 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: {
    once: true,
    amount: 0.25,
  },
  transition: {
    duration: 0.7,
    ease: smoothEase,
  } satisfies Transition,
};

export const heroFadeUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.55,
    ease: smoothEase,
  } satisfies Transition,
};

export const heroFadeUpLarge = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.75,
    ease: smoothEase,
  } satisfies Transition,
};

export const cardStaggerContainer = {
  initial: 'hidden',
  whileInView: 'visible',
  viewport: {
    once: true,
    amount: 0.2,
    margin: '0px 0px -80px 0px',
  },
  variants: {
    hidden: {},
    visible: {
      transition: {
        delayChildren: 0.04,
        staggerChildren: 0.08,
      },
    },
  },
};

export const cardItemFadeUp = {
  variants: {
    hidden: {
      opacity: 0,
      y: 28,
      scale: 0.985,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: smoothEase,
      } satisfies Transition,
    },
  },
};