import React, { useState } from 'react';
import { ICON_CATALOG, VIVID_PALETTE, DynamicIcon } from '../../lib/icons';
import { Search, Check } from 'lucide-react';

interface IconAndColorPickerProps {
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

export function IconAndColorPicker({
  selectedIcon,
  onSelectIcon,
  selectedColor,
  onSelectColor,
}: IconAndColorPickerProps) {
  const [search, setSearch] = useState('');

  const iconEntries = Object.entries(ICON_CATALOG).filter(
    ([key, item]) =>
      item.label.toLowerCase().includes(search.toLowerCase()) ||
      item.group.toLowerCase().includes(search.toLowerCase()) ||
      key.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Vivid Color Picker */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
          Cor Vibrante
        </label>
        <div className="flex flex-wrap gap-2">
          {VIVID_PALETTE.map((c) => {
            const active = selectedColor.toLowerCase() === c.hex.toLowerCase();
            return (
              <button
                key={c.hex}
                type="button"
                onClick={() => onSelectColor(c.hex)}
                title={c.name}
                className={`w-8 h-8 rounded-xl on-vivid flex items-center justify-center transition-transform cursor-pointer ${
                  active ? 'scale-110 ring-2 ring-[#2563EB] shadow-md' : 'hover:scale-105 opacity-85 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: c.hex,
                }}
              >
                {active && <Check size={15} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Icon Library Picker */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Biblioteca de Ícones ({Object.keys(ICON_CATALOG).length} ícones)
          </label>
          <div className="relative w-44">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ícone..."
              className="w-full liquid-input rounded-xl pl-7 pr-2.5 py-1 text-xs text-white placeholder-slate-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 rounded-2xl bg-black/30 border border-white/10">
          {iconEntries.map(([iconKey, info]) => {
            const isSelected = selectedIcon === iconKey;
            return (
              <button
                key={iconKey}
                type="button"
                onClick={() => onSelectIcon(iconKey)}
                title={`${info.label} (${info.group})`}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? 'text-white scale-105 shadow-md'
                    : 'bg-white/5 hover:bg-white/12 text-slate-300'
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: `${selectedColor}35`,
                        border: `1px solid ${selectedColor}`,
                        color: selectedColor,
                      }
                    : undefined
                }
              >
                <DynamicIcon name={iconKey} size={18} />
                <span className="text-[9px] mt-1 truncate w-full text-center text-slate-300">
                  {info.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
