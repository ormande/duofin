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
  MovementApproval,
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
import { formatCurrency, formatMonthLabel } from './lib/financeUtils';
import { AuthScreen } from './components/AuthScreen';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { CreditCardsView } from './components/CreditCardsView';
import { AccountsView } from './components/AccountsView';
import { CategoriesView } from './components/CategoriesView';
import { BudgetsView } from './components/BudgetsView';
import { GoalsView } from './components/GoalsView';
import { CoupleSettingsView } from './components/CoupleSettingsView';
import { ApprovalsView } from './components/ApprovalsView';
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
  Cloud,
  Sun,
  Moon,
  User,
  ShieldCheck,
  Lock,
  Sparkles,
  X,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
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

  // Mobile More bottom sheet
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

  // Floating Toast Notification
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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

  const handleLoginSuccess = (
    newSession: AppUserSession,
    registeredMember?: CoupleMember
  ) => {
    setSession(newSession);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));

    if (registeredMember) {
      const nextMembers = workspace.members.map((m) =>
        m.role === registeredMember.role
          ? { ...m, ...registeredMember, isRegistered: true }
          : m
      );
      persistWorkspace({
        ...workspace,
        members: nextMembers,
      });
    } else {
      // Auto-stamp user registration if logging in
      const roleToStamp = newSession.role;
      const mem = workspace.members.find((m) => m.role === roleToStamp);
      if (mem && !mem.isRegistered) {
        const nextMembers = workspace.members.map((m) =>
          m.role === roleToStamp
            ? {
                ...m,
                isRegistered: true,
                name: newSession.name || m.name,
                email: newSession.email || m.email,
              }
            : m
        );
        persistWorkspace({
          ...workspace,
          members: nextMembers,
        });
      }
    }
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

  const meMember = workspace.members.find((m) => m.role === 'me') || {
    id: 'member-me',
    name: 'Membro 1',
    role: 'me' as const,
    avatarColor: '#2563EB',
    email: '',
    isRegistered: false,
  };
  const partnerMember = workspace.members.find((m) => m.role === 'partner') || {
    id: 'member-partner',
    name: 'Membro 2',
    role: 'partner' as const,
    avatarColor: '#EC4899',
    email: '',
    isRegistered: false,
  };

  const isMeRegistered = Boolean(meMember.isRegistered);
  const isPartnerRegistered = Boolean(partnerMember.isRegistered);

  // Helper: Checa se uma transação é do casal / compartilhada
  const isCoupleMovement = (tx: Partial<Transaction>) => {
    if (tx.responsibility === 'split') return true;
    if (tx.accountId) {
      const acc = workspace.accounts.find((a) => a.id === tx.accountId);
      if (acc && acc.owner === 'both') return true;
    }
    if (tx.cardId) {
      const card = workspace.cards.find((c) => c.id === tx.cardId);
      if (card && card.owner === 'both') return true;
    }
    return false;
  };

  // =========================================================================
  // CRUD HANDLERS: TRANSACTIONS COM SISTEMA DE APROVAÇÕES
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

  const handleOpenDuplicateTx = (tx: Transaction) => {
    setEditingTx(null);
    setDuplicatingTx(tx);
    setIsTxModalOpen(true);
  };

  const handleSaveNewTransactions = (newItems: Transaction[]) => {
    if (!session) return;
    const isShared = newItems.some(isCoupleMovement);

    // Se for movimentação do casal e ambos estiverem cadastrados, envia para aprovação
    if (isShared && isMeRegistered && isPartnerRegistered) {
      const otherRole = session.role === 'me' ? 'partner' : 'me';
      const otherName = otherRole === 'me' ? meMember.name : partnerMember.name;

      const newApproval: MovementApproval = {
        id: `appr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        action: 'create',
        targetType: 'transaction',
        requestedBy: session.role,
        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm'),
        status: 'pending',
        description: `${
          newItems[0].type === 'expense' ? 'Despesa' : 'Receita'
        } do Casal: ${newItems[0].description} (${formatCurrency(newItems[0].amount)})`,
        amount: newItems[0].amount,
        payload: newItems,
      };

      persistWorkspace({
        ...workspace,
        approvals: [newApproval, ...(workspace.approvals || [])],
      });

      setToast({
        message: `🔔 Movimentação enviada para aprovação de ${otherName} na aba 'Aprovações'!`,
        type: 'info',
      });
      return;
    }

    // Se for individual ou se o parceiro ainda não se cadastrou, salva diretamente
    persistWorkspace({
      ...workspace,
      transactions: [...newItems, ...workspace.transactions],
    });
    setToast({
      message: 'Lançamento salvo com sucesso!',
      type: 'success',
    });
  };

  const handleSaveEditedTransaction = (
    originalTx: Transaction,
    updatedFields: Partial<Transaction>,
    scope: SeriesEditScope
  ) => {
    if (!session) return;
    const isShared = isCoupleMovement(originalTx) || isCoupleMovement(updatedFields);

    if (isShared && isMeRegistered && isPartnerRegistered) {
      const otherRole = session.role === 'me' ? 'partner' : 'me';
      const otherName = otherRole === 'me' ? meMember.name : partnerMember.name;

      const newApproval: MovementApproval = {
        id: `appr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        action: 'edit',
        targetType: 'transaction',
        requestedBy: session.role,
        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm'),
        status: 'pending',
        description: `Edição em conta do casal: ${originalTx.description} (${formatCurrency(
          updatedFields.amount ?? originalTx.amount
        )})`,
        amount: updatedFields.amount ?? originalTx.amount,
        payload: { originalTx, updatedFields, scope },
        originalPayload: originalTx,
      };

      persistWorkspace({
        ...workspace,
        approvals: [newApproval, ...(workspace.approvals || [])],
      });

      setToast({
        message: `🔔 Alteração compartilhada enviada para aprovação de ${otherName}!`,
        type: 'info',
      });
      return;
    }

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

        const isFutureByDate = item.dueDate > originalTx.dueDate;

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
    setToast({ message: 'Lançamento atualizado com sucesso!', type: 'success' });
  };

  const handleConfirmDeleteTransaction = (
    targetTx: Transaction,
    scope: SeriesDeleteScope
  ) => {
    if (!session) return;
    const isShared = isCoupleMovement(targetTx);

    if (isShared && isMeRegistered && isPartnerRegistered) {
      const otherRole = session.role === 'me' ? 'partner' : 'me';
      const otherName = otherRole === 'me' ? meMember.name : partnerMember.name;

      const newApproval: MovementApproval = {
        id: `appr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        action: 'delete',
        targetType: 'transaction',
        requestedBy: session.role,
        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm'),
        status: 'pending',
        description: `Exclusão de conta do casal: ${targetTx.description} (${formatCurrency(
          targetTx.amount
        )})`,
        amount: targetTx.amount,
        payload: { targetTx, scope },
        originalPayload: targetTx,
      };

      persistWorkspace({
        ...workspace,
        approvals: [newApproval, ...(workspace.approvals || [])],
      });

      setToast({
        message: `🔔 Pedido de exclusão enviado para aprovação de ${otherName}!`,
        type: 'info',
      });
      return;
    }

    const nextTransactions = workspace.transactions.filter((item) => {
      if (scope === 'only_this' || !targetTx.seriesId) {
        return item.id !== targetTx.id;
      }

      if (item.seriesId !== targetTx.seriesId) {
        return true;
      }

      if (scope === 'all_including_paid') {
        return false;
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
    setToast({ message: 'Lançamento excluído!', type: 'success' });
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
  // APPROVAL ACTIONS (Aprovar / Recusar / Cancelar)
  // =========================================================================

  const handleApproveMovement = (approval: MovementApproval) => {
    if (!session) return;
    let nextTransactions = [...workspace.transactions];
    let nextAccounts = [...workspace.accounts];

    if (approval.targetType === 'transaction') {
      if (approval.action === 'create') {
        const payloadList = Array.isArray(approval.payload)
          ? approval.payload
          : [approval.payload];
        nextTransactions = [...payloadList, ...nextTransactions];
      } else if (approval.action === 'edit') {
        const { originalTx, updatedFields, scope } = approval.payload;
        nextTransactions = nextTransactions.map((item) => {
          if (item.id === originalTx.id) {
            return { ...item, ...updatedFields };
          }
          return item;
        });
      } else if (approval.action === 'delete') {
        const { targetTx } = approval.payload;
        nextTransactions = nextTransactions.filter((item) => item.id !== targetTx.id);
      }
    } else if (approval.targetType === 'account') {
      if (approval.action === 'create') {
        nextAccounts = [...nextAccounts, approval.payload];
      } else if (approval.action === 'edit') {
        nextAccounts = nextAccounts.map((a) =>
          a.id === approval.payload.id ? approval.payload : a
        );
      } else if (approval.action === 'delete') {
        nextAccounts = nextAccounts.filter((a) => a.id !== approval.payload.id);
      }
    }

    const updatedApprovals = (workspace.approvals || []).map((a) =>
      a.id === approval.id
        ? {
            ...a,
            status: 'approved' as const,
            reviewedAt: format(new Date(), 'yyyy-MM-dd HH:mm'),
            reviewedBy: session.role,
          }
        : a
    );

    persistWorkspace({
      ...workspace,
      transactions: nextTransactions,
      accounts: nextAccounts,
      approvals: updatedApprovals,
    });

    setToast({
      message: '✅ Movimentação aprovada e lançada no sistema!',
      type: 'success',
    });
  };

  const handleRejectMovement = (approval: MovementApproval) => {
    if (!session) return;
    const updatedApprovals = (workspace.approvals || []).map((a) =>
      a.id === approval.id
        ? {
            ...a,
            status: 'rejected' as const,
            reviewedAt: format(new Date(), 'yyyy-MM-dd HH:mm'),
            reviewedBy: session.role,
          }
        : a
    );

    persistWorkspace({
      ...workspace,
      approvals: updatedApprovals,
    });

    setToast({
      message: '❌ Solicitação de movimentação recusada.',
      type: 'warning',
    });
  };

  const handleCancelMovement = (approvalId: string) => {
    const updatedApprovals = (workspace.approvals || []).filter(
      (a) => a.id !== approvalId
    );
    persistWorkspace({
      ...workspace,
      approvals: updatedApprovals,
    });
    setToast({
      message: 'Solicitação cancelada.',
      type: 'info',
    });
  };

  // =========================================================================
  // CRUD HANDLERS: ACCOUNTS, CARDS, CATEGORIES, TAGS, BUDGETS, GOALS, MEMBERS
  // =========================================================================

  const handleSaveAccount = (account: BankAccount, isEdit: boolean) => {
    if (account.owner === 'both' && isMeRegistered && isPartnerRegistered && session) {
      const otherRole = session.role === 'me' ? 'partner' : 'me';
      const otherName = otherRole === 'me' ? meMember.name : partnerMember.name;

      const newApproval: MovementApproval = {
        id: `appr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        action: isEdit ? 'edit' : 'create',
        targetType: 'account',
        requestedBy: session.role,
        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm'),
        status: 'pending',
        description: `${isEdit ? 'Edição' : 'Criação'} de Conta Conjunta: ${
          account.name
        }`,
        payload: account,
      };

      persistWorkspace({
        ...workspace,
        approvals: [newApproval, ...(workspace.approvals || [])],
      });

      setToast({
        message: `🔔 Alteração na conta conjunta enviada para aprovação de ${otherName}!`,
        type: 'info',
      });
      return;
    }

    const next = isEdit
      ? workspace.accounts.map((a) => (a.id === account.id ? account : a))
      : [...workspace.accounts, account];
    persistWorkspace({ ...workspace, accounts: next });
    setToast({ message: 'Conta salva!', type: 'success' });
  };

  const handleDeleteAccount = (accountId: string) => {
    const acc = workspace.accounts.find((a) => a.id === accountId);
    if (
      acc &&
      acc.owner === 'both' &&
      isMeRegistered &&
      isPartnerRegistered &&
      session
    ) {
      const otherRole = session.role === 'me' ? 'partner' : 'me';
      const otherName = otherRole === 'me' ? meMember.name : partnerMember.name;

      const newApproval: MovementApproval = {
        id: `appr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        action: 'delete',
        targetType: 'account',
        requestedBy: session.role,
        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm'),
        status: 'pending',
        description: `Exclusão da Conta Conjunta: ${acc.name}`,
        payload: acc,
      };

      persistWorkspace({
        ...workspace,
        approvals: [newApproval, ...(workspace.approvals || [])],
      });

      setToast({
        message: `🔔 Pedido de exclusão de conta conjunta enviado para aprovação de ${otherName}!`,
        type: 'info',
      });
      return;
    }

    persistWorkspace({
      ...workspace,
      accounts: workspace.accounts.filter((a) => a.id !== accountId),
      transactions: workspace.transactions.filter((t) => t.accountId !== accountId),
    });
    setToast({ message: 'Conta excluída!', type: 'success' });
  };

  const handleSaveCard = (card: CreditCard, isEdit: boolean) => {
    const next = isEdit
      ? workspace.cards.map((c) => (c.id === card.id ? card : c))
      : [...workspace.cards, card];
    persistWorkspace({ ...workspace, cards: next });
    setToast({ message: 'Cartão salvo!', type: 'success' });
  };

  const handleDeleteCard = (cardId: string) => {
    persistWorkspace({
      ...workspace,
      cards: workspace.cards.filter((c) => c.id !== cardId),
      transactions: workspace.transactions.filter((t) => t.cardId !== cardId),
      invoicePayments: workspace.invoicePayments.filter((p) => p.cardId !== cardId),
    });
    setToast({ message: 'Cartão excluído!', type: 'success' });
  };

  const handleSaveInvoicePayment = (payment: InvoicePayment, isEdit: boolean) => {
    const next = isEdit
      ? workspace.invoicePayments.map((p) => (p.id === payment.id ? payment : p))
      : [payment, ...workspace.invoicePayments];
    persistWorkspace({ ...workspace, invoicePayments: next });
    setToast({ message: 'Pagamento de fatura registrado!', type: 'success' });
  };

  const handleDeleteInvoicePayment = (paymentId: string) => {
    persistWorkspace({
      ...workspace,
      invoicePayments: workspace.invoicePayments.filter((p) => p.id !== paymentId),
    });
    setToast({ message: 'Pagamento de fatura removido!', type: 'success' });
  };

  const handleSaveCategory = (cat: Category, isEdit: boolean) => {
    const next = isEdit
      ? workspace.categories.map((c) => (c.id === cat.id ? cat : c))
      : [...workspace.categories, cat];
    persistWorkspace({ ...workspace, categories: next });
    setToast({ message: 'Categoria salva!', type: 'success' });
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
    setToast({ message: 'Categoria removida!', type: 'success' });
  };

  const handleSaveTag = (tag: TagItem, isEdit: boolean) => {
    const next = isEdit
      ? workspace.tags.map((t) => (t.id === tag.id ? tag : t))
      : [...workspace.tags, tag];
    persistWorkspace({ ...workspace, tags: next });
    setToast({ message: 'Tag salva!', type: 'success' });
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
    setToast({ message: 'Tag removida!', type: 'success' });
  };

  const handleSaveBudget = (budget: Budget, isEdit: boolean) => {
    const next = isEdit
      ? workspace.budgets.map((b) => (b.id === budget.id ? budget : b))
      : [...workspace.budgets, budget];
    persistWorkspace({ ...workspace, budgets: next });
    setToast({ message: 'Orçamento salvo!', type: 'success' });
  };

  const handleDeleteBudget = (budgetId: string) => {
    persistWorkspace({
      ...workspace,
      budgets: workspace.budgets.filter((b) => b.id !== budgetId),
    });
    setToast({ message: 'Orçamento removido!', type: 'success' });
  };

  const handleSaveGoal = (goal: FinancialGoal, isEdit: boolean) => {
    const next = isEdit
      ? workspace.goals.map((g) => (g.id === goal.id ? goal : g))
      : [...workspace.goals, goal];
    persistWorkspace({ ...workspace, goals: next });
    setToast({ message: 'Meta salva!', type: 'success' });
  };

  const handleDeleteGoal = (goalId: string) => {
    persistWorkspace({
      ...workspace,
      goals: workspace.goals.filter((g) => g.id !== goalId),
    });
    setToast({ message: 'Meta removida!', type: 'success' });
  };

  const handleSaveMembers = (members: CoupleMember[]) => {
    persistWorkspace({ ...workspace, members });
    setToast({ message: 'Perfis do casal atualizados!', type: 'success' });
  };

  const handleResetToClean = () => {
    if (
      window.confirm(
        'Tem certeza que deseja ZERAR todo o banco de dados? Todas as contas, movimentações, cartões, metas e orçamentos serão limpos para você começar do zero.'
      )
    ) {
      const cleanSeed = getInitialSeedData();
      cleanSeed.members = workspace.members;
      persistWorkspace(cleanSeed);
      setToast({
        message: '🧹 Banco de dados zerado com sucesso! Comece do zero.',
        type: 'success',
      });
    }
  };

  if (!session) {
    return <AuthScreen members={workspace.members} onSuccess={handleLoginSuccess} />;
  }

  // Quantidade de aprovações pendentes para o usuário logado
  const pendingApprovalsCount = (workspace.approvals || []).filter(
    (a) => a.status === 'pending'
  ).length;

  // Se o usuário logado estiver tentando ver o espaço individual do parceiro que ainda não se cadastrou
  const isViewingLockedPartner =
    (session.role === 'me' && viewFilter === 'partner' && !isPartnerRegistered) ||
    (session.role === 'partner' && viewFilter === 'me' && !isMeRegistered);

  const navItems = [
    { id: 'dashboard', label: 'Painel Inicial', icon: LayoutDashboard },
    { id: 'transactions', label: 'Extrato & Lançamentos', icon: ListOrdered },
    { id: 'cards', label: 'Cartões & Faturas', icon: CardIcon },
    { id: 'accounts', label: 'Contas & Carteira', icon: Landmark },
    {
      id: 'approvals',
      label: 'Aprovações',
      icon: ShieldCheck,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { id: 'budgets', label: 'Orçamentos Mensais', icon: Flame },
    { id: 'goals', label: 'Metas & Objetivos', icon: Target },
    { id: 'categories', label: 'Categorias & Tags', icon: Tags },
    { id: 'settings', label: 'Perfis do Casal', icon: Users },
  ];

  const moreMenuItems = [
    {
      id: 'accounts',
      label: 'Contas & Carteira',
      description: 'Gerenciar saldos e instituições financeiras',
      icon: Landmark,
    },
    {
      id: 'approvals',
      label: 'Aprovações do Casal',
      description: 'Autorizar despesas e contas conjuntas',
      icon: ShieldCheck,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    {
      id: 'budgets',
      label: 'Orçamentos Mensais',
      description: 'Tetos e limites mensais de gastos',
      icon: Flame,
    },
    {
      id: 'goals',
      label: 'Metas & Objetivos',
      description: 'Sonhos e metas financeiras do casal',
      icon: Target,
    },
    {
      id: 'categories',
      label: 'Categorias & Tags',
      description: 'Personalizar classificação de despesas',
      icon: Tags,
    },
    {
      id: 'settings',
      label: 'Perfis do Casal',
      description: 'Configurações de membros e nuvem Supabase',
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen liquid-bg-canvas flex flex-col lg:flex-row relative">
      {/* Toast Notification Flutuante */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-[#10B981]/90 text-white border-[#10B981]'
                : toast.type === 'warning'
                ? 'bg-[#F43F5E]/90 text-white border-[#F43F5E]'
                : 'bg-[#2563EB]/90 text-white border-[#3B82F6]'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-2 hover:opacity-75 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

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
              className="w-full py-3 px-4 rounded-2xl btn-vivid-blue on-vivid text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-md"
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
                    className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      active
                        ? 'bg-[#2563EB] on-vivid shadow-sm'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        size={17}
                        className={active ? 'on-vivid' : 'text-slate-400'}
                      />
                      {item.label}
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F43F5E] text-white">
                        {item.badge}
                      </span>
                    )}
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
        {/* Topbar: RELATIVA no mobile para não ocupar espaço na tela, e STICKY apenas no Desktop */}
        <header className="relative lg:sticky lg:top-0 z-30 p-3 sm:p-4">
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

            {/* Filtro Global de Visão: Casal Consolidado / Minha Parte / Parte do Par */}
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
                  {!isPartnerRegistered && session.role === 'me' && (
                    <Lock size={11} className="text-amber-400" />
                  )}
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
                className="px-3 py-2 rounded-2xl liquid-glass-interactive text-xs font-bold text-[#2563EB] dark:text-[#60A5FA] flex items-center gap-1.5 cursor-pointer"
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
                title={
                  theme === 'dark'
                    ? 'Ativar Modo Claro (Light)'
                    : 'Ativar Modo Escuro (Dark)'
                }
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
          {isViewingLockedPartner ? (
            <div className="liquid-glass rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto my-8 space-y-4 border border-white/15">
              <div className="w-16 h-16 rounded-3xl bg-[#EC4899]/20 border border-[#EC4899]/40 flex items-center justify-center mx-auto text-[#EC4899] shadow-lg">
                <Lock size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-white">
                Espaço Individual Bloqueado
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                O espaço individual de{' '}
                <strong>
                  {session.role === 'me' ? partnerMember.name : meMember.name}
                </strong>{' '}
                está aguardando o cadastro dela(e) no sistema.
              </p>
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 text-xs text-slate-400 text-left space-y-1.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#10B981]" /> Como funciona?
                </div>
                <div>
                  Cada um possui seu próprio login e senha. Enquanto seu par não criar a
                  conta dele(a), esta área individual permanece bloqueada para manter a
                  privacidade e a autonomia de ambos.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewFilter('all')}
                className="px-6 py-2.5 rounded-2xl btn-vivid-blue on-vivid text-xs font-bold cursor-pointer"
              >
                Voltar para Visão do Casal
              </button>
            </div>
          ) : (
            <>
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
                  sessionRole={session.role}
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
                  sessionRole={session.role}
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
                  sessionRole={session.role}
                  onSaveAccount={handleSaveAccount}
                  onDeleteAccount={handleDeleteAccount}
                  onOpenTransferModal={() => handleOpenNewTx('transfer')}
                />
              )}

              {activeTab === 'approvals' && (
                <ApprovalsView
                  workspace={workspace}
                  sessionRole={session.role}
                  onApprove={handleApproveMovement}
                  onReject={handleRejectMovement}
                  onCancelRequest={handleCancelMovement}
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
                  onResetDemoData={handleResetToClean}
                  onForceSync={syncFromCloud}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Barra de Navegação Inferior Mobile (Liquid Glass) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-2">
        <div className="liquid-glass-elevated rounded-3xl px-3 py-2 flex items-center justify-around border border-white/25">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl text-[10px] font-bold cursor-pointer ${
              activeTab === 'dashboard' ? 'text-[#2563EB] dark:text-[#60A5FA]' : 'text-slate-400'
            }`}
          >
            <LayoutDashboard size={18} />
            Início
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl text-[10px] font-bold cursor-pointer ${
              activeTab === 'transactions' ? 'text-[#2563EB] dark:text-[#60A5FA]' : 'text-slate-400'
            }`}
          >
            <ListOrdered size={18} />
            Extrato
          </button>

          {/* Botão Central Flutuante + */}
          <button
            type="button"
            onClick={() => handleOpenNewTx('expense')}
            className="w-12 h-12 -mt-6 rounded-2xl btn-vivid-blue on-vivid flex items-center justify-center text-white shadow-xl cursor-pointer"
          >
            <Plus size={24} />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cards')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl text-[10px] font-bold cursor-pointer ${
              activeTab === 'cards' ? 'text-[#2563EB] dark:text-[#60A5FA]' : 'text-slate-400'
            }`}
          >
            <CardIcon size={18} />
            Cartões
          </button>

          {/* Botão Mais que abre a lista suspensa modal */}
          <button
            type="button"
            onClick={() => setIsMobileMoreOpen(true)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl text-[10px] font-bold cursor-pointer relative ${
              [
                'accounts',
                'approvals',
                'budgets',
                'goals',
                'categories',
                'settings',
              ].includes(activeTab)
                ? 'text-[#2563EB] dark:text-[#60A5FA]'
                : 'text-slate-400'
            }`}
          >
            <MoreHorizontal size={18} />
            Mais
            {pendingApprovalsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#F43F5E] absolute top-1 right-2" />
            )}
          </button>
        </div>
      </nav>

      {/* Modal / Bottom Sheet Mobile para "Mais Opções" */}
      {isMobileMoreOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full sm:max-w-md liquid-glass-elevated rounded-t-3xl sm:rounded-3xl p-5 border border-white/20 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <MoreHorizontal size={18} className="text-[#2563EB]" />
                Mais Opções
              </h3>
              <button
                type="button"
                onClick={() => setIsMobileMoreOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {moreMenuItems.map((item) => {
                const Icon = item.icon;
                const isCurrent = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMoreOpen(false);
                    }}
                    className={`flex items-center justify-between p-3.5 rounded-2xl transition cursor-pointer text-left ${
                      isCurrent
                        ? 'bg-[#2563EB]/25 border border-[#2563EB]/50'
                        : 'hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#2563EB]/15 border border-[#2563EB]/30 flex items-center justify-center text-[#2563EB] shrink-0">
                        <Icon size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          {item.label}
                          {item.badge && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F43F5E] text-white">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">{item.description}</div>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-500 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
