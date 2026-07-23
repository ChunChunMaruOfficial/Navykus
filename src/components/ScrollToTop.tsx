import { AnimatePresence, motion } from 'motion/react';
import { ArrowUp } from 'lucide-react';

interface ScrollToTopProps {
  show: boolean;
  onClick: () => void;
}

const ScrollToTop = ({ show, onClick }: ScrollToTopProps) => (
  <AnimatePresence>
    {show && (
      <motion.button
        type="button"
        aria-label="Scroll to top"
        onClick={onClick}
        initial={{ opacity: 0, y: 18, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14, scale: 0.94 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/65 bg-white/45 text-[#bc4638] shadow-[0_16px_45px_rgba(27,24,22,0.12)] backdrop-blur-xl transition-[background-color,border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-[#bc4638]/35 hover:bg-white/70 hover:shadow-[0_18px_52px_rgba(188,70,56,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bc4638]/35 sm:bottom-6 sm:right-6 sm:h-12 sm:w-12"
      >
        <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.8} />
      </motion.button>
    )}
  </AnimatePresence>
);

export default ScrollToTop;
