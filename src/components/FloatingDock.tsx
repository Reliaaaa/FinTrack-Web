'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CircleHelp, MoreHorizontal, Plus, type LucideIcon } from 'lucide-react';
import { MotionButton } from './MotionButton';

export type DockItem<T extends string> = {
  id: T;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  compact?: boolean;
};

type IndicatorPosition = { left: number; top: number; width: number; height: number };

export function FloatingDock<T extends string>({ items, active, onSelect, onCreate }: {
  items: readonly DockItem<T>[];
  active: T;
  onSelect: (id: T) => void;
  onCreate: () => void;
}) {
  const nav = useRef<HTMLElement>(null);
  const details = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  const extraItems = items.filter(item => !item.compact);
  const [indicator, setIndicator] = useState<IndicatorPosition | null>(null);

  useLayoutEffect(() => {
    const dock = nav.current;
    if (!dock) return;

    const controls = [...dock.querySelectorAll<HTMLElement>(':scope > .dock-item, :scope > .dock-more > summary')];
    const measure = () => {
      const control = controls.find(item => item.offsetWidth > 0 &&
        (item.getAttribute('aria-current') === 'page' || item.dataset.current === 'true'));
      if (!control) return;

      const left = control.offsetLeft;
      const top = control.offsetTop;
      const width = control.offsetWidth;
      const height = control.offsetHeight;
      setIndicator(previous => (
        previous?.left === left && previous.top === top && previous.width === width && previous.height === height
          ? previous
          : { left, top, width, height }
      ));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(dock);
    controls.forEach(control => observer.observe(control));
    return () => observer.disconnect();
  }, [active, items]);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !details.current?.contains(event.target)) {
        details.current?.removeAttribute('open');
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);

  const closeMore = () => {
    details.current?.removeAttribute('open');
    summary.current?.focus();
  };

  return (
    <nav ref={nav} className="floating-dock" aria-label="Navigasi utama"
      data-indicator-ready={indicator !== null || undefined}>
      {indicator && <span className="dock-indicator" aria-hidden="true" style={{
        width: indicator.width,
        height: indicator.height,
        transform: `translate(${indicator.left}px, ${indicator.top}px)`,
      }} />}
      {items.map(item => (
        <MotionButton key={item.id} type="button" className="dock-item"
          data-compact={item.compact || undefined}
          aria-label={item.label} aria-current={active === item.id ? 'page' : undefined}
          onClick={() => onSelect(item.id)}>
          <item.icon size={20} strokeWidth={1.8} aria-hidden="true" />
          {item.shortLabel ?? item.label}
        </MotionButton>
      ))}
      <details className="dock-more" ref={details}
        onBlur={event => {
          if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) {
            event.currentTarget.open = false;
          }
        }}
        onKeyDown={event => {
          if (event.key === 'Escape' && event.currentTarget.open) {
            event.preventDefault();
            closeMore();
          }
        }}>
        <summary ref={summary} className="dock-item" data-current={extraItems.some(item => item.id === active) || undefined}>
          <MoreHorizontal size={20} aria-hidden="true" />
          Lainnya
        </summary>
        <div className="dock-more-panel">
          {extraItems.map(item => (
            <MotionButton key={item.id} type="button" className="dock-menu-entry"
              aria-current={active === item.id ? 'page' : undefined}
              onClick={() => { closeMore(); onSelect(item.id); }}>
              <item.icon size={18} aria-hidden="true" />
              {item.label}
            </MotionButton>
          ))}
          <a className="dock-menu-entry" href="https://github.com/Reliaaaa/FinTrack-Web#readme" target="_blank" rel="noreferrer">
            <CircleHelp size={18} aria-hidden="true" />
            Lihat panduan
          </a>
        </div>
      </details>
      <MotionButton type="button" className="dock-create" aria-label="Catat Transaksi" onClick={onCreate}>
        <Plus size={23} aria-hidden="true" />
        Tambah
      </MotionButton>
    </nav>
  );
}
