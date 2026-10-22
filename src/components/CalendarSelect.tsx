import { useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CalendarSelect({ label, value, options, startValue = value, autoFocus, onChange }: {
  label: string;
  value: number;
  options: { value: number; label: string }[];
  startValue?: number;
  autoFocus?: boolean;
  onChange: (value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const selected = options.find(option => option.value === value)?.label;
  function close() { setOpen(false); trigger.current?.focus({ preventScroll: true }); }
  useLayoutEffect(() => {
    if (!open || !list.current || !trigger.current) return;
    const panel = list.current;
    panel.showPopover();
    const position = () => {
      const anchor = trigger.current!.getBoundingClientRect();
      panel.style.width = `${anchor.width}px`;
      panel.style.left = `${Math.max(8, Math.min(anchor.left, window.innerWidth - anchor.width - 8))}px`;
      const below = anchor.bottom + 2;
      panel.style.top = `${below + panel.offsetHeight <= window.innerHeight - 8 ? below : Math.max(8, anchor.top - panel.offsetHeight - 2)}px`;
    };
    position();
    const start = Math.max(0, options.findIndex(option => option.value === startValue));
    panel.querySelectorAll<HTMLButtonElement>('[role="option"]')[start]?.focus({ preventScroll: true });
    panel.scrollTop = start * 24;
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => {
      panel.hidePopover();
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
    };
  }, [open, options, startValue]);
  return <div className="memory-calendar-selector">
    <span>{label}</span>
    <button ref={trigger} autoFocus={autoFocus} className="memory-select-control" type="button" aria-label={`Elegir ${label.toLowerCase()}: ${selected}`} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}>{selected}<ChevronDown size={14} aria-hidden="true" /></button>
    {open && <div ref={list} popover="manual" className="memory-calendar-option-list" role="listbox" aria-label={label}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return; }
        const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="option"]'));
        const index = items.indexOf(document.activeElement as HTMLButtonElement);
        const next = event.key === 'ArrowDown' ? Math.min(index + 1, items.length - 1) : event.key === 'ArrowUp' ? Math.max(index - 1, 0) : event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : null;
        if (next !== null) { event.preventDefault(); items[next]?.focus(); }
      }}>
      {options.map(option => <button key={option.value} type="button" role="option" aria-selected={option.value === value} tabIndex={option.value === startValue ? 0 : -1} onClick={() => { close(); onChange(option.value); }}>{option.label}</button>)}
    </div>}
  </div>;
}
