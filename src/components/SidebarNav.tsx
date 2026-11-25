'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { MotionButton } from './MotionButton';

export function SidebarNav<T extends string>({ items, active, onSelect }: {
  items: readonly { id: T; label: string; icon: LucideIcon }[];
  active: T;
  onSelect: (id: T) => void;
}) {
  const nav = useRef<HTMLElement>(null);
  const [hover, setHover] = useState<T | null>(null);
  const [focus, setFocus] = useState<T | null>(null);
  const [position, setPosition] = useState<{ top: number; height: number } | null>(null);
  const highlighted = hover ?? focus ?? active;

  useLayoutEffect(() => {
    const container = nav.current;
    if (!container) return;
    const item = Array.from(container.querySelectorAll<HTMLButtonElement>('button[data-menu-item]'))
      .find(button => button.dataset.menuItem === highlighted);
    if (!item) return;

    const measure = () => {
      const top = item.offsetTop;
      const height = item.offsetHeight;
      setPosition(previous => previous?.top === top && previous.height === height ? previous : { top, height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(item);
    return () => observer.disconnect();
  }, [highlighted]);

  return (
    <nav ref={nav} className="sidebar-nav" aria-label="Navigasi utama"
      data-indicator={position?.height ? 'ready' : undefined}
      onPointerLeave={() => setHover(null)}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocus(null); }}>
      <span className="sidebar-indicator" aria-hidden="true" style={position ? {
        height: position.height,
        transform: `translateY(${position.top}px)`,
      } : undefined} />
      {items.map(item => <MotionButton
        key={item.id}
        type="button"
        data-menu-item={item.id}
        data-highlighted={item.id === highlighted || undefined}
        aria-current={active === item.id ? 'page' : undefined}
        className={`nav-item ${active === item.id ? 'active' : ''}`}
        onPointerEnter={event => { if (event.pointerType === 'mouse') setHover(item.id); }}
        onFocus={event => setFocus(event.currentTarget.matches(':focus-visible') ? item.id : null)}
        onClick={() => { setHover(null); setFocus(null); onSelect(item.id); }}
      >
        <item.icon size={19} strokeWidth={1.9} />
        {item.label}
      </MotionButton>)}
    </nav>
  );
}
