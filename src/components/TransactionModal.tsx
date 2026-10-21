import React, { useState, useEffect } from 'react';
import { format, addMonths, parseISO } from 'date-fns';
import {
  BankAccount,
  Category,
  CreditCard,
  CoupleMember,
  PaymentMethod,
  PersonRole,
  RecurrenceType,
  ResponsibilityType,
  SeriesEditScope,
  SplitMode,
  TagItem,
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../types/finance';
import { LiquidModal } from './ui/LiquidModal';
import { LiquidSelect } from './ui/LiquidSelect';
import { LiquidDatePicker } from './ui/LiquidDatePicker';
import { CurrencyInput } from './ui/CurrencyInput';
import { computeCardInvoiceAndDueDate, formatCurrency, formatMonthLabel } from '../lib/financeUtils';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  CreditCard as CardIcon,
  Landmark,
  Users,
  User,
  Repeat,
  Layers,
  CheckCircle2,
  Clock,
  Tag as TagIcon,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
  duplicatingTransaction?: Transaction | null;
  accounts: BankAccount[];
  cards: CreditCard[];
  categories: Category[];
  tags: TagItem[];
  members: CoupleMember[];
  onSaveNew: (transactionsToCreate: Transaction[]) => void;
  onSaveEdit: (
    originalTx: Transaction,
    updatedFields: Partial<Transaction>,
    scope: SeriesEditScope
  ) => void;
}

