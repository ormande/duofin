export type PersonRole = 'me' | 'partner';
export type OwnerScope = 'me' | 'partner' | 'both';
export type GlobalViewFilter = 'all' | 'me' | 'partner';

export interface CoupleMember {
  id: string;
  name: string;
  role: PersonRole;
  avatarColor: string;
  email: string;
  isRegistered?: boolean; // Se o membro já fez o cadastro individual dele
}

export type AccountType = 'checking' | 'savings' | 'cash' | 'investment';

export interface BankAccount {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  color: string;
  icon: string;
  owner: OwnerScope;
  includeInTotal: boolean;
}

export interface CreditCard {
  id: string;
  name: string;
  brand: 'Visa' | 'Mastercard' | 'Elo' | 'Amex' | 'Outro';
  totalLimit: number;
  closingDay: number; // 1-31
  dueDay: number;     // 1-31
  defaultAccountId: string;
  color: string;
  icon: string;
  owner: OwnerScope;
}

export interface InvoicePayment {
  id: string;
  cardId: string;
  invoiceMonth: string; // 'YYYY-MM'
  amount: number;
  paidDate: string;     // 'YYYY-MM-DD'
  accountId: string;
  paidBy: PersonRole;
  notes?: string;
}

export type TransactionType = 'expense' | 'income' | 'transfer';
export type TransactionStatus = 'paid' | 'pending';
export type PaymentMethod = 'account' | 'credit_card';
export type ResponsibilityType = 'me' | 'partner' | 'split';
export type SplitMode = 'percentage' | 'manual';
export type RecurrenceType = 'single' | 'installment' | 'fixed';

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  parentId?: string | null; // Subcategory points to parent Category id
}

export interface TagItem {
  id: string;
  name: string;
  color: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  registrationDate: string; // YYYY-MM-DD (Data do registro / competência)
  dueDate: string;          // YYYY-MM-DD (Data do vencimento / caixa)
  paidDate?: string;        // YYYY-MM-DD
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  accountId?: string;
  destinationAccountId?: string; // For transfers
  cardId?: string;
  invoiceMonth?: string;         // YYYY-MM (Fatura do cartão onde cai a compra)
  categoryId: string;
  subcategoryId?: string;
  tags: string[];                // Array of Tag IDs
  // Couple & Split logic
  responsibility: ResponsibilityType; // 'me' | 'partner' | 'split'
  paidBy: PersonRole;                 // Who actually paid/will pay the bill
  splitMode: SplitMode;               // 'percentage' | 'manual'
  mySharePercent: number;             // 0 - 100
  partnerSharePercent: number;        // 0 - 100
  myShareAmount: number;
  partnerShareAmount: number;
  // Recurrence / Installment logic
  recurrenceType: RecurrenceType;     // 'single' | 'installment' | 'fixed'
  seriesId?: string;                  // Shared ID for installments or fixed bills
  installmentNumber?: number;         // e.g. 1
  totalInstallments?: number;         // e.g. 10
  notes?: string;
  isRefund?: boolean;                 // Estorno no cartão
}

export type BudgetScopeType = 'category' | 'tag' | 'card';

export interface Budget {
  id: string;
  name: string;
  scopeType: BudgetScopeType;
  targetId: string; // CategoryId, TagId, or CardId
  monthlyLimit: number;
  ownerFilter: GlobalViewFilter; // 'all' | 'me' | 'partner'
  alertPercent: number; // default 80
  color: string;
  icon: string;
}

export interface GoalContribution {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number; // Positive for deposit, negative for withdrawal
  member: PersonRole;
  accountId?: string;
  notes?: string;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  initialAmount: number;
  deadline: string; // YYYY-MM-DD
  linkedAccountId?: string;
  icon: string;
  color: string;
  owner: OwnerScope;
  contributions: GoalContribution[];
}

export type MovementApprovalAction = 'create' | 'edit' | 'delete';
export type MovementApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface MovementApproval {
  id: string;
  action: MovementApprovalAction;
  targetType: 'transaction' | 'account' | 'card' | 'budget';
  requestedBy: PersonRole; // Quem solicitou a alteração
  createdAt: string;       // YYYY-MM-DD HH:mm
  status: MovementApprovalStatus;
  description: string;
  amount?: number;
  payload: any;            // Os dados a serem criados, alterados ou removidos
  originalPayload?: any;   // Dados antes da alteração (se for edit ou delete)
  reviewedAt?: string;
  reviewedBy?: PersonRole;
}

export interface WorkspaceData {
  members: CoupleMember[];
  accounts: BankAccount[];
  cards: CreditCard[];
  invoicePayments: InvoicePayment[];
  categories: Category[];
  tags: TagItem[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: FinancialGoal[];
  approvals: MovementApproval[];
  updatedAt: string;
}

export type SeriesEditScope = 'only_this' | 'this_and_future';
export type SeriesDeleteScope = 'only_this' | 'this_and_future' | 'all_including_paid';
