import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { format, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  GlobalViewFilter,
  Transaction,
  WorkspaceData,
} from '../types/finance';
import {
  calculateAccountBalance,
  calculateCardLimitAndInvoice,
  calculateCoupleSettlement,
  doesTransactionMatchView,
  formatCurrency,
  formatDateBR,
  getEffectiveTransactionAmount,
} from '../lib/financeUtils';
import { DynamicIcon } from '../lib/icons';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  CreditCard as CardIcon,
  Target,
  Flame,
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  Trash2,
  Handshake,
  Sparkles,
  Plus,
  TrendingUp,
} from 'lucide-react';

interface DashboardViewProps {
  workspace: WorkspaceData;
  selectedMonth: string; // YYYY-MM
  viewFilter: GlobalViewFilter;
  dateFilterMode: 'dueDate' | 'registrationDate';
  onOpenNewTx: (type: 'expense' | 'income') => void;
  onEditTx: (tx: Transaction) => void;
  onDuplicateTx: (tx: Transaction) => void;
  onDeleteTx: (tx: Transaction) => void;
  onToggleTxStatus: (tx: Transaction) => void;
  onNavigateTab: (tab: string) => void;
}

export function DashboardView({
  workspace,
  selectedMonth,
  viewFilter,
  dateFilterMode,
  onOpenNewTx,
  onEditTx,
  onDuplicateTx,
  onDeleteTx,
  onToggleTxStatus,
  onNavigateTab,
}: DashboardViewProps) {
  const meMember = workspace.members.find((m) => m.role === 'me') || {
    name: 'Você',
    avatarColor: '#0052FF',
  };
  const partnerMember = workspace.members.find((m) => m.role === 'partner') || {
    name: 'Namorada',
    avatarColor: '#FF2E93',
  };

  // Saldos das Contas Bancárias
  const filteredAccounts = workspace.accounts.filter((acc) => {
    if (!acc.includeInTotal) return false;
    if (viewFilter === 'all') return true;
    return acc.owner === viewFilter || acc.owner === 'both';
  });

  let totalCurrentBalance = 0;
  let totalProjectedBalance = 0;

  const accountBalances = filteredAccounts.map((acc) => {
    const bal = calculateAccountBalance(
      acc,
      workspace.transactions,
      workspace.invoicePayments,
      selectedMonth
    );
    totalCurrentBalance += bal.currentBalance;
    totalProjectedBalance += bal.projectedBalance;
    return { account: acc, ...bal };
  });

  // Transações do Mês Selecionado
  const monthTransactions = workspace.transactions.filter((tx) => {
    if (!doesTransactionMatchView(tx, viewFilter)) return false;
    const refDate =
      tx.paymentMethod === 'credit_card' && tx.invoiceMonth && dateFilterMode === 'dueDate'
        ? `${tx.invoiceMonth}-01`
        : dateFilterMode === 'dueDate'
        ? tx.dueDate
        : tx.registrationDate;
    return refDate.slice(0, 7) === selectedMonth;
  });

  let monthIncomesReceived = 0;
  let monthIncomesPending = 0;
  let monthExpensesPaid = 0;
  let monthExpensesPending = 0;

  for (const tx of monthTransactions) {
    const val = getEffectiveTransactionAmount(tx, viewFilter);
    if (tx.type === 'income') {
      if (tx.status === 'paid') monthIncomesReceived += val;
      else monthIncomesPending += val;
    } else if (tx.type === 'expense') {
      if (tx.status === 'paid') monthExpensesPaid += val;
      else monthExpensesPending += val;
    }
  }

  const totalMonthIncome = monthIncomesReceived + monthIncomesPending;
  const totalMonthExpense = monthExpensesPaid + monthExpensesPending;
  const monthNetSavings = totalMonthIncome - totalMonthExpense;

  // Acerto de Contas do Casal (Split)
  const settlement = calculateCoupleSettlement(
    workspace.transactions,
    selectedMonth,
    dateFilterMode
  );

  // Gráfico Donut: Despesas por Categoria Principal
  const categoryTotalsMap: Record<
    string,
    { name: string; value: number; color: string; icon: string }
  > = {};

  for (const tx of monthTransactions) {
    if (tx.type !== 'expense') continue;
    const val = getEffectiveTransactionAmount(tx, viewFilter);
    if (val <= 0) continue;
    const cat =
      workspace.categories.find((c) => c.id === tx.categoryId) || {
        id: 'other',
        name: 'Outros',
        color: '#0052FF',
        icon: 'Wallet',
      };
    if (!categoryTotalsMap[cat.id]) {
      categoryTotalsMap[cat.id] = {
        name: cat.name,
        value: 0,
        color: cat.color,
        icon: cat.icon,
      };
    }
    categoryTotalsMap[cat.id].value += val;
  }

  const pieData = Object.values(categoryTotalsMap).sort((a, b) => b.value - a.value);

  // Gráfico de Barras: Evolução Últimos 6 Meses
  const sixMonthsHistory = [-4, -3, -2, -1, 0, 1].map((offset) => {
    const d = subMonths(parseISO(`${selectedMonth}-01`), -offset);
    const mStr = format(d, 'yyyy-MM');
    const mLabel = format(d, 'MMM', { locale: ptBR }).toUpperCase();

    let inc = 0;
    let exp = 0;
    for (const tx of workspace.transactions) {
      if (!doesTransactionMatchView(tx, viewFilter)) continue;
      const refMonth =
        tx.paymentMethod === 'credit_card' && tx.invoiceMonth && dateFilterMode === 'dueDate'
          ? tx.invoiceMonth
          : (dateFilterMode === 'dueDate' ? tx.dueDate : tx.registrationDate).slice(0, 7);
      if (refMonth !== mStr) continue;
      const val = getEffectiveTransactionAmount(tx, viewFilter);
      if (tx.type === 'income') inc += val;
      if (tx.type === 'expense') exp += val;
    }

    return {
      month: mLabel,
      Receitas: Number(inc.toFixed(2)),
      Despesas: Number(exp.toFixed(2)),
    };
  });

  // Contas pendentes a vencer
  const pendingBills = monthTransactions
    .filter((tx) => tx.status === 'pending' && tx.type === 'expense')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div className="space-y-6">
      {/* 4 KPI Cards Principais Sólidos e Limpos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Saldo em Contas */}
        <div className="liquid-glass rounded-3xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Saldo em Contas
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#2563EB]/15 border border-[#3B82F6]/40 flex items-center justify-center text-[#3B82F6]">
              <Wallet size={19} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {formatCurrency(totalCurrentBalance)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-white/10">
            <span>Previsto fim do mês:</span>
            <span className="font-bold text-[#3B82F6]">
              {formatCurrency(totalProjectedBalance)}
            </span>
          </div>
        </div>

        {/* Card 2: Receitas do Mês */}
        <div className="liquid-glass rounded-3xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Receitas do Mês
            </span>
            <button
              type="button"
              onClick={() => onOpenNewTx('income')}
              title="Nova Receita"
              className="w-10 h-10 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] hover:bg-[#10B981]/25 transition cursor-pointer"
            >
              <ArrowUpCircle size={19} />
            </button>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#10B981] tracking-tight">
            {formatCurrency(totalMonthIncome)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-white/10">
            <span>Recebido: {formatCurrency(monthIncomesReceived)}</span>
            <span className="text-[#F59E0B]">Falta: {formatCurrency(monthIncomesPending)}</span>
          </div>
        </div>

        {/* Card 3: Despesas do Mês */}
        <div className="liquid-glass rounded-3xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Despesas do Mês
            </span>
            <button
              type="button"
              onClick={() => onOpenNewTx('expense')}
              title="Nova Despesa"
              className="w-10 h-10 rounded-2xl bg-[#F43F5E]/15 border border-[#F43F5E]/40 flex items-center justify-center text-[#F43F5E] hover:bg-[#F43F5E]/25 transition cursor-pointer"
            >
              <ArrowDownCircle size={19} />
            </button>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#F43F5E] tracking-tight">
            {formatCurrency(totalMonthExpense)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-white/10">
            <span>Pago: {formatCurrency(monthExpensesPaid)}</span>
            <span className="text-[#F59E0B]">A pagar: {formatCurrency(monthExpensesPending)}</span>
          </div>
        </div>

        {/* Card 4: Balanço & Acerto do Casal */}
        <div className="liquid-glass rounded-3xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Balanço & Split Casal
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#7C3AED]/15 border border-[#8B5CF6]/40 flex items-center justify-center text-[#8B5CF6]">
              <Handshake size={19} />
            </div>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              monthNetSavings >= 0 ? 'text-[#3B82F6]' : 'text-[#F43F5E]'
            }`}
          >
            {formatCurrency(monthNetSavings)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-white/10">
            {Math.abs(settlement.netBalance) < 0.01 ? (
              <span className="text-[#10B981] font-semibold">
                Casal 100% quite neste mês!
              </span>
            ) : settlement.netBalance > 0 ? (
              <span className="text-[#EC4899] font-bold">
                {partnerMember.name} te deve {formatCurrency(settlement.netBalance)}
              </span>
            ) : (
              <span className="text-[#3B82F6] font-bold">
                Você deve {formatCurrency(Math.abs(settlement.netBalance))} p/ {partnerMember.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Linha 2: Gráficos (Despesas por Categoria + Evolução 6 Meses) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Donut: Categorias */}
        <div className="lg:col-span-5 liquid-glass rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Gastos por Categoria</h3>
              <p className="text-xs text-slate-400">Distribuição viva das saídas do mês</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('categories')}
              className="text-xs font-bold text-[#00D4FF] hover:underline cursor-pointer"
            >
              Editar Categorias
            </button>
          </div>

          {pieData.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Nenhuma despesa registrada neste período.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={76}
                      paddingAngle={4}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} stroke="rgba(255,255,255,0.2)" />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => formatCurrency(val)}
                      contentStyle={{
                        backgroundColor: 'rgba(9, 17, 40, 0.95)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                {pieData.map((item) => {
                  const pct =
                    totalMonthExpense > 0 ? Math.round((item.value / totalMonthExpense) * 100) : 0;
                  return (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${item.color}30`,
                            color: item.color,
                          }}
                        >
                          <DynamicIcon name={item.icon} size={13} />
                        </span>
                        <span className="font-semibold text-white truncate">{item.name}</span>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="font-bold text-white">{formatCurrency(item.value)}</div>
                        <div className="text-[10px] text-slate-400">{pct}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* BarChart: Receitas vs Despesas 6 Meses */}
        <div className="lg:col-span-7 liquid-glass rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-[#00D4FF]" />
                Fluxo Comparativo (Receitas x Despesas)
              </h3>
              <p className="text-xs text-slate-400">Visão de evolução mensal e projeção</p>
            </div>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sixMonthsHistory} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(v) => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                />
                <Tooltip
                  formatter={(val: number) => formatCurrency(val)}
                  contentStyle={{
                    backgroundColor: 'rgba(9, 17, 40, 0.95)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="Receitas" fill="#00E676" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Despesas" fill="#FF1744" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Linha 3: Cartões de Crédito (Com Limite Automático) + Contas Bancárias + Orçamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resumo Cartões de Crédito */}
        <div className="liquid-glass rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CardIcon size={18} className="text-[#A855F7]" />
              Cartões & Limites
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('cards')}
              className="text-xs font-bold text-[#00D4FF] hover:underline cursor-pointer"
            >
              Ver Faturas
            </button>
          </div>

          <div className="space-y-3">
            {workspace.cards.map((card) => {
              const info = calculateCardLimitAndInvoice(
                card,
                workspace.transactions,
                workspace.invoicePayments,
                selectedMonth
              );
              return (
                <div
                  key={card.id}
                  onClick={() => onNavigateTab('cards')}
                  className="p-4 rounded-2xl liquid-glass-interactive cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{
                          backgroundColor: `${card.color}30`,
                          color: card.color,
                          border: `1px solid ${card.color}60`,
                        }}
                      >
                        <DynamicIcon name={card.icon} size={16} />
                      </span>
                      <div>
                        <div className="text-xs font-bold text-white">{card.name}</div>
                        <div className="text-[10px] text-slate-400">
                          Fecha dia {card.closingDay} • Vence dia {card.dueDay}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-[#FF5252]">
                        Fatura: {formatCurrency(info.monthInvoiceRemaining)}
                      </div>
                      <div className="text-[10px] text-emerald-300 font-semibold">
                        Livre: {formatCurrency(info.availableLimit)}
                      </div>
                    </div>
                  </div>

                  {/* Barra de Limite Consumido */}
                  <div className="space-y-1">
                    <div className="w-full h-2 rounded-full progress-track overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${info.usagePercent}%`,
                          backgroundColor:
                            info.usagePercent > 85 ? '#F43F5E' : card.color,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Usado: {formatCurrency(info.usedLimit)}</span>
                      <span>Limite: {formatCurrency(info.totalLimit)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resumo Contas Bancárias */}
        <div className="liquid-glass rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Wallet size={18} className="text-[#00D4FF]" />
              Contas & Carteiras
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('accounts')}
              className="text-xs font-bold text-[#00D4FF] hover:underline cursor-pointer"
            >
              Gerenciar
            </button>
          </div>

          <div className="space-y-2.5">
            {accountBalances.map(({ account, currentBalance, projectedBalance }) => (
              <div
                key={account.id}
                onClick={() => onNavigateTab('accounts')}
                className="p-3.5 rounded-2xl liquid-glass-interactive flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${account.color}30`,
                      color: account.color,
                      border: `1px solid ${account.color}60`,
                    }}
                  >
                    <DynamicIcon name={account.icon} size={17} />
                  </span>
                  <div className="truncate">
                    <div className="text-xs font-bold text-white truncate">{account.name}</div>
                    <div className="text-[10px] text-slate-400">
                      Previsto: {formatCurrency(projectedBalance)}
                    </div>
                  </div>
                </div>
                <div
                  className={`text-sm font-extrabold shrink-0 ${
                    currentBalance >= 0 ? 'text-[#00E676]' : 'text-[#FF5252]'
                  }`}
                >
                  {formatCurrency(currentBalance)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Termômetro de Orçamentos do Mês */}
        <div className="liquid-glass rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Flame size={18} className="text-[#FF6D00]" />
              Orçamentos do Mês
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('budgets')}
              className="text-xs font-bold text-[#00D4FF] hover:underline cursor-pointer"
            >
              Ver Todos
            </button>
          </div>

          <div className="space-y-3">
            {workspace.budgets.map((bgt) => {
              const spent = monthTransactions
                .filter((tx) => {
                  if (tx.type !== 'expense') return false;
                  if (bgt.scopeType === 'category') return tx.categoryId === bgt.targetId;
                  if (bgt.scopeType === 'tag') return tx.tags.includes(bgt.targetId);
                  if (bgt.scopeType === 'card') return tx.cardId === bgt.targetId;
                  return false;
                })
                .reduce((acc, tx) => acc + getEffectiveTransactionAmount(tx, bgt.ownerFilter), 0);

              const pct = bgt.monthlyLimit > 0 ? Math.round((spent / bgt.monthlyLimit) * 100) : 0;
              const isOver = pct >= 100;
              const isWarn = pct >= bgt.alertPercent && !isOver;

              return (
                <div
                  key={bgt.id}
                  onClick={() => onNavigateTab('budgets')}
                  className="p-3.5 rounded-2xl liquid-glass-interactive space-y-2 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-7 h-7 rounded-xl flex items-center justify-center"
                        style={{
                          backgroundColor: `${bgt.color}30`,
                          color: bgt.color,
                        }}
                      >
                        <DynamicIcon name={bgt.icon} size={14} />
                      </span>
                      <span className="text-xs font-bold text-white">{bgt.name}</span>
                    </div>
                    <span
                      className={`text-xs font-extrabold ${
                        isOver
                          ? 'text-[#FF1744]'
                          : isWarn
                          ? 'text-[#FFB300]'
                          : 'text-[#00E676]'
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full progress-track overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, pct)}%`,
                        backgroundColor: isOver ? '#FF1744' : isWarn ? '#FFB300' : '#00E676',
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>Gasto: {formatCurrency(spent)}</span>
                    <span>Teto: {formatCurrency(bgt.monthlyLimit)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Linha 4: Contas a Vencer + Últimos Lançamentos com Ações Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Contas a Vencer (Dar Baixa 1 Clique) */}
        <div className="lg:col-span-5 liquid-glass rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock size={18} className="text-[#FFB300]" />
                Contas Pendentes do Mês
              </h3>
              <p className="text-xs text-slate-400">Clique no check para dar baixa imediata</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#FFB300]/20 text-[#FFB300] text-xs font-bold">
              {pendingBills.length}
            </span>
          </div>

          {pendingBills.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Sparkles size={26} className="text-[#00E676] mx-auto" />
              <div className="text-xs font-bold text-white">Tudo em dia neste mês!</div>
              <div className="text-[11px] text-slate-400">Nenhuma despesa pendente encontrada.</div>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {pendingBills.map((tx) => {
                const cat = workspace.categories.find((c) => c.id === tx.categoryId);
                return (
                  <div
                    key={tx.id}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => onToggleTxStatus(tx)}
                        title="Marcar como Pago"
                        className="w-8 h-8 rounded-xl bg-[#FFB300]/20 hover:bg-[#00E676]/30 border border-[#FFB300]/50 hover:border-[#00E676] flex items-center justify-center text-[#FFB300] hover:text-[#00E676] transition cursor-pointer shrink-0"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {tx.description}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Vence: {formatDateBR(tx.dueDate)} • {cat?.name || 'Geral'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-extrabold text-[#FF5252]">
                        {formatCurrency(getEffectiveTransactionAmount(tx, viewFilter))}
                      </div>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <button
                          type="button"
                          onClick={() => onDuplicateTx(tx)}
                          title="Duplicar abrindo modal"
                          className="p-1 text-slate-400 hover:text-[#00D4FF] cursor-pointer"
                        >
                          <Copy size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditTx(tx)}
                          title="Editar"
                          className="p-1 text-slate-400 hover:text-white cursor-pointer"
                        >
                          <Edit3 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Últimas Movimentações do Mês */}
        <div className="lg:col-span-7 liquid-glass rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Últimos Lançamentos do Mês</h3>
              <p className="text-xs text-slate-400">
                Duplique, edite ou exclua qualquer registro diretamente
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenNewTx('expense')}
                className="px-3 py-1.5 rounded-xl btn-vivid-blue text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Novo
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('transactions')}
                className="text-xs font-bold text-[#00D4FF] hover:underline cursor-pointer"
              >
                Extrato Completo
              </button>
            </div>
          </div>

          {monthTransactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Nenhuma movimentação registrada neste mês.
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {monthTransactions.slice(0, 8).map((tx) => {
                const cat = workspace.categories.find((c) => c.id === tx.categoryId);
                const effVal = getEffectiveTransactionAmount(tx, viewFilter);
                return (
                  <div
                    key={tx.id}
                    className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${cat?.color || '#0052FF'}28`,
                          color: cat?.color || '#0052FF',
                          border: `1px solid ${cat?.color || '#0052FF'}55`,
                        }}
                      >
                        <DynamicIcon name={cat?.icon || 'Wallet'} size={16} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">
                            {tx.description}
                          </span>
                          {tx.responsibility === 'split' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6366F1] on-vivid">
                              Split {tx.mySharePercent}%/{tx.partnerSharePercent}%
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Reg: {formatDateBR(tx.registrationDate)}</span>
                          <span>•</span>
                          <span>Venc: {formatDateBR(tx.dueDate)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div
                          className={`text-xs font-extrabold ${
                            tx.type === 'income'
                              ? 'text-[#00E676]'
                              : tx.type === 'expense'
                              ? 'text-[#FF5252]'
                              : 'text-[#00D4FF]'
                          }`}
                        >
                          {tx.type === 'expense' ? '-' : '+'}
                          {formatCurrency(effVal)}
                        </div>
                        <span
                          className={`text-[10px] font-semibold ${
                            tx.status === 'paid' ? 'text-emerald-400' : 'text-amber-300'
                          }`}
                        >
                          {tx.status === 'paid' ? 'Efetivado' : 'Pendente'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onDuplicateTx(tx)}
                          title="Duplicar abrindo modal para trocar a data"
                          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-[#0052FF]/30 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditTx(tx)}
                          title="Editar lançamento"
                          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTx(tx)}
                          title="Excluir lançamento"
                          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-[#FF1744]/30 flex items-center justify-center text-slate-300 hover:text-[#FF5252] cursor-pointer"
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
    </div>
  );
}
