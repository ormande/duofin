import React, { useState, useRef, useEffect } from 'react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  subDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface LiquidDatePickerProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  accentColor?: string;
  helperText?: string;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function LiquidDatePicker({
  label,
  value,
  onChange,
  accentColor = '#0052FF',
  helperText,
}: LiquidDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedDate = value ? parseISO(value) : new Date();
  const [viewMonth, setViewMonth] = useState<Date>(startOfMonth(selectedDate));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      try {
        setViewMonth(startOfMonth(parseISO(value)));
      } catch {
        // ignore
      }
    }
  }, [value]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handleSelectDay = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const monthTitle = format(viewMonth, 'MMMM yyyy', { locale: ptBR });

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full liquid-input rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-2 text-left cursor-pointer hover:border-white/30 transition-all"
      >
        <div className="flex items-center gap-2.5">
          <span
            className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `${accentColor}26`,
              color: accentColor,
              border: `1px solid ${accentColor}55`,
            }}
          >
            <CalendarIcon size={15} />
          </span>
          <div>
            <div className="text-sm font-semibold text-white">
              {value ? format(parseISO(value), "dd 'de' MMM, yyyy", { locale: ptBR }) : 'Escolher data'}
            </div>
          </div>
        </div>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-white/8 text-slate-300">
          {value ? format(parseISO(value), 'dd/MM/yyyy') : '--/--/----'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-76 sm:w-80 z-50 liquid-glass-elevated rounded-3xl border border-white/25 p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          {/* Quick Shortcuts */}
          <div className="flex items-center gap-1.5 mb-3 pb-2.5 border-b border-white/10">
            <button
              type="button"
              onClick={() => handleSelectDay(new Date())}
              className="flex-1 py-1.5 px-2 rounded-xl bg-[#2563EB]/15 hover:bg-[#2563EB]/25 border border-[#2563EB]/40 text-[11px] font-semibold text-[#2563EB] dark:text-[#60A5FA] cursor-pointer transition"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => handleSelectDay(subDays(new Date(), 1))}
              className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-white/8 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-[11px] font-medium text-slate-700 dark:text-slate-200 cursor-pointer transition"
            >
              Ontem
            </button>
            <button
              type="button"
              onClick={() => handleSelectDay(addMonths(selectedDate, 1))}
              className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-white/8 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-[11px] font-medium text-slate-700 dark:text-slate-200 cursor-pointer transition"
            >
              +1 Mês
            </button>
          </div>

          {/* Month Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewMonth(subMonths(viewMonth, 1))}
              className="w-8 h-8 rounded-xl liquid-glass-interactive flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-black dark:hover:text-white cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">{monthTitle}</span>
            <button
              type="button"
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="w-8 h-8 rounded-xl liquid-glass-interactive flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-black dark:hover:text-white cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((dayName) => (
              <div
                key={dayName}
                className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 py-1"
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isSelected = value ? isSameDay(day, selectedDate) : false;
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-9 rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer relative ${
                    isSelected
                      ? 'on-vivid shadow-md scale-105'
                      : isCurrentMonth
                      ? 'text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-white/15'
                      : 'text-slate-400 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: accentColor,
                          border: `1px solid ${accentColor}`,
                        }
                      : undefined
                  }
                >
                  {format(day, 'd')}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
