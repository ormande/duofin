import React from 'react';
import { SeriesDeleteScope, Transaction } from '../types/finance';
import { LiquidModal } from './ui/LiquidModal';
import { formatCurrency, formatDateBR } from '../lib/financeUtils';
import { Trash2, AlertTriangle, Calendar, Layers } from 'lucide-react';

interface DeleteTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onConfirmDelete: (tx: Transaction, scope: SeriesDeleteScope) => void;
}

export function DeleteTransactionModal({
  isOpen,
  onClose,
  transaction,
  onConfirmDelete,
}: DeleteTransactionModalProps) {
  if (!transaction) return null;

  const isSeries =
    transaction.recurrenceType !== 'single' && Boolean(transaction.seriesId);

  return (
    <LiquidModal
      isOpen={isOpen}
      onClose={onClose}
      title="Excluir Lançamento"
      subtitle="Confirme a exclusão da operação selecionada"
      maxWidth="md"
      headerColor="#FF1744"
    >
      <div className="space-y-5">
        <div className="p-4 rounded-2xl bg-[#FF1744]/15 border border-[#FF1744]/40 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF1744]/25 flex items-center justify-center text-[#FF1744] shrink-0">
            <Trash2 size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white truncate">{transaction.description}</div>
            <div className="text-base font-extrabold text-[#FF5252] mt-0.5">
              {formatCurrency(transaction.amount)}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-300 mt-1">
              <span className="flex items-center gap-1">
                <Calendar size={12} /> Reg: {formatDateBR(transaction.registrationDate)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={12} /> Venc: {formatDateBR(transaction.dueDate)}
              </span>
            </div>
          </div>
        </div>

        {isSeries ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#FFB300]">
              <Layers size={15} />
              <span>
                Este item pertence a uma série ({transaction.recurrenceType === 'installment' ? 'Compra Parcelada' : 'Conta Fixa Mensal'}). Qual opção deseja excluir?
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                onConfirmDelete(transaction, 'only_this');
                onClose();
              }}
              className="w-full p-3.5 rounded-2xl liquid-glass-interactive border border-white/15 hover:border-white/40 text-left cursor-pointer transition"
            >
              <div className="text-xs font-bold text-white">
                1. Somente esta parcela / ocorrência específica
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                Mantém as parcelas passadas e as futuras intactas.
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onConfirmDelete(transaction, 'this_and_future');
                onClose();
              }}
              className="w-full p-3.5 rounded-2xl liquid-glass-interactive border border-[#FFB300]/40 hover:border-[#FFB300] text-left cursor-pointer transition"
            >
              <div className="text-xs font-bold text-[#FFB300]">
                2. Desta parcela em diante (atual + futuras)
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                Remove esta e todas as próximas parcelas, preservando o histórico de meses anteriores.
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onConfirmDelete(transaction, 'all_including_paid');
                onClose();
              }}
              className="w-full p-3.5 rounded-2xl bg-[#FF1744]/20 hover:bg-[#FF1744]/35 border border-[#FF1744]/60 text-left cursor-pointer transition"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF5252]">
                <AlertTriangle size={14} />
                3. Todas da série, inclusive as já pagas
              </div>
              <div className="text-[11px] text-rose-200/80 mt-0.5">
                Atenção: Isso apaga toda a série e impacta os saldos/faturas dos outros meses em que já havia sido paga.
              </div>
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-300 leading-relaxed">
            Tem certeza que deseja excluir este lançamento? O saldo da conta ou limite do cartão será recalculado imediatamente.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl liquid-glass-interactive text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
          >
            Cancelar
          </button>
          {!isSeries && (
            <button
              type="button"
              onClick={() => {
                onConfirmDelete(transaction, 'only_this');
                onClose();
              }}
              className="px-5 py-2 rounded-xl btn-vivid-crimson text-xs font-bold text-white cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              Confirmar Exclusão
            </button>
          )}
        </div>
      </div>
    </LiquidModal>
  );
}
