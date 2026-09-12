import { useEffect, useRef } from 'react';

// Stack of the open popups: Esc closes only the topmost one, and the page stays locked
// (no background scrolling) until the last popup is closed.
const stack: Array<{ current: () => void }> = [];
let savedOverflow = '';

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || stack.length === 0) return;
  event.preventDefault();
  stack[stack.length - 1].current();
};

/** Esc-to-close + background scroll lock for a popup that is open while `active` is true. */
export default function useModalBehavior(onClose: () => void, active = true) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!active) return undefined;
    const entry = { get current() { return onCloseRef.current; } };
    if (stack.length === 0) {
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    }
    stack.push(entry);

    return () => {
      const index = stack.indexOf(entry);
      if (index !== -1) stack.splice(index, 1);
      if (stack.length === 0) {
        document.body.style.overflow = savedOverflow;
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [active]);
}
