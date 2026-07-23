import { useEffect, useRef, useState } from 'react';

interface ScrollBehavior {
  /** Whether the user has scrolled past the threshold (~520px) */
  showScrollTop: boolean;
  /** Whether the header should be visible */
  showHeader: boolean;
  /** Smooth-scroll to top of page */
  scrollToTop: () => void;
}

const useScrollBehavior = (): ScrollBehavior => {
  const [showHeader, setShowHeader] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const prevScrollYRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        setShowScrollTop(currentScrollY > 520);

        if (currentScrollY <= 40) {
          setShowHeader(true);
        } else if (currentScrollY < prevScrollYRef.current) {
          setShowHeader(true);
        } else {
          setShowHeader(false);
        }

        prevScrollYRef.current = currentScrollY;
        tickingRef.current = false;
      });
    };

    prevScrollYRef.current = window.scrollY;
    setShowScrollTop(window.scrollY > 520);

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return { showScrollTop, showHeader, scrollToTop };
};

export default useScrollBehavior;
