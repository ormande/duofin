import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  CreditCard,
  InvoicePayment,
  OwnerScope,
  PersonRole,
  Transaction,
  WorkspaceData,
} from '../types/finance';
import {
  calculateCardLimitAndInvoice,
  formatCurrency,
  formatDateBR,
  formatMonthLabel,
} from '../lib/financeUtils';
import { DynamicIcon } from '../lib/icons';
import { LiquidModal } from './ui/LiquidModal';
import { LiquidSelect } from './ui/LiquidSelect';
import { LiquidDatePicker } from './ui/LiquidDatePicker';
import { CurrencyInput } from './ui/CurrencyInput';
import { IconAndColorPicker } from './ui/IconAndColorPicker';
import {
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Receipt,
  Copy,
  RotateCcw,
} from 'lucide-react';

interface CreditCardsViewProps {
  workspace: WorkspaceData;
  selectedMonth: string;
  onSaveCard: (card: CreditCard, isEdit: boolean) => void;
  onDeleteCard: (cardId: string) => void;
  onSaveInvoicePayment: (payment: InvoicePayment, isEdit: boolean) => void;
  onDeleteInvoicePayment: (paymentId: string) => void;
  onOpenNewCardExpense: (cardId: string) => void;
  onEditTx: (tx: Transaction) => void;
  onDuplicateTx: (tx: Transaction) => void;
  onDeleteTx: (tx: Transaction) => void;
}

