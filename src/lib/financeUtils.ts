import { format, parseISO, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BankAccount,
  CreditCard,
  GlobalViewFilter,
  InvoicePayment,
  Transaction,
} from '../types/finance';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatDateBR(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
}

export function formatMonthLabel(monthStr: string): string {
  try {
    const d = parseISO(`${monthStr}-01`);
    const label = format(d, 'MMMM yyyy', { locale: ptBR });
    return label.charAt(0).toUpperCase() + label.slice(1);
  } catch {
    return monthStr;
  }
}

/**
 * Calcula automaticamente o mês da fatura (YYYY-MM) e a data de vencimento (YYYY-MM-DD)
 * com base na data da compra (registrationDate) e no dia de fechamento/vencimento do cartão.
 */
export function computeCardInvoiceAndDueDate(
  registrationDate: string,
  closingDay: number,
  dueDay: number,
  installmentOffset = 0
): { invoiceMonth: string; dueDate: string } {
  const reg = parseISO(registrationDate);
  const purchaseDay = reg.getDate();

  // Se comprou no dia do fechamento ou depois, cai na fatura do mês seguinte
  let baseMonthDate = new Date(reg.getFullYear(), reg.getMonth(), 1);
  if (purchaseDay >= closingDay) {
    baseMonthDate = addMonths(baseMonthDate, 1);
  }

  // Se o dia de vencimento é menor que o dia de fechamento, vence no mês calendário seguinte ao fechamento
  if (dueDay < closingDay) {
    baseMonthDate = addMonths(baseMonthDate, 1);
  }

  const targetMonthDate = addMonths(baseMonthDate, installmentOffset);
  const invoiceMonth = format(targetMonthDate, 'yyyy-MM');
  const maxDayInMonth = new Date(
    targetMonthDate.getFullYear(),
    targetMonthDate.getMonth() + 1,
    0
  ).getDate();
  const safeDueDay = Math.min(Math.max(1, dueDay), maxDayInMonth);
  const dueDate = `${invoiceMonth}-${String(safeDueDay).padStart(2, '0')}`;

  return { invoiceMonth, dueDate };
}

/**
 * Filtra o valor de uma transação de acordo com o filtro global ('all' | 'me' | 'partner')
 */
export function getEffectiveTransactionAmount(
  tx: Transaction,
  viewFilter: GlobalViewFilter
): number {
  const sign = tx.isRefund ? -1 : 1;
  if (tx.type === 'transfer') return tx.amount;

  if (viewFilter === 'all') {
    return tx.amount * sign;
  }

  if (viewFilter === 'me') {
    if (tx.responsibility === 'me') return tx.amount * sign;
    if (tx.responsibility === 'partner') return 0;
    return (tx.myShareAmount ?? tx.amount / 2) * sign;
  }

  if (viewFilter === 'partner') {
    if (tx.responsibility === 'partner') return tx.amount * sign;
    if (tx.responsibility === 'me') return 0;
    return (tx.partnerShareAmount ?? tx.amount / 2) * sign;
  }

  return tx.amount * sign;
}

export function doesTransactionMatchView(
  tx: Transaction,
  viewFilter: GlobalViewFilter
): boolean {
  if (viewFilter === 'all') return true;
  if (tx.type === 'transfer') return true;
  if (tx.responsibility === 'split') return true;
  return tx.responsibility === viewFilter;
}

/**
 * Calcula o saldo atual e o saldo previsto de cada conta bancária
 * (Transações no cartão de crédito não afetam a conta até o pagamento da fatura)
 */
export function calculateAccountBalance(
  account: BankAccount,
  transactions: Transaction[],
  invoicePayments: InvoicePayment[],
  upToMonth?: string
): { currentBalance: number; projectedBalance: number } {
  let current = account.initialBalance;
  let projected = account.initialBalance;

  for (const tx of transactions) {
    if (tx.paymentMethod !== 'account') continue;

    if (upToMonth && tx.dueDate.slice(0, 7) > upToMonth) {
      continue;
    }

    if (tx.type === 'income' && tx.accountId === account.id) {
      projected += tx.amount;
      if (tx.status === 'paid') current += tx.amount;
    } else if (tx.type === 'expense' && tx.accountId === account.id) {
      projected -= tx.amount;
      if (tx.status === 'paid') current -= tx.amount;
    } else if (tx.type === 'transfer') {
      if (tx.accountId === account.id) {
        projected -= tx.amount;
        if (tx.status === 'paid') current -= tx.amount;
      }
      if (tx.destinationAccountId === account.id) {
        projected += tx.amount;
        if (tx.status === 'paid') current += tx.amount;
      }
    }
  }

  // Subtrai pagamentos de faturas realizados por esta conta
  for (const payment of invoicePayments) {
    if (payment.accountId === account.id) {
      if (!upToMonth || payment.paidDate.slice(0, 7) <= upToMonth) {
        current -= payment.amount;
        projected -= payment.amount;
      }
    }
  }

  return { currentBalance: current, projectedBalance: projected };
}

