import type { Transition } from 'motion/react';

/* ============================================================
 * Animation presets for the Navykus project.
 *
 * Important:
 * - Motion owns transform/opacity.
 * - CSS transition-all must not be used on the same motion.div.
 * - Only the first screen of a page animates in (hero*). Sections further
 *   down are simply there when you scroll to them: the scroll presets keep
 *   their shape so call sites stay untouched, but they start in the final
 *   state and never hide content.
 * ============================================================ */

const smoothEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const shown = { opacity: 1, y: 0, scale: 1 };

const inViewOnce = {
  once: true,
  amount: 0.25,
  margin: '0px 0px -80px 0px',
};

export const fadeUp = {
  initial: false as const,
  whileInView: shown,
  viewport: inViewOnce,
};

export const fadeUpLarge = fadeUp;

export const fadeInScale = fadeUp;

export const heroFadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.5,
    ease: smoothEase,
  } satisfies Transition,
};

export const heroFadeUpLarge = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.6,
    ease: smoothEase,
  } satisfies Transition,
};

export const cardStaggerContainer = {
  initial: false as const,
  whileInView: 'visible',
  viewport: {
    once: true,
    amount: 0.2,
    margin: '0px 0px -80px 0px',
  },
  variants: {
    hidden: {},
    visible: {},
  },
};

export const cardItemFadeUp = {
  variants: {
    hidden: shown,
    visible: shown,
  },
};
