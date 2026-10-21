import React, { useState } from 'react';
import {
  Budget,
  BudgetScopeType,
  GlobalViewFilter,
  Transaction,
  WorkspaceData,
} from '../types/finance';
import {
  formatCurrency,
  formatDateBR,
  getEffectiveTransactionAmount,
} from '../lib/financeUtils';
import { DynamicIcon } from '../lib/icons';
import { LiquidModal } from './ui/LiquidModal';
import { LiquidSelect } from './ui/LiquidSelect';
import { CurrencyInput } from './ui/CurrencyInput';
import { IconAndColorPicker } from './ui/IconAndColorPicker';
import { Plus, Edit3, Trash2, Flame, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface BudgetsViewProps {
  workspace: WorkspaceData;
  selectedMonth: string;
  dateFilterMode: 'dueDate' | 'registrationDate';
  onSaveBudget: (bgt: Budget, isEdit: boolean) => void;
  onDeleteBudget: (budgetId: string) => void;
  onEditTx: (tx: Transaction) => void;
}

export function BudgetsView({
  workspace,
  selectedMonth,
  dateFilterMode,
  onSaveBudget,
  onDeleteBudget,
  onEditTx,
}: BudgetsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [name, setName] = useState('');
  const [scopeType, setScopeType] = useState<BudgetScopeType>('category');
  const [targetId, setTargetId] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState<number>(1000);
  const [ownerFilter, setOwnerFilter] = useState<GlobalViewFilter>('all');
  const [alertPercent, setAlertPercent] = useState(80);
  const [icon, setIcon] = useState('Utensils');
  const [color, setColor] = useState('#F97316');

  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null);

  const openCreate = () => {
    const firstCat = workspace.categories.find((c) => c.type === 'expense');
    setEditingBudget(null);
    setName('');
    setScopeType('category');
    setTargetId(firstCat?.id || '');
    setMonthlyLimit(1000);
    setOwnerFilter('all');
    setAlertPercent(80);
    setIcon(firstCat?.icon || 'Utensils');
    setColor(firstCat?.color || '#F97316');
    setIsModalOpen(true);
  };

  const openEdit = (bgt: Budget) => {
    setEditingBudget(bgt);
    setName(bgt.name);
    setScopeType(bgt.scopeType);
    setTargetId(bgt.targetId);
    setMonthlyLimit(bgt.monthlyLimit);
    setOwnerFilter(bgt.ownerFilter);
    setAlertPercent(bgt.alertPercent);
    setIcon(bgt.icon);
    setColor(bgt.color);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (monthlyLimit <= 0) return;
    const obj: Budget = {
      id: editingBudget ? editingBudget.id : `bgt-${Date.now()}`,
      name: name.trim() || 'Orçamento Mensal',
      scopeType,
      targetId,
      monthlyLimit,
      ownerFilter,
      alertPercent,
      icon,
      color,
    };
    onSaveBudget(obj, Boolean(editingBudget));
    setIsModalOpen(false);
  };

  const targetOptions =
    scopeType === 'category'
      ? workspace.categories
          .filter((c) => c.type === 'expense')
          .map((c) => ({
            value: c.id,
            label: c.parentId ? `Subcategoria: ${c.name}` : c.name,
            icon: c.icon,
            color: c.color,
          }))
      : scopeType === 'tag'
      ? workspace.tags.map((t) => ({
          value: t.id,
          label: `#${t.name}`,
          icon: 'Tag',
          color: t.color,
        }))
      : workspace.cards.map((card) => ({
          value: card.id,
          label: card.name,
          icon: card.icon,
          color: card.color,
        }));

  return (
    <div className="space-y-6">
      <div className="liquid-glass rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">
            Orçamentos Mensais (Teto de Gastos)
          </h2>
          <p className="text-xs text-slate-300">
            Atrele limites mensais a Categorias, Subcategorias, Tags ou Cartões de Crédito e acompanhe as despesas atreladas
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="px-4 py-2.5 rounded-2xl btn-vivid-blue text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={15} />
          Novo Orçamento
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {workspace.budgets.map((bgt) => {
          const linkedTransactions = workspace.transactions.filter((tx) => {
            if (tx.type !== 'expense') return false;
            const refMonth =
              tx.paymentMethod === 'credit_card' && tx.invoiceMonth && dateFilterMode === 'dueDate'
                ? tx.invoiceMonth
                : (dateFilterMode === 'dueDate' ? tx.dueDate : tx.registrationDate).slice(0, 7);

            if (refMonth !== selectedMonth) return false;
            if (bgt.scopeType === 'category') {
              return tx.categoryId === bgt.targetId || tx.subcategoryId === bgt.targetId;
            }
            if (bgt.scopeType === 'tag') {
              return tx.tags.includes(bgt.targetId);
            }
            if (bgt.scopeType === 'card') {
              return tx.cardId === bgt.targetId;
            }
            return false;
          });

          const totalSpent = linkedTransactions.reduce(
            (acc, tx) => acc + getEffectiveTransactionAmount(tx, bgt.ownerFilter),
            0
          );

          const pct =
            bgt.monthlyLimit > 0 ? Math.round((totalSpent / bgt.monthlyLimit) * 100) : 0;
          const remaining = Math.max(0, bgt.monthlyLimit - totalSpent);
          const isOver = pct >= 100;
          const isWarn = pct >= bgt.alertPercent && !isOver;
          const isExpanded = expandedBudgetId === bgt.id;

          return (
            <div
              key={bgt.id}
              className="liquid-glass rounded-3xl p-6 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{
                      backgroundColor: `${bgt.color}22`,
                      color: bgt.color,
                      border: `1px solid ${bgt.color}60`,
                    }}
                  >
                    <DynamicIcon name={bgt.icon} size={20} />
                  </span>
                  <div>
                    <div className="text-base font-extrabold text-white">{bgt.name}</div>
                    <div className="text-xs text-slate-400">
                      Escopo:{' '}
                      {bgt.scopeType === 'category'
                        ? 'Categoria'
                        : bgt.scopeType === 'tag'
                        ? 'Tag'
                        : 'Cartão'}{' '}
                      • Alerta em {bgt.alertPercent}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(bgt)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white cursor-pointer"
                    title="Editar Orçamento"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteBudget(bgt.id)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-[#F43F5E]/25 text-rose-300 hover:text-[#F43F5E] cursor-pointer"
                    title="Excluir Orçamento"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Valores e Barra Sólida */}
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Gasto Acumulado no Mês
                    </div>
                    <div className="text-xl font-extrabold text-white">
                      {formatCurrency(totalSpent)}{' '}
                      <span className="text-xs font-normal text-slate-400">
                        de {formatCurrency(bgt.monthlyLimit)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                        isOver
                          ? 'bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]'
                          : isWarn
                          ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]'
                          : 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]'
                      }`}
                    >
                      {isOver ? (
                        <AlertTriangle size={13} />
                      ) : isWarn ? (
                        <Flame size={13} />
                      ) : (
                        <CheckCircle2 size={13} />
                      )}
                      {pct}%
                    </span>
                    <div className="text-[11px] text-slate-300 mt-1">
                      {isOver
                        ? `Estourou ${formatCurrency(totalSpent - bgt.monthlyLimit)}`
                        : `Restam ${formatCurrency(remaining)}`}
                    </div>
                  </div>
                </div>

                <div className="w-full h-2.5 rounded-full progress-track overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, pct)}%`,
                      backgroundColor: isOver
                        ? '#F43F5E'
                        : isWarn
                        ? '#F59E0B'
                        : '#10B981',
                    }}
                  />
                </div>
              </div>

              {/* Botão Ver Despesas Atreladas */}
              <div>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedBudgetId(isExpanded ? null : bgt.id)
                  }
                  className="text-xs font-bold text-[#60A5FA] hover:underline cursor-pointer"
                >
                  {isExpanded
                    ? 'Ocultar despesas atreladas'
                    : `Ver ${linkedTransactions.length} despesa(s) atrelada(s) a este orçamento`}
                </button>

                {isExpanded && (
                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto p-2.5 rounded-2xl bg-black/35 border border-white/10">
                    {linkedTransactions.length === 0 ? (
                      <div className="text-xs text-slate-400 text-center py-3">
                        Nenhuma despesa atrelada neste mês.
                      </div>
                    ) : (
                      linkedTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          onClick={() => onEditTx(tx)}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-white/10 cursor-pointer text-xs"
                        >
                          <div>
                            <div className="font-bold text-white">{tx.description}</div>
                            <div className="text-[10px] text-slate-400">
                              Venc: {formatDateBR(tx.dueDate)}
                            </div>
                          </div>
                          <div className="font-extrabold text-[#F43F5E]">
                            {formatCurrency(
                              getEffectiveTransactionAmount(tx, bgt.ownerFilter)
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Criar / Editar Orçamento */}
      <LiquidModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBudget ? 'Editar Orçamento Mensal' : 'Novo Orçamento Mensal'}
        headerColor={color}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Nome do Orçamento
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Teto Alimentação, Lazer do Casal..."
                className="w-full liquid-input rounded-2xl px-4 py-2.5 text-sm text-white"
              />
            </div>

            <CurrencyInput
              label="Limite Mensal (R$)"
              value={monthlyLimit}
              onChange={setMonthlyLimit}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LiquidSelect
              label="Atrelar Gastos Por:"
              value={scopeType}
              onChange={(v) => {
                const nextScope = v as BudgetScopeType;
                setScopeType(nextScope);
                if (nextScope === 'category') {
                  setTargetId(workspace.categories.find((c) => c.type === 'expense')?.id || '');
                } else if (nextScope === 'tag') {
                  setTargetId(workspace.tags[0]?.id || '');
                } else {
                  setTargetId(workspace.cards[0]?.id || '');
                }
              }}
              options={[
                { value: 'category', label: 'Categoria / Subcategoria', icon: 'Layers', color: '#F97316' },
                { value: 'tag', label: 'Tag (#Etiqueta)', icon: 'Tag', color: '#06B6D4' },
                { value: 'card', label: 'Cartão de Crédito', icon: 'CreditCard', color: '#7C3AED' },
              ]}
            />

            <LiquidSelect
              label="Qual Item Monitorar?"
              value={targetId}
              onChange={setTargetId}
              searchable
              options={targetOptions}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LiquidSelect
              label="Considerar Gastos de Quem?"
              value={ownerFilter}
              onChange={(v) => setOwnerFilter(v as GlobalViewFilter)}
              options={[
                { value: 'all', label: 'Todo o Casal (Consolidado)', icon: 'Users', color: '#2563EB' },
                { value: 'me', label: 'Apenas Minha Parte', icon: 'User', color: '#3B82F6' },
                { value: 'partner', label: 'Apenas Parte Dela', icon: 'User', color: '#EC4899' },
              ]}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Alerta Visual ao Atingir (%): {alertPercent}%
              </label>
              <input
                type="range"
                min={50}
                max={95}
                step={5}
                value={alertPercent}
                onChange={(e) => setAlertPercent(Number(e.target.value))}
                className="w-full accent-[#F59E0B] mt-2 cursor-pointer"
              />
            </div>
          </div>

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
              Salvar Orçamento
            </button>
          </div>
        </form>
      </LiquidModal>
    </div>
  );
}