/**
 * Calcula o uso de limite do cartão de crédito (estilo Minhas Finanças):
 * - Compras únicas e parceladas consomem o limite de todas as faturas ainda não pagas.
 * - Compras fixas (assinaturas) consomem apenas a fatura do mês corrente (não travam 12 meses).
 * - Pagamentos de fatura liberam o limite de volta automaticamente.
 */
export function calculateCardLimitAndInvoice(
  card: CreditCard,
  transactions: Transaction[],
  invoicePayments: InvoicePayment[],
  selectedMonth: string
): {
  totalLimit: number;
  usedLimit: number;
  availableLimit: number;
  usagePercent: number;
  monthInvoiceTotal: number;
  monthInvoicePaid: number;
  monthInvoiceRemaining: number;
  invoiceTransactions: Transaction[];
} {
  const cardTxs = transactions.filter(
    (t) => t.paymentMethod === 'credit_card' && t.cardId === card.id && t.type === 'expense'
  );

  // Calcula faturas por mês para saber quanto já foi pago em cada mês
  const monthChargesMap: Record<string, number> = {};
  for (const tx of cardTxs) {
    const m = tx.invoiceMonth || tx.dueDate.slice(0, 7);
    const signedAmount = tx.isRefund ? -tx.amount : tx.amount;

    // Para o consumo de limite total: assinaturas fixas futuras além do mês atual não travam limite antecipado
    if (tx.recurrenceType === 'fixed' && m > selectedMonth) {
      continue;
    }
    monthChargesMap[m] = (monthChargesMap[m] || 0) + signedAmount;
  }

  const monthPaymentsMap: Record<string, number> = {};
  for (const p of invoicePayments) {
    if (p.cardId === card.id) {
      monthPaymentsMap[p.invoiceMonth] = (monthPaymentsMap[p.invoiceMonth] || 0) + p.amount;
    }
  }

  let usedLimit = 0;
  const allMonths = new Set([...Object.keys(monthChargesMap), ...Object.keys(monthPaymentsMap)]);
  for (const m of allMonths) {
    const charges = monthChargesMap[m] || 0;
    const paid = monthPaymentsMap[m] || 0;
    const openInMonth = Math.max(0, charges - paid);
    usedLimit += openInMonth;
  }

  // Fatura específica do mês selecionado
  const invoiceTransactions = cardTxs.filter(
    (t) => (t.invoiceMonth || t.dueDate.slice(0, 7)) === selectedMonth
  );
  const monthInvoiceTotal = invoiceTransactions.reduce(
    (acc, t) => acc + (t.isRefund ? -t.amount : t.amount),
    0
  );
  const monthInvoicePaid = monthPaymentsMap[selectedMonth] || 0;
  const monthInvoiceRemaining = Math.max(0, monthInvoiceTotal - monthInvoicePaid);

  const availableLimit = Math.max(0, card.totalLimit - usedLimit);
  const usagePercent =
    card.totalLimit > 0 ? Math.min(100, (usedLimit / card.totalLimit) * 100) : 0;

  return {
    totalLimit: card.totalLimit,
    usedLimit,
    availableLimit,
    usagePercent,
    monthInvoiceTotal,
    monthInvoicePaid,
    monthInvoiceRemaining,
    invoiceTransactions,
  };
}

/**
 * Calcula o "Acerto de Contas" do casal no mês para despesas com Split (Divididas)
 */
export function calculateCoupleSettlement(
  transactions: Transaction[],
  selectedMonth: string,
  dateFilterMode: 'dueDate' | 'registrationDate'
): {
  partnerOwesMe: number;
  iOwePartner: number;
  netBalance: number; // positivo = Ela me deve; negativo = Eu devo a ela
  splitCount: number;
} {
  let partnerOwesMe = 0;
  let iOwePartner = 0;
  let splitCount = 0;

  for (const tx of transactions) {
    if (tx.type !== 'expense' || tx.isRefund) continue;
    const refDate = dateFilterMode === 'dueDate' ? tx.dueDate : tx.registrationDate;
    const txMonth = (tx.paymentMethod === 'credit_card' && tx.invoiceMonth && dateFilterMode === 'dueDate')
      ? tx.invoiceMonth
      : refDate.slice(0, 7);

    if (txMonth !== selectedMonth) continue;

    if (tx.responsibility === 'split') {
      splitCount++;
      if (tx.paidBy === 'me') {
        partnerOwesMe += tx.partnerShareAmount;
      } else if (tx.paidBy === 'partner') {
        iOwePartner += tx.myShareAmount;
      }
    } else if (tx.responsibility === 'partner' && tx.paidBy === 'me') {
      splitCount++;
      partnerOwesMe += tx.amount;
    } else if (tx.responsibility === 'me' && tx.paidBy === 'partner') {
      splitCount++;
      iOwePartner += tx.amount;
    }
  }

  return {
    partnerOwesMe,
    iOwePartner,
    netBalance: partnerOwesMe - iOwePartner,
    splitCount,
  };
}