export function CreditCardsView({
  workspace,
  selectedMonth,
  onSaveCard,
  onDeleteCard,
  onSaveInvoicePayment,
  onDeleteInvoicePayment,
  onOpenNewCardExpense,
  onEditTx,
  onDuplicateTx,
  onDeleteTx,
}: CreditCardsViewProps) {
  const [activeCardId, setActiveCardId] = useState<string>(
    workspace.cards[0]?.id || ''
  );

  // Card Form Modal State
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [cardName, setCardName] = useState('');
  const [cardBrand, setCardBrand] = useState<CreditCard['brand']>('Mastercard');
  const [totalLimit, setTotalLimit] = useState<number>(5000);
  const [closingDay, setClosingDay] = useState(3);
  const [dueDay, setDueDay] = useState(10);
  const [defaultAccountId, setDefaultAccountId] = useState(workspace.accounts[0]?.id || '');
  const [owner, setOwner] = useState<OwnerScope>('both');
  const [cardIcon, setCardIcon] = useState('CreditCard');
  const [cardColor, setCardColor] = useState('#7C3AED');

  // Invoice Payment Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<InvoicePayment | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payDate, setPayDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [payAccountId, setPayAccountId] = useState(workspace.accounts[0]?.id || '');
  const [payBy, setPayBy] = useState<PersonRole>('me');
  const [payNotes, setPayNotes] = useState('');

  // Confirm Delete Card Modal
  const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null);

  const selectedCard =
    workspace.cards.find((c) => c.id === activeCardId) || workspace.cards[0];

  const openCreateCard = () => {
    setEditingCard(null);
    setCardName('');
    setCardBrand('Mastercard');
    setTotalLimit(5000);
    setClosingDay(3);
    setDueDay(10);
    setDefaultAccountId(workspace.accounts[0]?.id || '');
    setOwner('both');
    setCardIcon('CreditCard');
    setCardColor('#7C3AED');
    setIsCardModalOpen(true);
  };

  const openEditCard = (card: CreditCard) => {
    setEditingCard(card);
    setCardName(card.name);
    setCardBrand(card.brand);
    setTotalLimit(card.totalLimit);
    setClosingDay(card.closingDay);
    setDueDay(card.dueDay);
    setDefaultAccountId(card.defaultAccountId);
    setOwner(card.owner);
    setCardIcon(card.icon);
    setCardColor(card.color);
    setIsCardModalOpen(true);
  };

  const handleSaveCardForm = (e: React.FormEvent) => {
    e.preventDefault();
    const newCard: CreditCard = {
      id: editingCard ? editingCard.id : `card-${Date.now()}`,
      name: cardName.trim() || 'Cartão',
      brand: cardBrand,
      totalLimit,
      closingDay: Math.min(31, Math.max(1, closingDay)),
      dueDay: Math.min(31, Math.max(1, dueDay)),
      defaultAccountId,
      owner,
      icon: cardIcon,
      color: cardColor,
    };
    onSaveCard(newCard, Boolean(editingCard));
    setActiveCardId(newCard.id);
    setIsCardModalOpen(false);
  };

  const openPayInvoiceModal = (card: CreditCard, suggestedAmount: number) => {
    setEditingPayment(null);
    setPayAmount(Math.max(0, Number(suggestedAmount.toFixed(2))));
    setPayDate(format(new Date(), 'yyyy-MM-dd'));
    setPayAccountId(card.defaultAccountId || workspace.accounts[0]?.id || '');
    setPayBy('me');
    setPayNotes(`Pagamento Fatura ${formatMonthLabel(selectedMonth)}`);
    setIsPayModalOpen(true);
  };

  const openEditPaymentModal = (payment: InvoicePayment) => {
    setEditingPayment(payment);
    setPayAmount(payment.amount);
    setPayDate(payment.paidDate);
    setPayAccountId(payment.accountId);
    setPayBy(payment.paidBy);
    setPayNotes(payment.notes || '');
    setIsPayModalOpen(true);
  };

  const handleSavePaymentForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard || payAmount <= 0) return;

    const paymentObj: InvoicePayment = {
      id: editingPayment ? editingPayment.id : `invpay-${Date.now()}`,
      cardId: selectedCard.id,
      invoiceMonth: selectedMonth,
      amount: payAmount,
      paidDate: payDate,
      accountId: payAccountId,
      paidBy: payBy,
      notes: payNotes,
    };
    onSaveInvoicePayment(paymentObj, Boolean(editingPayment));
    setIsPayModalOpen(false);
  };

  const cardDetails = selectedCard
    ? calculateCardLimitAndInvoice(
        selectedCard,
        workspace.transactions,
        workspace.invoicePayments,
        selectedMonth
      )
    : null;

  const monthPaymentsForSelectedCard = selectedCard
    ? workspace.invoicePayments.filter(
        (p) => p.cardId === selectedCard.id && p.invoiceMonth === selectedMonth
      )
    : [];

  const daysOptions = Array.from({ length: 31 }, (_, i) => ({
    value: String(i + 1),
    label: `Dia ${i + 1}`,
    icon: 'Calendar',
    color: '#2563EB',
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="liquid-glass rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">
            Cartões de Crédito & Limite Automático
          </h2>
          <p className="text-xs text-slate-300">
            Faturas isoladas da conta corrente • Compras consomem limite na hora e pagamentos liberam o limite de volta
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateCard}
          className="px-4 py-2.5 rounded-2xl btn-vivid-blue text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={16} />
          Novo Cartão de Crédito
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {workspace.cards.map((card) => {
          const stats = calculateCardLimitAndInvoice(
            card,
            workspace.transactions,
            workspace.invoicePayments,
            selectedMonth
          );
          const isSelected = selectedCard?.id === card.id;

          return (
            <div
              key={card.id}
              onClick={() => setActiveCardId(card.id)}
              className={`rounded-3xl p-6 cursor-pointer transition-all relative overflow-hidden ${
                isSelected
                  ? 'liquid-glass-elevated ring-2 ring-[#3B82F6]'
                  : 'liquid-glass hover:border-white/25'
              }`}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <span
                    className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{
                      backgroundColor: `${card.color}22`,
                      color: card.color,
                      border: `1px solid ${card.color}60`,
                    }}
                  >
                    <DynamicIcon name={card.icon} size={20} />
                  </span>
                  <div>
                    <div className="text-base font-extrabold text-white">{card.name}</div>
                    <div className="text-xs text-slate-300">
                      {card.brand} • Fecha dia <strong>{card.closingDay}</strong> • Vence dia{' '}
                      <strong>{card.dueDay}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditCard(card);
                    }}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white cursor-pointer"
                    title="Editar Cartão"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCardToDelete(card);
                    }}
                    className="p-2 rounded-xl bg-white/10 hover:bg-[#F43F5E]/25 text-rose-300 hover:text-[#F43F5E] cursor-pointer"
                    title="Excluir Cartão"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Fatura do Mês */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-black/30 border border-white/10 mb-4">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    Fatura {formatMonthLabel(selectedMonth)}
                  </div>
                  <div className="text-lg font-extrabold text-[#F43F5E]">
                    {formatCurrency(stats.monthInvoiceRemaining)}
                  </div>
                  {stats.monthInvoicePaid > 0 && (
                    <div className="text-[10px] text-[#10B981]">
                      Já pago: {formatCurrency(stats.monthInvoicePaid)}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    Limite Disponível
                  </div>
                  <div className="text-lg font-extrabold text-[#10B981]">
                    {formatCurrency(stats.availableLimit)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    de {formatCurrency(stats.totalLimit)}
                  </div>
                </div>
              </div>

              {/* Barra Sólida do Limite Total */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">
                    Limite Consumido ({Math.round(stats.usagePercent)}%)
                  </span>
                  <span className="text-white font-bold">{formatCurrency(stats.usedLimit)}</span>
                </div>
                <div className="w-full h-2.5 rounded-full progress-track overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${stats.usagePercent}%`,
                      backgroundColor:
                        stats.usagePercent > 85 ? '#F43F5E' : card.color,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detalhamento da Fatura do Cartão Selecionado */}
      {selectedCard && cardDetails && (
        <div className="liquid-glass rounded-3xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{
                  backgroundColor: `${selectedCard.color}22`,
                  color: selectedCard.color,
                  border: `1px solid ${selectedCard.color}60`,
                }}
              >
                <Receipt size={20} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">
                  Fatura de {formatMonthLabel(selectedMonth)} — {selectedCard.name}
                </h3>
                <p className="text-xs text-slate-300">
                  Total de compras: <strong>{formatCurrency(cardDetails.monthInvoiceTotal)}</strong> •{' '}
                  Pago: <strong className="text-[#10B981]">{formatCurrency(cardDetails.monthInvoicePaid)}</strong> •{' '}
                  Em aberto: <strong className="text-[#F43F5E]">{formatCurrency(cardDetails.monthInvoiceRemaining)}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => onOpenNewCardExpense(selectedCard.id)}
                className="px-4 py-2.5 rounded-2xl liquid-glass-interactive text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={15} />
                Lançar Compra no Cartão
              </button>

              <button
                type="button"
                onClick={() =>
                  openPayInvoiceModal(selectedCard, cardDetails.monthInvoiceRemaining)
                }
                className="px-4 py-2.5 rounded-2xl btn-vivid-emerald text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 size={15} />
                Pagar / Adantar Fatura
              </button>
            </div>
          </div>

          {/* Pagamentos Realizados Nesta Fatura */}
          {monthPaymentsForSelectedCard.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
                Pagamentos / Baixas desta Fatura (Liberam Limite do Cartão)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {monthPaymentsForSelectedCard.map((p) => {
                  const acc = workspace.accounts.find((a) => a.id === p.accountId);
                  return (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-2xl bg-[#10B981]/12 border border-[#10B981]/40 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">
                          Pagamento de Fatura ({formatCurrency(p.amount)})
                        </div>
                        <div className="text-[11px] text-slate-300">
                          Pago em {formatDateBR(p.paidDate)} via {acc?.name || 'Conta'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditPaymentModal(p)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                          title="Editar Pagamento"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteInvoicePayment(p.id)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-[#F43F5E]/30 text-rose-300 cursor-pointer"
                          title="Estornar / Excluir Pagamento"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lista de Compras da Fatura */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Lançamentos desta Fatura ({cardDetails.invoiceTransactions.length})
            </h4>

            {cardDetails.invoiceTransactions.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                Nenhuma compra registrada para a fatura de {formatMonthLabel(selectedMonth)}.
              </div>
            ) : (
              <div className="divide-y divide-white/10 rounded-2xl bg-black/25 border border-white/10 overflow-hidden">
                {cardDetails.invoiceTransactions.map((tx) => {
                  const cat = workspace.categories.find((c) => c.id === tx.categoryId);
                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-white/[0.04]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${cat?.color || '#7C3AED'}24`,
                            color: cat?.color || '#7C3AED',
                          }}
                        >
                          <DynamicIcon name={cat?.icon || 'CreditCard'} size={16} />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate">
                              {tx.description}
                            </span>
                            {tx.isRefund && (
                              <span className="px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] text-[10px] font-bold flex items-center gap-1">
                                <RotateCcw size={10} /> Estorno
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Compra em {formatDateBR(tx.registrationDate)} • {cat?.name || 'Geral'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div
                          className={`text-sm font-extrabold ${
                            tx.isRefund ? 'text-[#10B981]' : 'text-[#F43F5E]'
                          }`}
                        >
                          {tx.isRefund ? '-' : ''}
                          {formatCurrency(tx.amount)}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onDuplicateTx(tx)}
                            title="Duplicar abrindo modal"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-[#2563EB]/25 text-slate-300 hover:text-white cursor-pointer"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditTx(tx)}
                            title="Editar"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white cursor-pointer"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTx(tx)}
                            title="Excluir"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-[#F43F5E]/25 text-slate-300 hover:text-[#F43F5E] cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Criar / Editar Cartão de Crédito */}
      <LiquidModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        title={editingCard ? 'Editar Cartão de Crédito' : 'Novo Cartão de Crédito'}
        subtitle="Configure o limite total e os dias de fechamento e vencimento"
        headerColor={cardColor}
      >
        <form onSubmit={handleSaveCardForm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Nome do Cartão
              </label>
              <input
                type="text"
                required
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="Ex: Nubank Ultravioleta, Itaú Black..."
                className="w-full liquid-input rounded-2xl px-4 py-2.5 text-sm text-white"
              />
            </div>

            <LiquidSelect
              label="Bandeira"
              value={cardBrand}
              onChange={(v) => setCardBrand(v as CreditCard['brand'])}
              options={[
                { value: 'Mastercard', label: 'Mastercard', icon: 'CreditCard', color: '#F97316' },
                { value: 'Visa', label: 'Visa', icon: 'CreditCard', color: '#2563EB' },
                { value: 'Elo', label: 'Elo', icon: 'CreditCard', color: '#F59E0B' },
                { value: 'Amex', label: 'American Express', icon: 'CreditCard', color: '#06B6D4' },
                { value: 'Outro', label: 'Outra Bandeira', icon: 'CreditCard', color: '#7C3AED' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <CurrencyInput
              label="Limite Total (R$)"
              value={totalLimit}
              onChange={setTotalLimit}
              required
            />

            <LiquidSelect
              label="Dia Fechamento"
              value={String(closingDay)}
              onChange={(v) => setClosingDay(Number(v))}
              options={daysOptions}
            />

            <LiquidSelect
              label="Dia Vencimento"
              value={String(dueDay)}
              onChange={(v) => setDueDay(Number(v))}
              options={daysOptions}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LiquidSelect
              label="Conta Padrão para Debitar Fatura"
              value={defaultAccountId}
              onChange={setDefaultAccountId}
              options={workspace.accounts.map((a) => ({
                value: a.id,
                label: a.name,
                icon: a.icon,
                color: a.color,
              }))}
            />

            <LiquidSelect
              label="Titular / Uso do Cartão"
              value={owner}
              onChange={(v) => setOwner(v as OwnerScope)}
              options={[
                { value: 'both', label: 'Compartilhado (Casal)', icon: 'Users', color: '#2563EB' },
                { value: 'me', label: 'Uso Principal Você', icon: 'User', color: '#3B82F6' },
                { value: 'partner', label: 'Uso Principal Namorada', icon: 'User', color: '#EC4899' },
              ]}
            />
          </div>

          <IconAndColorPicker
            selectedIcon={cardIcon}
            onSelectIcon={setCardIcon}
            selectedColor={cardColor}
            onSelectColor={setCardColor}
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsCardModalOpen(false)}
              className="px-4 py-2.5 rounded-2xl liquid-glass-interactive text-xs font-bold text-slate-300 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl btn-vivid-blue text-xs font-bold text-white cursor-pointer"
            >
              Salvar Cartão
            </button>
          </div>
        </form>
      </LiquidModal>

      {/* Modal Pagar / Adantar Fatura */}
      <LiquidModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={editingPayment ? 'Editar Pagamento de Fatura' : 'Pagar / Adantar Fatura do Cartão'}
        subtitle="O valor pago debita da conta escolhida e libera o limite do cartão imediatamente"
        headerColor="#10B981"
      >
        <form onSubmit={handleSavePaymentForm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CurrencyInput
              label="Valor do Pagamento (R$)"
              value={payAmount}
              onChange={setPayAmount}
              accentTextClass="text-[#10B981]"
              required
            />

            <LiquidDatePicker
              label="Data do Pagamento"
              value={payDate}
              onChange={setPayDate}
              accentColor="#10B981"
            />
          </div>

          <LiquidSelect
            label="Debitar de Qual Conta Bancária?"
            value={payAccountId}
            onChange={setPayAccountId}
            options={workspace.accounts.map((a) => ({
              value: a.id,
              label: a.name,
              icon: a.icon,
              color: a.color,
            }))}
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
              className="px-4 py-2.5 rounded-2xl liquid-glass-interactive text-xs font-bold text-slate-300 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl btn-vivid-emerald text-xs font-bold cursor-pointer"
            >
              Confirmar Pagamento
            </button>
          </div>
        </form>
      </LiquidModal>

      {/* Modal Confirmar Exclusão de Cartão */}
      <LiquidModal
        isOpen={Boolean(cardToDelete)}
        onClose={() => setCardToDelete(null)}
        title="Excluir Cartão de Crédito"
        maxWidth="sm"
        headerColor="#F43F5E"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Deseja excluir o cartão <strong>{cardToDelete?.name}</strong> e todos os lançamentos vinculados a ele?
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCardToDelete(null)}
              className="px-4 py-2 rounded-xl liquid-glass-interactive text-xs font-bold text-slate-300 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                if (cardToDelete) onDeleteCard(cardToDelete.id);
                setCardToDelete(null);
              }}
              className="px-4 py-2 rounded-xl btn-vivid-crimson text-xs font-bold cursor-pointer"
            >
              Excluir Cartão
            </button>
          </div>
        </div>
      </LiquidModal>
    </div>
  );
}
