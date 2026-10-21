import React, { useState, useEffect, useCallback } from 'react';
import { format, addMonths, subMonths, parseISO } from 'date-fns';
import {
  BankAccount,
  Budget,
  Category,
  CoupleMember,
  CreditCard,
  FinancialGoal,
  GlobalViewFilter,
  InvoicePayment,
  SeriesDeleteScope,
  SeriesEditScope,
  TagItem,
  Transaction,
  TransactionType,
  WorkspaceData,
} from './types/finance';
import {
  AppUserSession,
  loadWorkspaceFromCloudOrLocal,
  saveWorkspaceToCloudAndLocal,
  supabase,
} from './lib/supabase';
import { getInitialSeedData } from './lib/seedData';
import { formatMonthLabel } from './lib/financeUtils';
import { AuthScreen } from './components/AuthScreen';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { CreditCardsView } from './components/CreditCardsView';
import { AccountsView } from './components/AccountsView';
import { CategoriesView } from './components/CategoriesView';
import { BudgetsView } from './components/BudgetsView';
import { GoalsView } from './components/GoalsView';
import { CoupleSettingsView } from './components/CoupleSettingsView';
import { TransactionModal } from './components/TransactionModal';
import { DeleteTransactionModal } from './components/DeleteTransactionModal';
import {
  LayoutDashboard,
  ListOrdered,
  CreditCard as CardIcon,
  Landmark,
  Flame,
  Target,
  Tags,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Calendar,
  Heart,
  Cloud,
  Sun,
  Moon,
  User,
} from 'lucide-react';

const SESSION_STORAGE_KEY = 'financas_pro_casal_active_session';
const THEME_STORAGE_KEY = 'financas_pro_casal_theme';