export function TransactionModal({
  isOpen,
  onClose,
  initialType = 'expense',
  editingTransaction,
  duplicatingTransaction,
  accounts,
  cards,
  categories,
  tags,
  members,
  onSaveNew,
  onSaveEdit,
}: TransactionModalProps) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const meMember = members.find((m) => m.role === 'me') || { name: 'Você', avatarColor: '#2563EB' };
  const partnerMember = members.find((m) => m.role === 'partner') || {
    name: 'Namorada',
    avatarColor: '#EC4899',
  };

  const [type, setType] = useState<TransactionType>(initialType);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [registrationDate, setRegistrationDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(todayStr);
  const [status, setStatus] = useState<TransactionStatus>('paid');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('account');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [destinationAccountId, setDestinationAccountId] = useState(
    accounts[1]?.id || accounts[0]?.id || ''
  );
  const [cardId, setCardId] = useState(cards[0]?.id || '');
  const [invoiceMonth, setInvoiceMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Couple & Split
  const [responsibility, setResponsibility] = useState<ResponsibilityType>('me');
  const [paidBy, setPaidBy] = useState<PersonRole>('me');
  const [splitMode, setSplitMode] = useState<SplitMode>('percentage');
  const [mySharePercent, setMySharePercent] = useState<number>(50);
  const [myManualShare, setMyManualShare] = useState<number>(0);
  const [partnerManualShare, setPartnerManualShare] = useState<number>(0);

  // Recurrence / Installments
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('single');
  const [totalInstallments, setTotalInstallments] = useState<number>(2);
  const [fixedMonthsCount, setFixedMonthsCount] = useState<number>(12);
  const [isRefund, setIsRefund] = useState(false);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Series Edit Scope confirmation
  const [showSeriesEditPrompt, setShowSeriesEditPrompt] = useState(false);

  const sourceTx = editingTransaction || duplicatingTransaction;

  useEffect(() => {
    if (!isOpen) {
      setShowSeriesEditPrompt(false);
      setErrorMsg('');
      return;
    }

    if (sourceTx) {
      setType(sourceTx.type);
      setDescription(
        duplicatingTransaction
          ? sourceTx.description.replace(/\s*\(\d+\/\d+\)$/, '')
          : sourceTx.description
      );
      setAmount(sourceTx.amount);
      setRegistrationDate(duplicatingTransaction ? todayStr : sourceTx.registrationDate);
      setDueDate(duplicatingTransaction ? todayStr : sourceTx.dueDate);
      setStatus(sourceTx.status);
      setPaymentMethod(sourceTx.paymentMethod);
      setAccountId(sourceTx.accountId || accounts[0]?.id || '');
      setDestinationAccountId(sourceTx.destinationAccountId || accounts[1]?.id || '');
      setCardId(sourceTx.cardId || cards[0]?.id || '');
      setInvoiceMonth(sourceTx.invoiceMonth || format(new Date(), 'yyyy-MM'));
      setCategoryId(sourceTx.categoryId);
      setSubcategoryId(sourceTx.subcategoryId || '');
      setSelectedTags(sourceTx.tags || []);
      setResponsibility(sourceTx.responsibility || 'me');
      setPaidBy(sourceTx.paidBy || 'me');
      setSplitMode(sourceTx.splitMode || 'percentage');
      setMySharePercent(sourceTx.mySharePercent ?? 50);
      setMyManualShare(sourceTx.myShareAmount ?? sourceTx.amount / 2);
      setPartnerManualShare(sourceTx.partnerShareAmount ?? sourceTx.amount / 2);
      setRecurrenceType(duplicatingTransaction ? 'single' : sourceTx.recurrenceType || 'single');
      setTotalInstallments(sourceTx.totalInstallments || 2);
      setIsRefund(Boolean(sourceTx.isRefund));
      setNotes(sourceTx.notes || '');
    } else {
      setType(initialType);
      setDescription('');
      setAmount(0);
      setRegistrationDate(todayStr);
      setDueDate(todayStr);
      setStatus('paid');
      setPaymentMethod('account');
      setAccountId(accounts[0]?.id || '');
      setDestinationAccountId(accounts[1]?.id || accounts[0]?.id || '');
      setCardId(cards[0]?.id || '');
      const firstCat = categories.find(
        (c) => !c.parentId && c.type === (initialType === 'income' ? 'income' : 'expense')
      );
      setCategoryId(firstCat?.id || '');
      setSubcategoryId('');
      setSelectedTags([]);
      setResponsibility('me');
      setPaidBy('me');
      setSplitMode('percentage');
      setMySharePercent(50);
      setMyManualShare(0);
      setPartnerManualShare(0);
      setRecurrenceType('single');
      setTotalInstallments(2);
      setIsRefund(false);
      setNotes('');
    }
  }, [isOpen, sourceTx, initialType, accounts, cards, categories, todayStr, duplicatingTransaction]);

  useEffect(() => {
    if (paymentMethod === 'credit_card' && cardId && !editingTransaction) {
      const card = cards.find((c) => c.id === cardId);
      if (card) {
        const computed = computeCardInvoiceAndDueDate(
          registrationDate,
          card.closingDay,
          card.dueDay,
          0
        );
        setInvoiceMonth(computed.invoiceMonth);
        setDueDate(computed.dueDate);
      }
    }
  }, [paymentMethod, cardId, registrationDate, cards, editingTransaction]);

  const myShareAmount =
    responsibility === 'me'
      ? amount
      : responsibility === 'partner'
      ? 0
      : splitMode === 'percentage'
      ? Number(((amount * mySharePercent) / 100).toFixed(2))
      : myManualShare;

  const partnerShareAmount =
    responsibility === 'partner'
      ? amount
      : responsibility === 'me'
      ? 0
      : splitMode === 'percentage'
      ? Number((amount - myShareAmount).toFixed(2))
      : partnerManualShare;

  const handleMyManualChange = (val: number) => {
    setMyManualShare(val);
    const rem = Math.max(0, Number((amount - val).toFixed(2)));
    setPartnerManualShare(rem);
  };

  const handlePartnerManualChange = (val: number) => {
    setPartnerManualShare(val);
    const rem = Math.max(0, Number((amount - val).toFixed(2)));
    setMyManualShare(rem);
  };

  const parentCategories = categories.filter(
    (c) => !c.parentId && c.type === (type === 'income' ? 'income' : 'expense')
  );
  const subCategories = categories.filter((c) => c.parentId === categoryId);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const isEditingSeriesItem =
    Boolean(editingTransaction) &&
    editingTransaction!.recurrenceType !== 'single' &&
    Boolean(editingTransaction!.seriesId);

  const executeSaveEdit = (scope: SeriesEditScope) => {
    if (!editingTransaction) return;
    onSaveEdit(
      editingTransaction,
      {
        description: description.trim() || 'Lançamento',
        amount,
        type,
        registrationDate,
        dueDate,
        paidDate: status === 'paid' ? dueDate : undefined,
        status,
        paymentMethod: type === 'transfer' ? 'account' : paymentMethod,
        accountId: paymentMethod === 'account' || type === 'transfer' ? accountId : undefined,
        destinationAccountId: type === 'transfer' ? destinationAccountId : undefined,
        cardId: paymentMethod === 'credit_card' && type === 'expense' ? cardId : undefined,
        invoiceMonth:
          paymentMethod === 'credit_card' && type === 'expense' ? invoiceMonth : undefined,
        categoryId: type === 'transfer' ? 'cat-transfer' : categoryId,
        subcategoryId: subcategoryId || undefined,
        tags: selectedTags,
        responsibility,
        paidBy,
        splitMode,
        mySharePercent:
          amount > 0 ? Math.round((myShareAmount / amount) * 100) : mySharePercent,
        partnerSharePercent:
          amount > 0 ? Math.round((partnerShareAmount / amount) * 100) : 100 - mySharePercent,
        myShareAmount,
        partnerShareAmount,
        isRefund,
        notes,
      },
      scope
    );
    setShowSeriesEditPrompt(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setErrorMsg('Informe um valor maior que R$ 0,00.');
      return;
    }

    if (editingTransaction) {
      if (isEditingSeriesItem) {
        setShowSeriesEditPrompt(true);
        return;
      }
      executeSaveEdit('only_this');
      return;
    }

    const baseId = `tx-${Date.now()}`;
    const seriesId = recurrenceType !== 'single' ? `series-${Date.now()}` : undefined;
    const count =
      recurrenceType === 'installment'
        ? Math.max(2, totalInstallments)
        : recurrenceType === 'fixed'
        ? Math.max(2, fixedMonthsCount)
        : 1;

    const createdList: Transaction[] = [];
    const selectedCard = cards.find((c) => c.id === cardId);

    for (let i = 0; i < count; i++) {
      let itemDueDate = dueDate;
      let itemInvoiceMonth = invoiceMonth;
      let itemStatus: TransactionStatus = i === 0 ? status : 'pending';

      if (i > 0) {
        if (paymentMethod === 'credit_card' && selectedCard && type === 'expense') {
          const calc = computeCardInvoiceAndDueDate(
            registrationDate,
            selectedCard.closingDay,
            selectedCard.dueDay,
            i
          );
          itemInvoiceMonth = calc.invoiceMonth;
          itemDueDate = calc.dueDate;
          itemStatus = status;
        } else {
          itemDueDate = format(addMonths(parseISO(dueDate), i), 'yyyy-MM-dd');
        }
      }

      const itemDesc =
        recurrenceType === 'installment'
          ? `${description.trim()} (${i + 1}/${count})`
          : description.trim();

      createdList.push({
        id: `${baseId}-${i + 1}`,
        description: itemDesc || 'Lançamento',
        amount,
        type,
        registrationDate,
        dueDate: itemDueDate,
        paidDate: itemStatus === 'paid' ? itemDueDate : undefined,
        status: itemStatus,
        paymentMethod: type === 'transfer' ? 'account' : paymentMethod,
        accountId: paymentMethod === 'account' || type === 'transfer' ? accountId : undefined,
        destinationAccountId: type === 'transfer' ? destinationAccountId : undefined,
        cardId: paymentMethod === 'credit_card' && type === 'expense' ? cardId : undefined,
        invoiceMonth:
          paymentMethod === 'credit_card' && type === 'expense' ? itemInvoiceMonth : undefined,
        categoryId:
          type === 'transfer'
            ? 'cat-transfer'
            : categoryId || parentCategories[0]?.id || 'cat-moradia',
        subcategoryId: subcategoryId || undefined,
        tags: selectedTags,
        responsibility,
        paidBy,
        splitMode,
        mySharePercent:
          amount > 0 ? Math.round((myShareAmount / amount) * 100) : mySharePercent,
        partnerSharePercent:
          amount > 0 ? Math.round((partnerShareAmount / amount) * 100) : 100 - mySharePercent,
        myShareAmount,
        partnerShareAmount,
        recurrenceType,
        seriesId,
        installmentNumber: recurrenceType !== 'single' ? i + 1 : undefined,
        totalInstallments: recurrenceType !== 'single' ? count : undefined,
        isRefund,
        notes,
      });
    }

    onSaveNew(createdList);
    onClose();
  };

  const accentColor =
    type === 'expense' ? '#F43F5E' : type === 'income' ? '#10B981' : '#2563EB';

  return (
    <LiquidModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        editingTransaction
          ? 'Editar Lançamento'
          : duplicatingTransaction
          ? 'Duplicar Lançamento'
          : 'Novo Lançamento Financeiro'
      }
      subtitle={
        duplicatingTransaction
          ? 'Ajuste a data de registro, vencimento ou valor antes de confirmar'
          : 'Controle com Data de Registro, Vencimento, Cartão e Divisão do Casal'
      }
      maxWidth="xl"
      headerColor={accentColor}
    >
      {/* Prompt de Escopo ao Editar Parcela ou Conta Fixa */}
      {showSeriesEditPrompt && (
        <div className="mb-5 p-4 rounded-2xl bg-[#2563EB]/15 border border-[#2563EB]/50 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-[#F59E0B] shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-bold text-white">
                Este lançamento faz parte de uma série (
                {editingTransaction?.recurrenceType === 'installment'
                  ? 'Parcelamento'
                  : 'Conta Fixa'}
                )
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Como você deseja aplicar as alterações feitas neste lançamento?
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => executeSaveEdit('only_this')}
              className="py-2.5 px-3.5 rounded-2xl liquid-glass-interactive text-xs font-bold text-white border border-white/15 cursor-pointer text-left"
            >
              1. Somente para esta parcela específica
              <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                Altera apenas este registro
              </span>
            </button>
            <button
              type="button"
              onClick={() => executeSaveEdit('this_and_future')}
              className="py-2.5 px-3.5 rounded-2xl btn-vivid-blue text-xs font-bold text-white cursor-pointer text-left"
            >
              2. Desta parcela em diante
              <span className="block text-[10px] font-normal text-blue-100 mt-0.5">
                Atualiza esta e todas as futuras da série
              </span>
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-[#F43F5E]/15 border border-[#F43F5E] text-xs font-bold text-[#F43F5E]">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Seletor de Tipo Sólido e Limpo */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setType('expense');
              const first = categories.find((c) => !c.parentId && c.type === 'expense');
              if (first) setCategoryId(first.id);
            }}
            className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
              type === 'expense'
                ? 'bg-[#F43F5E] on-vivid border-[#F43F5E] shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownCircle size={15} />
            Despesa
          </button>

          <button
            type="button"
            onClick={() => {
              setType('income');
              setPaymentMethod('account');
              const first = categories.find((c) => !c.parentId && c.type === 'income');
              if (first) setCategoryId(first.id);
            }}
            className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
              type === 'income'
                ? 'bg-[#10B981] on-vivid border-[#10B981] shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpCircle size={15} />
            Receita
          </button>

          <button
            type="button"
            onClick={() => {
              setType('transfer');
              setPaymentMethod('account');
            }}
            className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
              type === 'transfer'
                ? 'bg-[#2563EB] on-vivid border-[#2563EB] shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <ArrowLeftRight size={15} />
            Transferência
          </button>
        </div>

        {/* Descrição & Valor com Máscara R$ 0,00 da Direita para a Esquerda */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
          <div className="sm:col-span-7">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Descrição do Lançamento
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === 'expense'
                  ? 'Ex: Supermercado, Jantar, Gasolina...'
                  : type === 'income'
                  ? 'Ex: Salário, Reembolso, Dividendos...'
                  : 'Ex: Transferência para Reserva...'
              }
              className="w-full liquid-input rounded-2xl px-3.5 py-2.5 text-sm font-medium text-white placeholder-slate-400"
            />
          </div>

          <div className="sm:col-span-5">
            <CurrencyInput
              label={
                recurrenceType === 'installment' && !editingTransaction
                  ? 'Valor da Parcela (R$)'
                  : 'Valor Total (R$)'
              }
              value={amount}
              onChange={(val) => {
                setAmount(val);
                if (errorMsg) setErrorMsg('');
              }}
              required
            />
          </div>
        </div>

        {/* Datas: Data de Registro & Data de Vencimento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
          <LiquidDatePicker
            label="Data de Registro"
            value={registrationDate}
            onChange={setRegistrationDate}
            accentColor="#2563EB"
          />

          <LiquidDatePicker
            label="Data de Vencimento"
            value={dueDate}
            onChange={setDueDate}
            accentColor={accentColor}
          />
        </div>

        {/* Meio de Pagamento: Conta Bancária vs Cartão de Crédito */}
        {type !== 'transfer' ? (
          <div className="space-y-3.5">
            {type === 'expense' && (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('account')}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
                    paymentMethod === 'account'
                      ? 'bg-[#2563EB] on-vivid border-[#2563EB] shadow-sm'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <Landmark size={15} />
                  Débito / PIX / Conta
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
                    paymentMethod === 'credit_card'
                      ? 'bg-[#7C3AED] on-vivid border-[#7C3AED] shadow-sm'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <CardIcon size={15} />
                  Cartão de Crédito
                </button>
              </div>
            )}

            {paymentMethod === 'account' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <LiquidSelect
                  label={type === 'income' ? 'Conta de Destino' : 'Conta de Pagamento'}
                  value={accountId}
                  onChange={setAccountId}
                  options={accounts.map((a) => ({
                    value: a.id,
                    label: a.name,
                    icon: a.icon,
                    color: a.color,
                    badge:
                      a.owner === 'me'
                        ? meMember.name
                        : a.owner === 'partner'
                        ? partnerMember.name
                        : 'Casal',
                  }))}
                />

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Status da Operação
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus('paid')}
                      className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 border cursor-pointer transition ${
                        status === 'paid'
                          ? 'bg-[#10B981] on-vivid border-[#10B981] shadow-sm'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      <CheckCircle2 size={14} />
                      {type === 'income' ? 'Recebido' : 'Pago'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('pending')}
                      className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 border cursor-pointer transition ${
                        status === 'pending'
                          ? 'bg-[#F59E0B] on-vivid border-[#F59E0B] shadow-sm'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      <Clock size={14} />
                      Pendente
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                <LiquidSelect
                  label="Cartão de Crédito"
                  value={cardId}
                  onChange={setCardId}
                  options={cards.map((c) => ({
                    value: c.id,
                    label: c.name,
                    icon: c.icon,
                    color: c.color,
                    badge: c.brand,
                  }))}
                />

                <div>
                  <LiquidSelect
                    label="Fatura de Competência"
                    value={invoiceMonth}
                    onChange={setInvoiceMonth}
                    options={[-1, 0, 1, 2, 3, 4, 5].map((offset) => {
                      const m = format(addMonths(new Date(), offset), 'yyyy-MM');
                      return {
                        value: m,
                        label: `Fatura ${formatMonthLabel(m)}`,
                        icon: 'Receipt',
                        color: '#7C3AED',
                      };
                    })}
                  />
                  <label className="inline-flex items-center gap-2 mt-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={isRefund}
                      onChange={(e) => setIsRefund(e.target.checked)}
                      className="rounded accent-[#10B981]"
                    />
                    <RotateCcw size={12} className="text-[#10B981]" />
                    Estorno / Crédito na Fatura
                  </label>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <LiquidSelect
              label="Sai da Conta (Origem)"
              value={accountId}
              onChange={setAccountId}
              options={accounts.map((a) => ({
                value: a.id,
                label: a.name,
                icon: a.icon,
                color: a.color,
              }))}
            />
            <LiquidSelect
              label="Entra na Conta (Destino)"
              value={destinationAccountId}
              onChange={setDestinationAccountId}
              options={accounts.map((a) => ({
                value: a.id,
                label: a.name,
                icon: a.icon,
                color: a.color,
              }))}
            />
          </div>
        )}

        {/* Categoria e Subcategoria */}
        {type !== 'transfer' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <LiquidSelect
              label="Categoria Principal"
              value={categoryId}
              onChange={(val) => {
                setCategoryId(val);
                setSubcategoryId('');
              }}
              searchable
              options={parentCategories.map((c) => ({
                value: c.id,
                label: c.name,
                icon: c.icon,
                color: c.color,
              }))}
            />

            <LiquidSelect
              label="Subcategoria (Opcional)"
              value={subcategoryId}
              onChange={setSubcategoryId}
              placeholder="Nenhuma subcategoria"
              options={[
                { value: '', label: 'Geral (Sem subcategoria)', icon: 'Layers', color: '#64748B' },
                ...subCategories.map((sub) => ({
                  value: sub.id,
                  label: sub.name,
                  icon: sub.icon,
                  color: sub.color,
                })),
              ]}
            />
          </div>
        )}

        {/* Divisão de Gastos do Casal (Meu, Dela ou Split % / Manual) */}
        {type !== 'transfer' && (
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Users size={14} className="text-[#3B82F6]" />
                Responsável pelo lançamento
              </span>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400">Quem pagou:</span>
                <button
                  type="button"
                  onClick={() => setPaidBy('me')}
                  className={`px-2.5 py-1 rounded-lg font-bold border cursor-pointer transition ${
                    paidBy === 'me'
                      ? 'bg-[#2563EB] on-vivid border-[#2563EB] shadow-xs'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  {meMember.name}
                </button>
                <button
                  type="button"
                  onClick={() => setPaidBy('partner')}
                  className={`px-2.5 py-1 rounded-lg font-bold border cursor-pointer transition ${
                    paidBy === 'partner'
                      ? 'bg-[#EC4899] on-vivid border-[#EC4899] shadow-xs'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  {partnerMember.name}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setResponsibility('me')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border cursor-pointer transition ${
                  responsibility === 'me'
                    ? 'bg-[#2563EB] on-vivid border-[#2563EB] shadow-sm'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                <User size={13} />
                100% {meMember.name}
              </button>

              <button
                type="button"
                onClick={() => setResponsibility('partner')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border cursor-pointer transition ${
                  responsibility === 'partner'
                    ? 'bg-[#EC4899] on-vivid border-[#EC4899] shadow-sm'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                <User size={13} />
                100% {partnerMember.name}
              </button>

              <button
                type="button"
                onClick={() => {
                  setResponsibility('split');
                  if (myManualShare === 0 && amount > 0) {
                    setMyManualShare(Number((amount / 2).toFixed(2)));
                    setPartnerManualShare(Number((amount / 2).toFixed(2)));
                  }
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border cursor-pointer transition ${
                  responsibility === 'split'
                    ? 'bg-[#7C3AED] on-vivid border-[#7C3AED] shadow-sm'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                <Users size={13} />
                Split (Dividido)
              </button>
            </div>

            {responsibility === 'split' && (
              <div className="pt-2.5 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">Modo de Divisão:</span>
                  <div className="flex rounded-xl bg-black/30 p-1 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setSplitMode('percentage')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                        splitMode === 'percentage'
                          ? 'bg-[#2563EB] text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Porcentagem (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSplitMode('manual');
                        setMyManualShare(myShareAmount);
                        setPartnerManualShare(partnerShareAmount);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                        splitMode === 'manual'
                          ? 'bg-[#2563EB] text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Valor Manual (R$)
                    </button>
                  </div>
                </div>

                {splitMode === 'percentage' ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[#60A5FA]">
                        {meMember.name}: {mySharePercent}% ({formatCurrency(myShareAmount)})
                      </span>
                      <span className="text-[#F472B6]">
                        {partnerMember.name}: {100 - mySharePercent}% ({formatCurrency(partnerShareAmount)})
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={mySharePercent}
                      onChange={(e) => setMySharePercent(Number(e.target.value))}
                      className="w-full accent-[#2563EB] cursor-pointer"
                    />
                    <div className="flex gap-1.5">
                      {[50, 60, 70, 40, 30].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setMySharePercent(pct)}
                          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-slate-300 cursor-pointer"
                        >
                          {pct}% / {100 - pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <CurrencyInput
                      label={`Parte de ${meMember.name}`}
                      value={myManualShare}
                      onChange={handleMyManualChange}
                    />
                    <CurrencyInput
                      label={`Parte de ${partnerMember.name}`}
                      value={partnerManualShare}
                      onChange={handlePartnerManualChange}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Recorrência: Único, Parcelado ou Conta Fixa */}
        {!editingTransaction && (
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Repetição / Parcelamento
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRecurrenceType('single')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer transition ${
                  recurrenceType === 'single'
                    ? 'bg-[#2563EB]/20 border-[#3B82F6] text-[#60A5FA]'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                Único (À Vista)
              </button>
              <button
                type="button"
                onClick={() => setRecurrenceType('installment')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border cursor-pointer transition ${
                  recurrenceType === 'installment'
                    ? 'bg-[#7C3AED]/20 border-[#8B5CF6] text-[#A78BFA]'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                <Layers size={13} />
                Parcelado
              </button>
              <button
                type="button"
                onClick={() => setRecurrenceType('fixed')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border cursor-pointer transition ${
                  recurrenceType === 'fixed'
                    ? 'bg-[#10B981]/20 border-[#10B981] text-[#34D399]'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                <Repeat size={13} />
                Fixo Mensal
              </button>
            </div>

            {recurrenceType === 'installment' && (
              <div className="flex items-center justify-between gap-4 pt-2">
                <div className="text-xs text-slate-300">
                  Quantidade de Parcelas:
                  {amount > 0 && (
                    <span className="block text-[11px] text-[#60A5FA] font-bold mt-0.5">
                      Total: {formatCurrency(amount * totalInstallments)} ({totalInstallments}x de{' '}
                      {formatCurrency(amount)})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTotalInstallments((p) => Math.max(2, p - 1))}
                    className="w-8 h-8 rounded-xl liquid-glass-interactive text-sm font-bold text-white"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={totalInstallments}
                    onChange={(e) => {
                      const v = parseInt(e.target.value.replace(/\D/g, ''), 10);
                      setTotalInstallments(Number.isFinite(v) ? Math.min(72, Math.max(2, v)) : 2);
                    }}
                    className="w-14 liquid-input rounded-xl px-2 py-1.5 text-center text-sm font-bold text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setTotalInstallments((p) => Math.min(72, p + 1))}
                    className="w-8 h-8 rounded-xl liquid-glass-interactive text-sm font-bold text-white"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {recurrenceType === 'fixed' && (
              <div className="flex items-center justify-between gap-4 pt-2">
                <div className="text-xs text-slate-300">
                  Projetar nos próximos quantos meses?
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFixedMonthsCount((p) => Math.max(2, p - 1))}
                    className="w-8 h-8 rounded-xl liquid-glass-interactive text-sm font-bold text-white"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={fixedMonthsCount}
                    onChange={(e) => {
                      const v = parseInt(e.target.value.replace(/\D/g, ''), 10);
                      setFixedMonthsCount(Number.isFinite(v) ? Math.min(60, Math.max(2, v)) : 12);
                    }}
                    className="w-14 liquid-input rounded-xl px-2 py-1.5 text-center text-sm font-bold text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setFixedMonthsCount((p) => Math.min(60, p + 1))}
                    className="w-8 h-8 rounded-xl liquid-glass-interactive text-sm font-bold text-white"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && type !== 'transfer' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <TagIcon size={12} />
              Tags (#etiquetas)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const active = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      active ? 'text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                    style={
                      active
                        ? {
                            backgroundColor: `${tag.color}25`,
                            border: `1px solid ${tag.color}`,
                            color: tag.color,
                          }
                        : { border: '1px solid rgba(255,255,255,0.1)' }
                    }
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    #{tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl liquid-glass-interactive text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-2xl btn-vivid-blue text-xs font-bold text-white cursor-pointer"
          >
            {editingTransaction
              ? 'Salvar Alterações'
              : duplicatingTransaction
              ? 'Confirmar Duplicação'
              : 'Adicionar Lançamento'}
          </button>
        </div>
      </form>
    </LiquidModal>
  );
}
