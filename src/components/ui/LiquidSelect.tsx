import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { DynamicIcon } from '../../lib/icons';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: string;
  color?: string;
  badge?: string;
}

interface LiquidSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchable?: boolean;
  className?: string;
}

export function LiquidSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecione uma opção...',
  searchable = false,
  className = '',
}: LiquidSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredOptions = searchable
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          (o.sublabel && o.sublabel.toLowerCase().includes(search.toLowerCase()))
      )
    : options;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full liquid-input rounded-2xl px-3.5 py-2.5 text-left flex items-center justify-between gap-2 cursor-pointer hover:border-white/30 transition-all"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {selectedOption?.icon && (
            <span
              className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
              style={{
                backgroundColor: `${selectedOption.color || '#0052FF'}28`,
                color: selectedOption.color || '#0052FF',
                border: `1px solid ${selectedOption.color || '#0052FF'}55`,
              }}
            >
              <DynamicIcon name={selectedOption.icon} size={15} />
            </span>
          )}
          {!selectedOption?.icon && selectedOption?.color && (
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0"
              style={{ backgroundColor: selectedOption.color }}
            />
          )}
          <div className="truncate">
            <div className="text-sm font-medium text-white truncate">
              {selectedOption ? selectedOption.label : <span className="text-slate-400">{placeholder}</span>}
            </div>
            {selectedOption?.sublabel && (
              <div className="text-[11px] text-slate-400 truncate">{selectedOption.sublabel}</div>
            )}
          </div>
        </div>

        <ChevronDown
          size={16}
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#00D4FF]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 z-50 liquid-glass-elevated rounded-2xl border border-white/25 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {searchable && (
            <div className="p-2.5 border-b border-white/10">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full bg-white/5 border border-white/15 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#0052FF]"
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">Nenhuma opção encontrada</div>
            ) : (
              filteredOptions.map((opt) => {
                const active = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full px-3 py-2 rounded-xl flex items-center justify-between gap-2 text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-[#0052FF]/35 border border-[#0052FF]/60 text-white'
                        : 'hover:bg-white/10 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {opt.icon && (
                        <span
                          className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${opt.color || '#0052FF'}28`,
                            color: opt.color || '#0052FF',
                            border: `1px solid ${opt.color || '#0052FF'}55`,
                          }}
                        >
                          <DynamicIcon name={opt.icon} size={15} />
                        </span>
                      )}
                      {!opt.icon && opt.color && (
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: opt.color }}
                        />
                      )}
                      <div className="truncate">
                        <div className="text-xs font-semibold truncate">{opt.label}</div>
                        {opt.sublabel && (
                          <div className="text-[11px] text-slate-400 truncate">{opt.sublabel}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {opt.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-200">
                          {opt.badge}
                        </span>
                      )}
                      {active && <Check size={15} className="text-[#00D4FF]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
