import React, { useState } from 'react';
import {
  GlobalViewFilter,
  Transaction,
  WorkspaceData,
} from '../types/finance';
import {
  doesTransactionMatchView,
  formatCurrency,
  formatDateBR,
  getEffectiveTransactionAmount,
} from '../lib/financeUtils';
import { DynamicIcon } from '../lib/icons';
import { LiquidSelect } from './ui/LiquidSelect';
import {
  Search,
  Plus,
  Copy,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  Download,
  Layers,
  Repeat,
  CreditCard as CardIcon,
  Landmark,
  Users,
  Calendar,
} from 'lucide-react';

interface TransactionsViewProps {
  workspace: WorkspaceData;
  selectedMonth: string;
  viewFilter: GlobalViewFilter;
  dateFilterMode: 'dueDate' | 'registrationDate';
  onOpenNewTx: (type: 'expense' | 'income') => void;
  onEditTx: (tx: Transaction) => void;
  onDuplicateTx: (tx: Transaction) => void;
  onDeleteTx: (tx: Transaction) => void;
  onToggleTxStatus: (tx: Transaction) => void;
}

export function TransactionsView({
  workspace,
  selectedMonth,
  viewFilter,
  dateFilterMode,
  onOpenNewTx,
  onEditTx,
  onDuplicateTx,
  onDeleteTx,
  onToggleTxStatus,
}: TransactionsViewProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | 'account' | 'credit_card'>('all');

  const meMember = workspace.members.find((m) => m.role === 'me') || { name: 'Você' };
  const partnerMember = workspace.members.find((m) => m.role === 'partner') || { name: 'Namorada' };

  const filtered = workspace.transactions
    .filter((tx) => {
      if (!doesTransactionMatchView(tx, viewFilter)) return false;

      const refMonth =
        tx.paymentMethod === 'credit_card' && tx.invoiceMonth && dateFilterMode === 'dueDate'
          ? tx.invoiceMonth
          : (dateFilterMode === 'dueDate' ? tx.dueDate : tx.registrationDate).slice(0, 7);

      if (refMonth !== selectedMonth) return false;
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
      if (methodFilter !== 'all' && tx.paymentMethod !== methodFilter) return false;
      if (
        categoryFilter !== 'all' &&
        tx.categoryId !== categoryFilter &&
        tx.subcategoryId !== categoryFilter
      ) {
        return false;
      }
      if (
        search.trim() &&
        !tx.description.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate));

  const totalIncome = filtered
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + getEffectiveTransactionAmount(t, viewFilter), 0);

  const totalExpense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + getEffectiveTransactionAmount(t, viewFilter), 0);

  const handleExportCSV = () => {
    const headers = [
      'Descricao',
      'Tipo',
      'Valor Total',
      'Valor Filtrado',
      'Data Registro',
      'Data Vencimento',
      'Status',
      'Metodo',
      'Responsavel',
    ];
    const rows = filtered.map((tx) => [
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.type,
      tx.amount.toFixed(2),
      getEffectiveTransactionAmount(tx, viewFilter).toFixed(2),
      tx.registrationDate,
      tx.dueDate,
      tx.status,
      tx.paymentMethod,
      tx.responsibility,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `extrato-${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Barra Superior de Ações e Resumo Rápido */}
      <div className="liquid-glass rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Extrato & Lançamentos</h2>
          <p className="text-xs text-slate-300">
            CRUD completo: crie, duplique abrindo o modal, edite ou exclua qualquer operação
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-2xl liquid-glass-interactive text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={15} />
            Exportar CSV
          </button>

          <button
            type="button"
            onClick={() => onOpenNewTx('income')}
            className="px-4 py-2.5 rounded-2xl btn-vivid-emerald text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            Nova Receita
          </button>

          <button
            type="button"
            onClick={() => onOpenNewTx('expense')}
            className="px-4 py-2.5 rounded-2xl btn-vivid-crimson text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            Nova Despesa
          </button>
        </div>
      </div>

      {/* Filtros Nativos Liquid Glass */}
      <div className="liquid-glass rounded-3xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Buscar por descrição
          </label>
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ex: Supermercado, Aluguel, Smart TV..."
              className="w-full liquid-input rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400"
            />
          </div>
        </div>

        <LiquidSelect
          label="Tipo de Operação"
          value={typeFilter}
          onChange={(v) => setTypeFilter(v as typeof typeFilter)}
          options={[
            { value: 'all', label: 'Todos os Tipos', icon: 'Layers', color: '#0052FF' },
            { value: 'expense', label: 'Apenas Despesas', icon: 'TrendingDown', color: '#FF1744' },
            { value: 'income', label: 'Apenas Receitas', icon: 'TrendingUp', color: '#00E676' },
            { value: 'transfer', label: 'Transferências', icon: 'ArrowLeftRight', color: '#00D4FF' },
          ]}
        />

        <LiquidSelect
          label="Categoria"
          value={categoryFilter}
          onChange={setCategoryFilter}
          searchable
          options={[
            { value: 'all', label: 'Todas as Categorias', icon: 'Layers', color: '#0052FF' },
            ...workspace.categories.map((c) => ({
              value: c.id,
              label: c.parentId ? `↳ ${c.name}` : c.name,
              icon: c.icon,
              color: c.color,
            })),
          ]}
        />

        <LiquidSelect
          label="Status / Meio"
          value={`${statusFilter}:${methodFilter}`}
          onChange={(val) => {
            const [s, m] = val.split(':');
            setStatusFilter(s as typeof statusFilter);
            setMethodFilter(m as typeof methodFilter);
          }}
          options={[
            { value: 'all:all', label: 'Todos Status & Meios', icon: 'Wallet', color: '#0052FF' },
            { value: 'paid:all', label: 'Somente Efetivados (Pagos)', icon: 'ShieldCheck', color: '#00E676' },
            { value: 'pending:all', label: 'Somente Pendentes', icon: 'Clock', color: '#FFB300' },
            { value: 'all:credit_card', label: 'Compras no Cartão', icon: 'CreditCard', color: '#7C3AED' },
            { value: 'all:account', label: 'Débito / PIX / Conta', icon: 'Landmark', color: '#00D4FF' },
          ]}
        />
      </div>

      {/* Resumo dos itens filtrados */}
      <div className="grid grid-cols-3 gap-3">
        <div className="liquid-glass rounded-2xl p-3.5 text-center">
          <div className="text-[11px] text-slate-400 uppercase font-bold">Entradas Filtradas</div>
          <div className="text-base sm:text-lg font-extrabold text-[#00E676]">
            {formatCurrency(totalIncome)}
          </div>
        </div>
        <div className="liquid-glass rounded-2xl p-3.5 text-center">
          <div className="text-[11px] text-slate-400 uppercase font-bold">Saídas Filtradas</div>
          <div className="text-base sm:text-lg font-extrabold text-[#FF5252]">
            {formatCurrency(totalExpense)}
          </div>
        </div>
        <div className="liquid-glass rounded-2xl p-3.5 text-center">
          <div className="text-[11px] text-slate-400 uppercase font-bold">Saldo Filtrado</div>
          <div
            className={`text-base sm:text-lg font-extrabold ${
              totalIncome - totalExpense >= 0 ? 'text-[#00D4FF]' : 'text-[#FF5252]'
            }`}
          >
            {formatCurrency(totalIncome - totalExpense)}
          </div>
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="liquid-glass rounded-3xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="text-sm font-bold text-white">
              Nenhum lançamento encontrado para os filtros aplicados
            </div>
            <p className="text-xs text-slate-400">
              Adicione uma nova receita ou despesa ou limpe os filtros acima.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filtered.map((tx) => {
              const cat = workspace.categories.find((c) => c.id === tx.categoryId);
              const subcat = workspace.categories.find((c) => c.id === tx.subcategoryId);
              const acc = workspace.accounts.find((a) => a.id === tx.accountId);
              const card = workspace.cards.find((c) => c.id === tx.cardId);
              const effectiveAmount = getEffectiveTransactionAmount(tx, viewFilter);

              return (
                <div
                  key={tx.id}
                  className="p-4 sm:px-6 hover:bg-white/[0.05] transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    {/* Botão Status 1-clique */}
                    <button
                      type="button"
                      onClick={() => onToggleTxStatus(tx)}
                      title={
                        tx.status === 'paid'
                          ? 'Efetivado (Clique para voltar p/ Pendente)'
                          : 'Pendente (Clique para dar baixa)'
                      }
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition cursor-pointer ${
                        tx.status === 'paid'
                          ? 'bg-[#00E676]/20 border-[#00E676]/60 text-[#00E676]'
                          : 'bg-[#FFB300]/20 border-[#FFB300]/60 text-[#FFB300]'
                      }`}
                    >
                      {tx.status === 'paid' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                    </button>

                    {/* Ícone da Categoria */}
                    <span
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${cat?.color || '#0052FF'}28`,
                        color: cat?.color || '#0052FF',
                        border: `1px solid ${cat?.color || '#0052FF'}55`,
                      }}
                    >
                      <DynamicIcon name={cat?.icon || 'Wallet'} size={18} />
                    </span>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white">{tx.description}</span>

                        {/* Badge Parcela / Fixo (Sólido com texto branco para alto contraste no Light e Dark) */}
                        {tx.recurrenceType === 'installment' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#7C3AED] on-vivid text-[10px] font-bold flex items-center gap-1 shadow-xs">
                            <Layers size={11} /> Parcela {tx.installmentNumber}/{tx.totalInstallments}
                          </span>
                        )}
                        {tx.recurrenceType === 'fixed' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#10B981] on-vivid text-[10px] font-bold flex items-center gap-1 shadow-xs">
                            <Repeat size={11} /> Fixo
                          </span>
                        )}

                        {/* Badge Responsável / Split */}
                        {tx.responsibility === 'split' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#6366F1] on-vivid text-[10px] font-bold flex items-center gap-1 shadow-xs">
                            <Users size={11} /> Split ({meMember.name} {formatCurrency(tx.myShareAmount)} /{' '}
                            {partnerMember.name} {formatCurrency(tx.partnerShareAmount)})
                          </span>
                        ) : (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold on-vivid shadow-xs ${
                              tx.responsibility === 'me'
                                ? 'bg-[#2563EB]'
                                : 'bg-[#EC4899]'
                            }`}
                          >
                            {tx.responsibility === 'me' ? meMember.name : partnerMember.name}
                          </span>
                        )}
                      </div>

                      {/* Metadados: Datas, Categoria, Conta/Cartão e Tags */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-[#2563EB]" />
                          Registro: <strong className="text-slate-200">{formatDateBR(tx.registrationDate)}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          Vencimento: <strong className="text-slate-200">{formatDateBR(tx.dueDate)}</strong>
                        </span>
                        <span>
                          • {cat?.name || 'Transferência'}
                          {subcat ? ` > ${subcat.name}` : ''}
                        </span>
                        <span className="flex items-center gap-1 text-slate-300">
                          {tx.paymentMethod === 'credit_card' ? (
                            <>
                              <CardIcon size={12} className="text-[#7C3AED]" />
                              {card?.name || 'Cartão'} (Fatura {tx.invoiceMonth})
                            </>
                          ) : (
                            <>
                              <Landmark size={12} className="text-[#2563EB]" />
                              {acc?.name || 'Conta'}
                            </>
                          )}
                        </span>
                      </div>

                      {tx.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {tx.tags.map((tid) => {
                            const tagObj = workspace.tags.find((t) => t.id === tid);
                            if (!tagObj) return null;
                            return (
                              <span
                                key={tid}
                                className="text-[10px] font-bold px-2.5 py-0.5 rounded-full on-vivid shadow-xs"
                                style={{
                                  backgroundColor: tagObj.color,
                                }}
                              >
                                #{tagObj.name}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Valor e Botões de Ação (Duplicar abrindo Modal, Editar, Excluir) */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                    <div className="text-left sm:text-right">
                      <div
                        className={`text-base font-extrabold ${
                          tx.type === 'income'
                            ? 'text-[#00E676]'
                            : tx.type === 'expense'
                            ? 'text-[#FF5252]'
                            : 'text-[#00D4FF]'
                        }`}
                      >
                        {tx.type === 'expense' ? '-' : '+'}
                        {formatCurrency(effectiveAmount)}
                      </div>
                      {viewFilter !== 'all' && tx.responsibility === 'split' && (
                        <div className="text-[10px] text-slate-400">
                          Total cheio: {formatCurrency(tx.amount)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onDuplicateTx(tx)}
                        title="Duplicar abrindo formulário para escolher nova data"
                        className="px-2.5 py-2 rounded-xl liquid-glass-interactive text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:bg-[#2563EB] hover:text-white dark:hover:text-white flex items-center gap-1 cursor-pointer transition"
                      >
                        <Copy size={14} />
                        <span className="hidden md:inline">Duplicar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditTx(tx)}
                        title="Editar lançamento"
                        className="p-2 rounded-xl liquid-glass-interactive text-slate-600 dark:text-slate-200 hover:text-black dark:hover:text-white cursor-pointer"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteTx(tx)}
                        title="Excluir lançamento"
                        className="p-2 rounded-xl liquid-glass-interactive text-rose-500 hover:text-[#F43F5E] cursor-pointer"
                      >
                        <Trash2 size={15} />
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
  );
}