export function App() {
  const [session, setSession] = useState<AppUserSession | null>(() => {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [workspace, setWorkspace] = useState<WorkspaceData>(() => getInitialSeedData());
  const [cloudConnected, setCloudConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    format(new Date(), 'yyyy-MM')
  );
  const [viewFilter, setViewFilter] = useState<GlobalViewFilter>('all');
  const [dateFilterMode, setDateFilterMode] = useState<'dueDate' | 'registrationDate'>(
    'dueDate'
  );
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Transaction Modal States
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalInitialType, setTxModalInitialType] =
    useState<TransactionType>('expense');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [duplicatingTx, setDuplicatingTx] = useState<Transaction | null>(null);

  // Delete Transaction Modal State
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  const syncFromCloud = useCallback(async () => {
    const res = await loadWorkspaceFromCloudOrLocal();
    setWorkspace(res.data);
    setCloudConnected(res.cloudConnected);
  }, []);

  useEffect(() => {
    syncFromCloud();
  }, [syncFromCloud]);

  const persistWorkspace = useCallback(async (nextData: WorkspaceData) => {
    setWorkspace(nextData);
    const ok = await saveWorkspaceToCloudAndLocal(nextData);
    if (ok) setCloudConnected(true);
  }, []);

  const handleLoginSuccess = (newSession: AppUserSession) => {
    setSession(newSession);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(null);
  };

  // =========================================================================
  // CRUD HANDLERS: TRANSACTIONS (Incluso Duplicar, Parcelas e Contas Fixas)
  // =========================================================================

  const handleOpenNewTx = (type: TransactionType = 'expense') => {
    setEditingTx(null);
    setDuplicatingTx(null);
    setTxModalInitialType(type);
    setIsTxModalOpen(true);
  };

  const handleOpenEditTx = (tx: Transaction) => {
    setDuplicatingTx(null);
    setEditingTx(tx);
    setIsTxModalOpen(true);
  };

  // Quando clica em Duplicar: Abre o Modal de Formulário pré-preenchido para mudar a data
  const handleOpenDuplicateTx = (tx: Transaction) => {
    setEditingTx(null);
    setDuplicatingTx(tx);
    setIsTxModalOpen(true);
  };

  const handleSaveNewTransactions = (newItems: Transaction[]) => {
    persistWorkspace({
      ...workspace,
      transactions: [...newItems, ...workspace.transactions],
    });
  };

  const handleSaveEditedTransaction = (
    originalTx: Transaction,
    updatedFields: Partial<Transaction>,
    scope: SeriesEditScope
  ) => {
    const nextTransactions = workspace.transactions.map((item) => {
      if (item.id === originalTx.id) {
        return { ...item, ...updatedFields };
      }

      if (
        scope === 'this_and_future' &&
        originalTx.seriesId &&
        item.seriesId === originalTx.seriesId
      ) {
        const isFutureByInstallment =
          originalTx.installmentNumber !== undefined &&
          item.installmentNumber !== undefined &&
          item.installmentNumber > originalTx.installmentNumber;

        const isFutureByDate =
          item.dueDate > originalTx.dueDate;

        if (isFutureByInstallment || isFutureByDate) {
          const baseName = (updatedFields.description || item.description).replace(
            /\s*\(\d+\/\d+\)$/,
            ''
          );
          const nextDesc =
            item.recurrenceType === 'installment' &&
            item.installmentNumber &&
            item.totalInstallments
              ? `${baseName} (${item.installmentNumber}/${item.totalInstallments})`
              : baseName;

          return {
            ...item,
            description: nextDesc,
            amount: updatedFields.amount ?? item.amount,
            categoryId: updatedFields.categoryId ?? item.categoryId,
            subcategoryId: updatedFields.subcategoryId,
            paymentMethod: updatedFields.paymentMethod ?? item.paymentMethod,
            accountId: updatedFields.accountId,
            cardId: updatedFields.cardId,
            responsibility: updatedFields.responsibility ?? item.responsibility,
            paidBy: updatedFields.paidBy ?? item.paidBy,
            splitMode: updatedFields.splitMode ?? item.splitMode,
            mySharePercent: updatedFields.mySharePercent ?? item.mySharePercent,
            partnerSharePercent:
              updatedFields.partnerSharePercent ?? item.partnerSharePercent,
            myShareAmount: updatedFields.myShareAmount ?? item.myShareAmount,
            partnerShareAmount:
              updatedFields.partnerShareAmount ?? item.partnerShareAmount,
            tags: updatedFields.tags ?? item.tags,
          };
        }
      }

      return item;
    });

    persistWorkspace({
      ...workspace,
      transactions: nextTransactions,
    });
  };

  const handleConfirmDeleteTransaction = (
    targetTx: Transaction,
    scope: SeriesDeleteScope
  ) => {
    const nextTransactions = workspace.transactions.filter((item) => {
      if (scope === 'only_this' || !targetTx.seriesId) {
        return item.id !== targetTx.id;
      }

      if (item.seriesId !== targetTx.seriesId) {
        return true;
      }

      if (scope === 'all_including_paid') {
        return false; // Remove todas da série, inclusive as já pagas
      }

      if (scope === 'this_and_future') {
        if (item.id === targetTx.id) return false;
        if (
          targetTx.installmentNumber !== undefined &&
          item.installmentNumber !== undefined
        ) {
          return item.installmentNumber < targetTx.installmentNumber;
        }
        return item.dueDate < targetTx.dueDate;
      }

      return true;
    });

    persistWorkspace({
      ...workspace,
      transactions: nextTransactions,
    });
  };

  const handleToggleTxStatus = (tx: Transaction) => {
    const nextStatus = tx.status === 'paid' ? 'pending' : 'paid';
    const nextTransactions = workspace.transactions.map((item) =>
      item.id === tx.id
        ? {
            ...item,
            status: nextStatus as 'paid' | 'pending',
            paidDate: nextStatus === 'paid' ? format(new Date(), 'yyyy-MM-dd') : undefined,
          }
        : item
    );
    persistWorkspace({ ...workspace, transactions: nextTransactions });
  };

  // =========================================================================
  // CRUD HANDLERS: ACCOUNTS, CARDS, CATEGORIES, TAGS, BUDGETS, GOALS, MEMBERS
  // =========================================================================

  const handleSaveAccount = (account: BankAccount, isEdit: boolean) => {
    const next = isEdit
      ? workspace.accounts.map((a) => (a.id === account.id ? account : a))
      : [...workspace.accounts, account];
    persistWorkspace({ ...workspace, accounts: next });
  };

  const handleDeleteAccount = (accountId: string) => {
    persistWorkspace({
      ...workspace,
      accounts: workspace.accounts.filter((a) => a.id !== accountId),
      transactions: workspace.transactions.filter((t) => t.accountId !== accountId),
    });
  };

  const handleSaveCard = (card: CreditCard, isEdit: boolean) => {
    const next = isEdit
      ? workspace.cards.map((c) => (c.id === card.id ? card : c))
      : [...workspace.cards, card];
    persistWorkspace({ ...workspace, cards: next });
  };

  const handleDeleteCard = (cardId: string) => {
    persistWorkspace({
      ...workspace,
      cards: workspace.cards.filter((c) => c.id !== cardId),
      transactions: workspace.transactions.filter((t) => t.cardId !== cardId),
      invoicePayments: workspace.invoicePayments.filter((p) => p.cardId !== cardId),
    });
  };

  const handleSaveInvoicePayment = (payment: InvoicePayment, isEdit: boolean) => {
    const next = isEdit
      ? workspace.invoicePayments.map((p) => (p.id === payment.id ? payment : p))
      : [payment, ...workspace.invoicePayments];
    persistWorkspace({ ...workspace, invoicePayments: next });
  };

  const handleDeleteInvoicePayment = (paymentId: string) => {
    persistWorkspace({
      ...workspace,
      invoicePayments: workspace.invoicePayments.filter((p) => p.id !== paymentId),
    });
  };

  const handleSaveCategory = (cat: Category, isEdit: boolean) => {
    const next = isEdit
      ? workspace.categories.map((c) => (c.id === cat.id ? cat : c))
      : [...workspace.categories, cat];
    persistWorkspace({ ...workspace, categories: next });
  };

  const handleDeleteCategory = (catId: string, reassignToId?: string) => {
    const fallbackId =
      reassignToId ||
      workspace.categories.find((c) => !c.parentId && c.id !== catId)?.id ||
      'cat-moradia';

    const nextCategories = workspace.categories.filter(
      (c) => c.id !== catId && c.parentId !== catId
    );
    const nextTransactions = workspace.transactions.map((t) => {
      if (t.categoryId === catId) {
        return { ...t, categoryId: fallbackId, subcategoryId: undefined };
      }
      if (t.subcategoryId === catId) {
        return { ...t, subcategoryId: undefined };
      }
      return t;
    });
    persistWorkspace({
      ...workspace,
      categories: nextCategories,
      transactions: nextTransactions,
    });
  };

  const handleSaveTag = (tag: TagItem, isEdit: boolean) => {
    const next = isEdit
      ? workspace.tags.map((t) => (t.id === tag.id ? tag : t))
      : [...workspace.tags, tag];
    persistWorkspace({ ...workspace, tags: next });
  };

  const handleDeleteTag = (tagId: string) => {
    persistWorkspace({
      ...workspace,
      tags: workspace.tags.filter((t) => t.id !== tagId),
      transactions: workspace.transactions.map((tx) => ({
        ...tx,
        tags: tx.tags.filter((id) => id !== tagId),
      })),
    });
  };

  const handleSaveBudget = (budget: Budget, isEdit: boolean) => {
    const next = isEdit
      ? workspace.budgets.map((b) => (b.id === budget.id ? budget : b))
      : [...workspace.budgets, budget];
    persistWorkspace({ ...workspace, budgets: next });
  };

  const handleDeleteBudget = (budgetId: string) => {
    persistWorkspace({
      ...workspace,
      budgets: workspace.budgets.filter((b) => b.id !== budgetId),
    });
  };

  const handleSaveGoal = (goal: FinancialGoal, isEdit: boolean) => {
    const next = isEdit
      ? workspace.goals.map((g) => (g.id === goal.id ? goal : g))
      : [...workspace.goals, goal];
    persistWorkspace({ ...workspace, goals: next });
  };

  const handleDeleteGoal = (goalId: string) => {
    persistWorkspace({
      ...workspace,
      goals: workspace.goals.filter((g) => g.id !== goalId),
    });
  };

  const handleSaveMembers = (members: CoupleMember[]) => {
    persistWorkspace({ ...workspace, members });
  };

  if (!session) {
    return <AuthScreen onSuccess={handleLoginSuccess} />;
  }

  const meMember = workspace.members.find((m) => m.role === 'me') || {
    name: 'Você',
    avatarColor: '#0052FF',
  };
  const partnerMember = workspace.members.find((m) => m.role === 'partner') || {
    name: 'Namorada',
    avatarColor: '#FF2E93',
  };

  const navItems = [
    { id: 'dashboard', label: 'Painel Inicial', icon: LayoutDashboard },
    { id: 'transactions', label: 'Extrato & Lançamentos', icon: ListOrdered },
    { id: 'cards', label: 'Cartões & Faturas', icon: CardIcon },
    { id: 'accounts', label: 'Contas & Carteira', icon: Landmark },
    { id: 'budgets', label: 'Orçamentos Mensais', icon: Flame },
    { id: 'goals', label: 'Metas & Objetivos', icon: Target },
    { id: 'categories', label: 'Categorias & Tags', icon: Tags },
    { id: 'settings', label: 'Perfis do Casal', icon: Users },
  ];

  return (
    <div className="min-h-screen liquid-bg-canvas flex flex-col lg:flex-row relative">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 p-4 sticky top-0 h-screen">
        <div className="liquid-glass rounded-3xl p-5 flex flex-col justify-between h-full">
          <div className="space-y-6">
            {/* Logo DuoFin */}
            <div className="flex items-center gap-3 px-2">
              <img
                src="/icon.svg"
                alt="DuoFin Logo"
                className="w-10 h-10 rounded-2xl shadow-md shrink-0"
              />
              <div>
                <h1 className="text-lg font-extrabold text-white tracking-tight">
                  Duo<span className="text-[#2563EB]">Fin</span>
                </h1>
                <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
                  <Cloud size={11} className="text-[#10B981]" />
                  {meMember.name} & {partnerMember.name}
                </span>
              </div>
            </div>

            {/* Botão Lançamento Rápido */}
            <button
              type="button"
              onClick={() => handleOpenNewTx('expense')}
              className="w-full py-3 px-4 rounded-2xl btn-vivid-blue on-vivid text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus size={17} />
              Novo Lançamento
            </button>

            {/* Navegação */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                      active
                        ? 'bg-[#2563EB] on-vivid shadow-sm'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    <Icon
                      size={17}
                      className={active ? 'on-vivid' : 'text-slate-400'}
                    />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Rodapé Usuário Logado */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-xl on-vivid flex items-center justify-center font-extrabold text-xs shrink-0"
                style={{
                  backgroundColor:
                    session.role === 'partner'
                      ? partnerMember.avatarColor
                      : meMember.avatarColor,
                }}
              >
                {session.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{session.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{session.email}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Sair da conta"
              className="p-2 rounded-xl bg-white/5 hover:bg-[#F43F5E]/20 text-slate-300 hover:text-[#F43F5E] cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-8">
        {/* Topbar Liquid Glass: Seletor de Mês + Filtro Global do Casal + Chave Data Registro/Vencimento */}
        <header className="sticky top-0 z-30 p-3 sm:p-4">
          <div className="liquid-glass-elevated rounded-3xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            {/* Mobile Brand + Seletor de Mês */}
            <div className="flex items-center gap-3">
              <img
                src="/icon.svg"
                alt="DuoFin Logo"
                className="lg:hidden w-9 h-9 rounded-xl shadow-sm shrink-0"
              />

              <div className="flex items-center gap-1.5 liquid-glass-interactive rounded-2xl p-1">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedMonth(
                      format(subMonths(parseISO(`${selectedMonth}-01`), 1), 'yyyy-MM')
                    )
                  }
                  className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-slate-300 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 text-xs sm:text-sm font-extrabold text-white min-w-34 text-center">
                  {formatMonthLabel(selectedMonth)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedMonth(
                      format(addMonths(parseISO(`${selectedMonth}-01`), 1), 'yyyy-MM')
                    )
                  }
                  className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-slate-300 cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Filtro Global de Visão: Casal Consolidado / Minha Parte / Parte Dela */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center liquid-glass-interactive rounded-2xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setViewFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    viewFilter === 'all'
                      ? 'bg-[#2563EB] on-vivid shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Users size={13} />
                  Casal (Tudo)
                </button>
                <button
                  type="button"
                  onClick={() => setViewFilter('me')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    viewFilter === 'me'
                      ? 'bg-[#2563EB] on-vivid shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <User size={13} />
                  {meMember.name}
                </button>
                <button
                  type="button"
                  onClick={() => setViewFilter('partner')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    viewFilter === 'partner'
                      ? 'bg-[#EC4899] on-vivid shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <User size={13} />
                  {partnerMember.name}
                </button>
              </div>

              {/* Chave: Filtrar por Data de Vencimento vs Data de Registro */}
              <button
                type="button"
                onClick={() =>
                  setDateFilterMode((prev) =>
                    prev === 'dueDate' ? 'registrationDate' : 'dueDate'
                  )
                }
                title="Alternar visão mensal entre Data de Vencimento e Data de Registro"
                className="px-3 py-2 rounded-2xl liquid-glass-interactive text-xs font-bold text-[#2563EB] flex items-center gap-1.5 cursor-pointer"
              >
                <Calendar size={14} />
                <span className="hidden sm:inline">Visão por:</span>
                <span className="text-white">
                  {dateFilterMode === 'dueDate' ? 'Vencimento' : 'Data Registro'}
                </span>
              </button>

              {/* Toggle Modo Light / Dark no Topo */}
              <button
                type="button"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Ativar Modo Claro (Light)' : 'Ativar Modo Escuro (Dark)'}
                className="px-3 py-2 rounded-2xl liquid-glass-interactive text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun size={14} className="text-[#F59E0B]" />
                    <span className="hidden md:inline text-slate-200">Light</span>
                  </>
                ) : (
                  <>
                    <Moon size={14} className="text-[#2563EB]" />
                    <span className="hidden md:inline text-slate-200">Dark</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Área Dinâmica da Aba Selecionada */}
        <main className="px-3 sm:px-6 pt-2 flex-1">
          {activeTab === 'dashboard' && (
            <DashboardView
              workspace={workspace}
              selectedMonth={selectedMonth}
              viewFilter={viewFilter}
              dateFilterMode={dateFilterMode}
              onOpenNewTx={handleOpenNewTx}
              onEditTx={handleOpenEditTx}
              onDuplicateTx={handleOpenDuplicateTx}
              onDeleteTx={setTxToDelete}
              onToggleTxStatus={handleToggleTxStatus}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              workspace={workspace}
              selectedMonth={selectedMonth}
              viewFilter={viewFilter}
              dateFilterMode={dateFilterMode}
              onOpenNewTx={handleOpenNewTx}
              onEditTx={handleOpenEditTx}
              onDuplicateTx={handleOpenDuplicateTx}
              onDeleteTx={setTxToDelete}
              onToggleTxStatus={handleToggleTxStatus}
            />
          )}

          {activeTab === 'cards' && (
            <CreditCardsView
              workspace={workspace}
              selectedMonth={selectedMonth}
              onSaveCard={handleSaveCard}
              onDeleteCard={handleDeleteCard}
              onSaveInvoicePayment={handleSaveInvoicePayment}
              onDeleteInvoicePayment={handleDeleteInvoicePayment}
              onOpenNewCardExpense={() => handleOpenNewTx('expense')}
              onEditTx={handleOpenEditTx}
              onDuplicateTx={handleOpenDuplicateTx}
              onDeleteTx={setTxToDelete}
            />
          )}

          {activeTab === 'accounts' && (
            <AccountsView
              workspace={workspace}
              selectedMonth={selectedMonth}
              onSaveAccount={handleSaveAccount}
              onDeleteAccount={handleDeleteAccount}
              onOpenTransferModal={() => handleOpenNewTx('transfer')}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsView
              workspace={workspace}
              selectedMonth={selectedMonth}
              dateFilterMode={dateFilterMode}
              onSaveBudget={handleSaveBudget}
              onDeleteBudget={handleDeleteBudget}
              onEditTx={handleOpenEditTx}
            />
          )}

          {activeTab === 'goals' && (
            <GoalsView
              workspace={workspace}
              onSaveGoal={handleSaveGoal}
              onDeleteGoal={handleDeleteGoal}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesView
              workspace={workspace}
              onSaveCategory={handleSaveCategory}
              onDeleteCategory={handleDeleteCategory}
              onSaveTag={handleSaveTag}
              onDeleteTag={handleDeleteTag}
            />
          )}

          {activeTab === 'settings' && (
            <CoupleSettingsView
              workspace={workspace}
              cloudConnected={cloudConnected}
              onSaveMembers={handleSaveMembers}
              onResetDemoData={() => persistWorkspace(getInitialSeedData())}
              onForceSync={syncFromCloud}
            />
          )}
        </main>
      </div>

      {/* Barra de Navegação Inferior Mobile (Liquid Glass) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-2">
        <div className="liquid-glass-elevated rounded-3xl px-2 py-2 flex items-center justify-around border border-white/25">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-2xl text-[10px] font-bold cursor-pointer ${
              activeTab === 'dashboard' ? 'text-[#00D4FF]' : 'text-slate-400'
            }`}
          >
            <LayoutDashboard size={18} />
            Início
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-2xl text-[10px] font-bold cursor-pointer ${
              activeTab === 'transactions' ? 'text-[#00D4FF]' : 'text-slate-400'
            }`}
          >
            <ListOrdered size={18} />
            Extrato
          </button>

          {/* Botão Central Flutuante + */}
          <button
            type="button"
            onClick={() => handleOpenNewTx('expense')}
            className="w-12 h-12 -mt-6 rounded-2xl btn-vivid-blue flex items-center justify-center text-white shadow-xl cursor-pointer"
          >
            <Plus size={24} />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cards')}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-2xl text-[10px] font-bold cursor-pointer ${
              activeTab === 'cards' ? 'text-[#00D4FF]' : 'text-slate-400'
            }`}
          >
            <CardIcon size={18} />
            Cartões
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab(
                ['budgets', 'goals', 'categories', 'accounts', 'settings'].includes(activeTab)
                  ? 'dashboard'
                  : 'budgets'
              )
            }
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-2xl text-[10px] font-bold cursor-pointer ${
              ['budgets', 'goals', 'categories', 'accounts', 'settings'].includes(activeTab)
                ? 'text-[#00D4FF]'
                : 'text-slate-400'
            }`}
          >
            <Flame size={18} />
            Mais
          </button>
        </div>

        {/* Sub-menu mobile rápido para Orçamentos, Metas, Contas, Categorias e Casal */}
        {['budgets', 'goals', 'categories', 'accounts', 'settings'].includes(activeTab) && (
          <div className="mt-1.5 liquid-glass-elevated rounded-2xl p-1.5 flex items-center justify-around text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('budgets')}
              className={`px-2.5 py-1 rounded-xl ${
                activeTab === 'budgets' ? 'bg-[#0052FF] text-white' : 'text-slate-300'
              }`}
            >
              Orçamentos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('goals')}
              className={`px-2.5 py-1 rounded-xl ${
                activeTab === 'goals' ? 'bg-[#0052FF] text-white' : 'text-slate-300'
              }`}
            >
              Metas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('accounts')}
              className={`px-2.5 py-1 rounded-xl ${
                activeTab === 'accounts' ? 'bg-[#0052FF] text-white' : 'text-slate-300'
              }`}
            >
              Contas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className={`px-2.5 py-1 rounded-xl ${
                activeTab === 'categories' ? 'bg-[#0052FF] text-white' : 'text-slate-300'
              }`}
            >
              Categorias
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-2.5 py-1 rounded-xl ${
                activeTab === 'settings' ? 'bg-[#0052FF] text-white' : 'text-slate-300'
              }`}
            >
              Casal
            </button>
          </div>
        )}
      </nav>

      {/* Modal Principal de Criação / Edição / Duplicação de Lançamento */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTx(null);
          setDuplicatingTx(null);
        }}
        initialType={txModalInitialType}
        editingTransaction={editingTx}
        duplicatingTransaction={duplicatingTx}
        accounts={workspace.accounts}
        cards={workspace.cards}
        categories={workspace.categories}
        tags={workspace.tags}
        members={workspace.members}
        onSaveNew={handleSaveNewTransactions}
        onSaveEdit={handleSaveEditedTransaction}
      />

      {/* Modal de Exclusão de Lançamento (com as 3 opções de série/parcela) */}
      <DeleteTransactionModal
        isOpen={Boolean(txToDelete)}
        onClose={() => setTxToDelete(null)}
        transaction={txToDelete}
        onConfirmDelete={handleConfirmDeleteTransaction}
      />
    </div>
  );
}
export default App;
