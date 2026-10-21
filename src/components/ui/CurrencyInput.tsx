import React from 'react';

interface CurrencyInputProps {
  value: number; // Valor em Reais (ex: 12.34)
  onChange: (value: number) => void;
  label?: string;
  required?: boolean;
  className?: string;
  accentTextClass?: string;
  autoFocus?: boolean;
}

/**
 * Campo monetário com máscara ATM brasileira (R$ 0,00) preenchido da direita para a esquerda.
 * Nunca exibe setas (spinners) e nunca permite digitar à frente dos zeros.
 */
export function CurrencyInput({
  value,
  onChange,
  label,
  required = false,
  className = '',
  accentTextClass = 'text-white',
  autoFocus = false,
}: CurrencyInputProps) {
  const cents = Math.round((Number.isFinite(value) ? value : 0) * 100);

  const formattedNumber = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      onChange(0);
      return;
    }
    // Limita a 12 dígitos para evitar overflow (até R$ 9.999.999.999,99)
    const clipped = rawDigits.slice(0, 12);
    const nextCents = parseInt(clipped, 10);
    onChange(nextCents / 100);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const len = e.target.value.length;
    requestAnimationFrame(() => {
      try {
        e.target.setSelectionRange(len, len);
      } catch {
        // ignore
      }
    });
  };

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const target = e.currentTarget;
    const len = target.value.length;
    try {
      target.setSelectionRange(len, len);
    } catch {
      // ignore
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none">
          R$
        </span>
        <input
          type="text"
          inputMode="numeric"
          required={required}
          autoFocus={autoFocus}
          value={formattedNumber}
          onChange={handleChange}
          onFocus={handleFocus}
          onClick={handleClick}
          className={`w-full liquid-input rounded-2xl pl-10 pr-4 py-2.5 text-base font-extrabold text-right tracking-tight ${accentTextClass} ${className}`}
        />
      </div>
    </div>
  );
}
