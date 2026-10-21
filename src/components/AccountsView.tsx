import React, { useState } from 'react';
import {
  AccountType,
  BankAccount,
  OwnerScope,
  PersonRole,
  WorkspaceData,
} from '../types/finance';
import { calculateAccountBalance, formatCurrency } from '../lib/financeUtils';
import { DynamicIcon } from '../lib/icons';
import { LiquidModal } from './ui/LiquidModal';
import { LiquidSelect } from './ui/LiquidSelect';
import { CurrencyInput } from './ui/CurrencyInput';
import { IconAndColorPicker } from './ui/IconAndColorPicker';
import { Plus, Edit3, Trash2, ArrowLeftRight, SlidersHorizontal, Lock } from 'lucide-react';

interface AccountsViewProps {
  workspace: WorkspaceData;
  selectedMonth: string;
  sessionRole?: PersonRole;
  onSaveAccount: (account: BankAccount, isEdit: boolean) => void;
  onDeleteAccount: (accountId: string) => void;
  onOpenTransferModal: () => void;
}

export function AccountsView({
  workspace,
  selectedMonth,
  sessionRole = 'me',
  onSaveAccount,
  onDeleteAccount,
  onOpenTransferModal,
}: AccountsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [owner, setOwner] = useState<OwnerScope>('both');
  const [includeInTotal, setIncludeInTotal] = useState(true);
  const [icon, setIcon] = useState('Landmark');
  const [color, setColor] = useState('#2563EB');

  // Reajuste rápido de saldo
  const [adjustingAccount, setAdjustingAccount] = useState<{
    account: BankAccount;
    currentBalance: number;
  } | null>(null);
  const [desiredBalance, setDesiredBalance] = useState<number>(0);

  // Confirm delete
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);

  const openCreate = () => {
    setEditingAccount(null);
    setName('');
    setType('checking');
    setInitialBalance(0);
    setOwner('both');
    setIncludeInTotal(true);
    setIcon('Landmark');
    setColor('#2563EB');
    setIsModalOpen(true);
  };

  const openEdit = (acc: BankAccount) => {
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setInitialBalance(acc.initialBalance);
    setOwner(acc.owner);
    setIncludeInTotal(acc.includeInTotal);
    setIcon(acc.icon);
    setColor(acc.color);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const accObj: BankAccount = {
      id: editingAccount ? editingAccount.id : `acc-${Date.now()}`,
      name: name.trim() || 'Nova Conta',
      type,
      initialBalance,
      owner,
      includeInTotal,
      icon,
      color,
    };
    onSaveAccount(accObj, Boolean(editingAccount));
    setIsModalOpen(false);
  };

  const handleConfirmBalanceAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingAccount) return;
    const diff = desiredBalance - adjustingAccount.currentBalance;
    const updatedAcc: BankAccount = {
      ...adjustingAccount.account,
      initialBalance: Number((adjustingAccount.account.initialBalance + diff).toFixed(2)),
    };
    onSaveAccount(updatedAcc, true);
    setAdjustingAccount(null);
  };

  return (
    <div className="space-y-6">
      <div className="liquid-glass rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Contas Bancárias & Carteiras</h2>
          <p className="text-xs text-slate-300">
            Gerencie contas correntes, caixinhas, reservas e faça reajustes instantâneos de saldo
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenTransferModal}
            className="px-4 py-2.5 rounded-2xl liquid-glass-interactive text-xs font-bold text-[#60A5FA] hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeftRight size={15} />
            Transferir entre Contas
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2.5 rounded-2xl btn-vivid-blue text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            Nova Conta
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {workspace.accounts.map((acc) => {
          const bal = calculateAccountBalance(
            acc,
            workspace.transactions,
            workspace.invoicePayments,
            selectedMonth
          );

          return (
            <div
              key={acc.id}
              className="liquid-glass rounded-3xl p-6 flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{
                      backgroundColor: `${acc.color}22`,
                      color: acc.color,
                      border: `1px solid ${acc.color}60`,
                    }}
                  >
                    <DynamicIcon name={acc.icon} size={20} />
                  </span>
                  <div>
                    <div className="text-base font-extrabold text-white">{acc.name}</div>
                    <div className="text-xs text-slate-400">
                      {acc.type === 'checking'
                        ? 'Conta Corrente'
                        : acc.type === 'savings'
                        ? 'Poupança / Caixinha'
                        : acc.type === 'investment'
                        ? 'Investimentos'
                        : 'Dinheiro Físico'}{' '}
                      •{' '}
                      {acc.owner === 'me'
                        ? 'Sua Conta'
                        : acc.owner === 'partner'
                        ? 'Conta Dela'
                        : 'Conjunta Casal'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {acc.owner !== 'both' && acc.owner !== sessionRole ? (
                    <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[10px] font-semibold text-slate-400 flex items-center gap-1" title="Esta conta é privada do seu par e não pode ser editada por você">
                      <Lock size={12} className="text-[#EC4899]" />
                      Privada do par
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => openEdit(acc)}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white cursor-pointer"
                        title="Editar Conta"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountToDelete(acc)}
                        className="p-2 rounded-xl bg-white/10 hover:bg-[#F43F5E]/25 text-rose-300 hover:text-[#F43F5E] cursor-pointer"
                        title="Excluir Conta"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Saldo Atual Efetivado:</span>
                  <span
                    className={`text-xl font-extrabold ${
                      bal.currentBalance >= 0 ? 'text-[#10B981]' : 'text-[#F43F5E]'
                    }`}
                  >
                    {formatCurrency(bal.currentBalance)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
                  <span className="text-slate-400">Saldo Previsto no Mês:</span>
                  <span className="font-bold text-[#3B82F6]">
                    {formatCurrency(bal.projectedBalance)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Saldo inicial: {formatCurrency(acc.initialBalance)}
                </span>
                {acc.owner === 'both' || acc.owner === sessionRole ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustingAccount({ account: acc, currentBalance: bal.currentBalance });
                      setDesiredBalance(Math.max(0, Number(bal.currentBalance.toFixed(2))));
                    }}
                    className="px-3 py-1.5 rounded-xl liquid-glass-interactive text-xs font-bold text-[#60A5FA] hover:text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <SlidersHorizontal size={13} />
                    Reajustar Saldo
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Criar/Editar Conta */}
      <LiquidModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAccount ? 'Editar Conta Bancária' : 'Nova Conta / Carteira'}
        headerColor={color}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Nome da Conta
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Nubank, Itaú, Reserva Casal..."
                className="w-full liquid-input rounded-2xl px-4 py-2.5 text-sm text-white"
              />
            </div>

            <LiquidSelect
              label="Tipo de Conta"
              value={type}
              onChange={(v) => setType(v as AccountType)}
              options={[
                { value: 'checking', label: 'Conta Corrente / Digital', icon: 'Landmark', color: '#2563EB' },
                { value: 'savings', label: 'Poupança / Caixinha', icon: 'PiggyBank', color: '#10B981' },
                { value: 'investment', label: 'Corretora / Investimento', icon: 'TrendingUp', color: '#06B6D4' },
                { value: 'cash', label: 'Carteira Física (Espécie)', icon: 'Wallet', color: '#F59E0B' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CurrencyInput
              label="Saldo Inicial de Abertura (R$)"
              value={initialBalance}
              onChange={setInitialBalance}
            />

            <LiquidSelect
              label="Titular da Conta"
              value={owner}
              onChange={(v) => setOwner(v as OwnerScope)}
              options={[
                { value: 'both', label: 'Conjunta / Casal', icon: 'Users', color: '#2563EB' },
                { value: 'me', label: 'Pessoal (Você)', icon: 'User', color: '#3B82F6' },
                { value: 'partner', label: 'Pessoal (Namorada)', icon: 'User', color: '#EC4899' },
              ]}
            />
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={includeInTotal}
              onChange={(e) => setIncludeInTotal(e.target.checked)}
              className="rounded accent-[#2563EB]"
            />
            Somar esta conta no card de "Saldo Total" do Dashboard
          </label>

          <IconAndColorPicker
            selectedIcon={icon}
            onSelectIcon={setIcon}
            selectedColor={color}
            onSelectColor={setColor}
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-2xl liquid-glass-interactive text-xs font-bold text-slate-300 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl btn-vivid-blue text-xs font-bold text-white cursor-pointer"
            >
              Salvar Conta
            </button>
          </div>
        </form>
      </LiquidModal>

      {/* Modal Reajustar Saldo Atual */}
      <LiquidModal
        isOpen={Boolean(adjustingAccount)}
        onClose={() => setAdjustingAccount(null)}
        title={`Reajustar Saldo — ${adjustingAccount?.account.name}`}
        subtitle="Informe o valor exato que está no seu banco hoje para calibrar a conta"
        maxWidth="sm"
        headerColor="#2563EB"
      >
        <form onSubmit={handleConfirmBalanceAdjust} className="space-y-4">
          <CurrencyInput
            label="Novo Saldo Real Hoje (R$)"
            value={desiredBalance}
            onChange={setDesiredBalance}
            accentTextClass="text-[#10B981]"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAdjustingAccount(null)}
              className="px-4 py-2 rounded-xl liquid-glass-interactive text-xs font-bold text-slate-300 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl btn-vivid-blue text-xs font-bold text-white cursor-pointer"
            >
              Aplicar Novo Saldo
            </button>
          </div>
        </form>
      </LiquidModal>

      {/* Modal Confirmar Exclusão */}
      <LiquidModal
        isOpen={Boolean(accountToDelete)}
        onClose={() => setAccountToDelete(null)}
        title="Excluir Conta Bancária"
        maxWidth="sm"
        headerColor="#F43F5E"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Deseja realmente excluir a conta <strong>{accountToDelete?.name}</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAccountToDelete(null)}
              className="px-4 py-2 rounded-xl liquid-glass-interactive text-xs font-bold text-slate-300 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                if (accountToDelete) onDeleteAccount(accountToDelete.id);
                setAccountToDelete(null);
              }}
              className="px-4 py-2 rounded-xl btn-vivid-crimson text-xs font-bold cursor-pointer"
            >
              Confirmar Exclusão
            </button>
          </div>
        </div>
      </LiquidModal>
    </div>
  );
}
