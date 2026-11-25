'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { OverlayScrollbars } from 'overlayscrollbars';

// Adapted from the user's smooth-scroll.js and scrollbar.js at b6d5abe73e9411591bb7380bd204252dd65906a1.
// https://github.com/Reliaaaa/Internship-BEM-Website-Project/tree/b6d5abe73e9411591bb7380bd204252dd65906a1
export default function ScrollEnhancements() {
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const scrollbar = OverlayScrollbars(
      { target: document.body, cancel: { body: null } },
      { overflow: { x: 'hidden', y: 'scroll' }, scrollbars: { theme: 'os-theme-fintrack', autoHide: 'never', dragScroll: true } },
    );
    let lenis: Lenis | undefined;

    const syncDialogs = () => {
      document.querySelectorAll('dialog, [role="dialog"], textarea').forEach(node => node.setAttribute('data-lenis-prevent', ''));
      if (!lenis) return;
      if (document.querySelector('dialog[open], [role="dialog"]:not([hidden]):not([aria-hidden="true"])')) lenis.stop();
      else lenis.start();
    };
    const syncMotion = () => {
      lenis?.destroy();
      lenis = undefined;
      if (!motion.matches) {
        lenis = new Lenis({ autoRaf: true, smoothWheel: true, syncTouch: false, lerp: 0.1, naiveDimensions: true, prevent: node => !!node.closest('dialog, [role="dialog"], textarea') });
        syncDialogs();
      }
    };
    const observer = new MutationObserver(syncDialogs);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'hidden', 'aria-hidden'] });
    motion.addEventListener('change', syncMotion);
    syncMotion();

    return () => {
      motion.removeEventListener('change', syncMotion);
      observer.disconnect();
      lenis?.destroy();
      scrollbar?.destroy();
    };
  }, []);

  return null;
}
