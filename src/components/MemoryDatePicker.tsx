import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import CalendarSelect from './CalendarSelect';
import { memoryDateIso } from '../memoryDate';
import type { Decade } from '../types';

const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const weekdays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const yearOptions = Array.from({ length: 40 }, (_, index) => ({ value: 1970 + index, label: String(1970 + index) }));
const monthOptions = months.map((label, value) => ({ value, label }));
const isoDay = (year: number, month: number, day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

export default function MemoryDatePicker({ initialDate, decade, onChange }: { initialDate?: string; decade: Decade; onChange: () => void }) {
  const [value, setValue] = useState(initialDate ?? '');
  const [open, setOpen] = useState(false);
  const [view, setView] = useState({ year: initialDate ? Number(initialDate.slice(0, 4)) : decade, month: initialDate ? Number(initialDate.slice(5, 7)) - 1 : 0 });
  const trigger = useRef<HTMLButtonElement>(null);
  const inputBox = useRef<HTMLDivElement>(null);
  const calendar = useRef<HTMLElement>(null);
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 900px)');
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useLayoutEffect(() => {
    if (!open || !desktop || !calendar.current) return;
    const panel = calendar.current;
    panel.showPopover();
    const position = () => {
      const anchor = inputBox.current?.getBoundingClientRect();
      if (!anchor) return;
      panel.style.left = `${Math.max(8, Math.min(anchor.left, window.innerWidth - panel.offsetWidth - 8))}px`;
      panel.style.top = `${Math.max(8, anchor.top - panel.offsetHeight - 6)}px`;
    };
    position();
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => {
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
      panel.hidePopover();
      panel.style.removeProperty('left');
      panel.style.removeProperty('top');
    };
  }, [open, desktop, view.year, view.month]);
  const offset = (new Date(view.year, view.month, 1).getDay() + 6) % 7;
  const days = new Date(view.year, view.month + 1, 0).getDate();
  function close() { setOpen(false); trigger.current?.focus(); }
  function moveMonth(delta: number) {
    const date = new Date(view.year, view.month + delta, 1);
    if (date.getFullYear() >= 1970 && date.getFullYear() <= 2009) setView({ year: date.getFullYear(), month: date.getMonth() });
  }
  return <div className="memory-date-picker" onKeyDown={event => {
    if (open && event.key === 'Escape') {
      event.preventDefault(); event.stopPropagation();
      close();
    }
  }}>
    <label htmlFor="memory-date">Fecha del recuerdo</label>
    <div ref={inputBox} className="memory-date-input">
      <input id="memory-date" name="date" type="date" required min="1970-01-01" max="2009-12-31" value={value} onChange={event => {
        const date = event.target.value;
        setValue(date);
        onChange();
        if (memoryDateIso(date)) setView({ year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)) - 1 });
      }} />
      <button ref={trigger} type="button" aria-label="Elegir fecha en el calendario" aria-expanded={open} aria-controls="memory-calendar" onClick={() => {
        setOpen(!open);
      }}><CalendarDays size={20} aria-hidden="true" /></button>
    </div>
    {open && <section ref={calendar} popover={desktop ? 'manual' : undefined} id="memory-calendar" className="memory-calendar" aria-label="Calendario del recuerdo">
      <header>
        <button type="button" aria-label="Mes anterior" disabled={view.year === 1970 && view.month === 0} onClick={() => moveMonth(-1)}><ChevronLeft size={18} aria-hidden="true" /></button>
        <strong aria-live="polite">{months[view.month]} {view.year}</strong>
        <button type="button" aria-label="Mes siguiente" disabled={view.year === 2009 && view.month === 11} onClick={() => moveMonth(1)}><ChevronRight size={18} aria-hidden="true" /></button>
      </header>
      <div className="memory-calendar-selects">
        <CalendarSelect label="Año" value={view.year} options={yearOptions} startValue={decade} onChange={year => setView({ ...view, year })} />
        <CalendarSelect label="Mes" value={view.month} options={monthOptions} onChange={month => setView({ ...view, month })} />
      </div>
      <div className="memory-calendar-days" role="group" aria-label="Días del mes">
        {weekdays.map(day => <span key={day} aria-hidden="true">{day}</span>)}
        {Array.from({ length: offset }, (_, index) => <span key={`empty-${index}`} aria-hidden="true" />)}
        {Array.from({ length: days }, (_, index) => {
          const day = index + 1;
          const date = isoDay(view.year, view.month, day);
          return <button key={date} type="button" aria-label={`${day} de ${months[view.month].toLowerCase()} de ${view.year}`} aria-pressed={date === value} onClick={() => { setValue(date); onChange(); close(); }}>{day}</button>;
        })}
      </div>
      <button type="button" className="memory-calendar-close" onClick={close}>Cerrar calendario</button>
    </section>}
  </div>;
}
