import { useEffect } from 'react';

export function useBodyScrollLock() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const scrollY = window.scrollY;
    const original = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      htmlOverflow: document.documentElement.style.overflow,
    };

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = original.overflow;
      document.body.style.position = original.position;
      document.body.style.top = original.top;
      document.body.style.width = original.width;
      document.documentElement.style.overflow = original.htmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, []);
}
