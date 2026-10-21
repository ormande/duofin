import React, { useState } from 'react';
import { format, differenceInMonths, parseISO } from 'date-fns';
import {
  FinancialGoal,
  GoalContribution,
  OwnerScope,
  PersonRole,
  WorkspaceData,
} from '../types/finance';
import { formatCurrency, formatDateBR } from '../lib/financeUtils';
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
  PiggyBank,
  Calendar,
  TrendingUp,
} from 'lucide-react';

interface GoalsViewProps {
  workspace: WorkspaceData;
  onSaveGoal: (goal: FinancialGoal, isEdit: boolean) => void;
  onDeleteGoal: (goalId: string) => void;
}

export function GoalsView({
  workspace,
  onSaveGoal,
  onDeleteGoal,
}: GoalsViewProps) {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState<number>(15000);
  const [initialAmount, setInitialAmount] = useState<number>(0);
  const [deadline, setDeadline] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [linkedAccountId, setLinkedAccountId] = useState(workspace.accounts[0]?.id || '');
  const [owner, setOwner] = useState<OwnerScope>('both');
  const [icon, setIcon] = useState('Target');
  const [color, setColor] = useState('#10B981');

  // Contribution CRUD Modal
  const [activeGoalForContrib, setActiveGoalForContrib] = useState<FinancialGoal | null>(null);
  const [editingContrib, setEditingContrib] = useState<GoalContribution | null>(null);
  const [contribAmount, setContribAmount] = useState<number>(0);
  const [contribDate, setContribDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [contribMember, setContribMember] = useState<PersonRole>('me');
  const [contribNotes, setContribNotes] = useState('');

  const meMember = workspace.members.find((m) => m.role === 'me') || { name: 'Você' };
  const partnerMember = workspace.members.find((m) => m.role === 'partner') || { name: 'Namorada' };

  const openCreateGoal = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmount(15000);
    setInitialAmount(0);
    setDeadline(format(new Date(Date.now() + 180 * 86400000), 'yyyy-MM-dd'));
    setLinkedAccountId(workspace.accounts[0]?.id || '');
    setOwner('both');
    setIcon('Target');
    setColor('#10B981');
    setIsGoalModalOpen(true);
  };

  const openEditGoal = (g: FinancialGoal) => {
    setEditingGoal(g);
    setName(g.name);
    setTargetAmount(g.targetAmount);
    setInitialAmount(g.initialAmount);
    setDeadline(g.deadline);
    setLinkedAccountId(g.linkedAccountId || '');
    setOwner(g.owner);
    setIcon(g.icon);
    setColor(g.color);
    setIsGoalModalOpen(true);
  };

  const handleSaveGoalForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetAmount <= 0) return;

    const obj: FinancialGoal = {
      id: editingGoal ? editingGoal.id : `goal-${Date.now()}`,
      name: name.trim() || 'Nova Meta',
      targetAmount,
      initialAmount,
      deadline,
      linkedAccountId: linkedAccountId || undefined,
      owner,
      icon,
      color,
      contributions: editingGoal ? editingGoal.contributions : [],
    };
    onSaveGoal(obj, Boolean(editingGoal));
    setIsGoalModalOpen(false);
  };

  const openAddContrib = (goal: FinancialGoal) => {
    setActiveGoalForContrib(goal);
    setEditingContrib(null);
    setContribAmount(0);
    setContribDate(format(new Date(), 'yyyy-MM-dd'));
    setContribMember('me');
    setContribNotes('');
  };

  const openEditContrib = (goal: FinancialGoal, contrib: GoalContribution) => {
    setActiveGoalForContrib(goal);
    setEditingContrib(contrib);
    setContribAmount(contrib.amount);
    setContribDate(contrib.date);
    setContribMember(contrib.member);
    setContribNotes(contrib.notes || '');
  };

  const handleSaveContrib = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGoalForContrib || contribAmount <= 0) return;

    const newContrib: GoalContribution = {
      id: editingContrib ? editingContrib.id : `contrib-${Date.now()}`,
      date: contribDate,
      amount: contribAmount,
      member: contribMember,
      notes: contribNotes.trim() || undefined,
    };

    const updatedContribs = editingContrib
      ? activeGoalForContrib.contributions.map((c) =>
          c.id === editingContrib.id ? newContrib : c
        )
      : [newContrib, ...activeGoalForContrib.contributions];

    onSaveGoal(
      {
        ...activeGoalForContrib,
        contributions: updatedContribs,
      },
      true
    );
    setActiveGoalForContrib(null);
  };

  const handleDeleteContrib = (goal: FinancialGoal, contribId: string) => {
    onSaveGoal(
      {
        ...goal,
        contributions: goal.contributions.filter((c) => c.id !== contribId),
      },
      true
    );
  };

  return (
    <div className="space-y-6">
      <div className="liquid-glass rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">
            Metas & Objetivos Financeiros do Casal
          </h2>
          <p className="text-xs text-slate-300">
            Planeje viagens, reservas e conquistas com histórico completo de aportes (CRUD de metas e de depósitos)
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateGoal}
          className="px-4 py-2.5 rounded-2xl btn-vivid-blue text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={15} />
          Criar Nova Meta
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {workspace.goals.map((goal) => {
          const contribsSum = goal.contributions.reduce((acc, c) => acc + c.amount, 0);
          const currentSaved = goal.initialAmount + contribsSum;
          const pct =
            goal.targetAmount > 0
              ? Math.min(100, Math.round((currentSaved / goal.targetAmount) * 100))
              : 0;
          const remaining = Math.max(0, goal.targetAmount - currentSaved);

          let monthsLeft = 1;
          try {
            monthsLeft = Math.max(
              1,
              differenceInMonths(parseISO(goal.deadline), new Date())
            );
          } catch {
            monthsLeft = 1;
          }
          const monthlyNeeded = remaining / monthsLeft;

          return (
            <div
              key={goal.id}
              className="liquid-glass rounded-3xl p-6 space-y-5"
            >
              {/* Header Meta */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <span
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{
                      backgroundColor: `${goal.color}22`,
                      color: goal.color,
                      border: `1px solid ${goal.color}60`,
                    }}
                  >
                    <DynamicIcon name={goal.icon} size={22} />
                  </span>
                  <div>
                    <div className="text-lg font-extrabold text-white">{goal.name}</div>
                    <div className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> Prazo: {formatDateBR(goal.deadline)}
                      </span>
                      <span>•</span>
                      <span className="text-[#60A5FA] font-semibold">
                        Guardar ~{formatCurrency(monthlyNeeded)}/mês
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditGoal(goal)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white cursor-pointer"
                    title="Editar Meta"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteGoal(goal.id)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-[#F43F5E]/25 text-rose-300 hover:text-[#F43F5E] cursor-pointer"
                    title="Excluir Meta"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Progresso */}
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Valor Acumulado
                    </div>
                    <div className="text-2xl font-extrabold text-[#10B981]">
                      {formatCurrency(currentSaved)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Objetivo Total ({pct}%)
                    </div>
                    <div className="text-lg font-extrabold text-white">
                      {formatCurrency(goal.targetAmount)}
                    </div>
                  </div>
                </div>

                <div className="w-full h-2.5 rounded-full progress-track overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: goal.color,
                    }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>Saldo Inicial: {formatCurrency(goal.initialAmount)}</span>
                  <span>Faltam: {formatCurrency(remaining)}</span>
                </div>
              </div>

              {/* Histórico de Aportes */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-[#10B981]" />
                    Aportes & Movimentações ({goal.contributions.length})
                  </span>

                  <button
                    type="button"
                    onClick={() => openAddContrib(goal)}
                    className="px-3 py-1.5 rounded-xl btn-vivid-emerald text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <PiggyBank size={14} />
                    Novo Aporte
                  </button>
                </div>

                {goal.contributions.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400 rounded-2xl bg-black/20 border border-white/5">
                    Nenhum aporte extra registrado ainda.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {goal.contributions.map((c) => (
                      <div
                        key={c.id}
                        className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white">
                            {c.notes || 'Aporte para Meta'} •{' '}
                            <span
                              className={
                                c.member === 'me' ? 'text-[#60A5FA]' : 'text-[#F472B6]'
                              }
                            >
                              {c.member === 'me' ? meMember.name : partnerMember.name}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Data: {formatDateBR(c.date)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`font-extrabold ${
                              c.amount >= 0 ? 'text-[#10B981]' : 'text-[#F43F5E]'
                            }`}
                          >
                            {c.amount >= 0 ? '+' : ''}
                            {formatCurrency(c.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => openEditContrib(goal, c)}
                            className="p-1 text-slate-400 hover:text-white cursor-pointer"
                            title="Editar Aporte"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteContrib(goal, c.id)}
                            className="p-1 text-slate-400 hover:text-[#F43F5E] cursor-pointer"
                            title="Excluir Aporte"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Criar / Editar Meta */}
      <LiquidModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title={editingGoal ? 'Editar Meta Financeira' : 'Nova Meta Financeira'}
        headerColor={color}
      >
        <form onSubmit={handleSaveGoalForm} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Nome do Objetivo / Meta
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Reserva de Emergência, Viagem Europa, Entrada Ap..."
              className="w-full liquid-input rounded-2xl px-4 py-2.5 text-sm text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CurrencyInput
              label="Valor Alvo Desejado (R$)"
              value={targetAmount}
              onChange={setTargetAmount}
              required
            />

            <CurrencyInput
              label="Valor Inicial Já Guardado (R$)"
              value={initialAmount}
              onChange={setInitialAmount}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LiquidDatePicker
              label="Data Alvo / Prazo Final"
              value={deadline}
              onChange={setDeadline}
              accentColor={color}
            />

            <LiquidSelect
              label="Conta Associada (Opcional)"
              value={linkedAccountId}
              onChange={setLinkedAccountId}
              options={workspace.accounts.map((a) => ({
                value: a.id,
                label: a.name,
                icon: a.icon,
                color: a.color,
              }))}
            />
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
              onClick={() => setIsGoalModalOpen(false)}
              className="px-4 py-2.5 rounded-2xl liquid-glass-interactive text-xs font-bold text-slate-300 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl btn-vivid-blue text-xs font-bold text-white cursor-pointer"
            >
              Salvar Meta
            </button>
          </div>
        </form>
      </LiquidModal>

      {/* Modal Criar / Editar Aporte na Meta */}
      <LiquidModal
        isOpen={Boolean(activeGoalForContrib)}
        onClose={() => setActiveGoalForContrib(null)}
        title={
          editingContrib
            ? 'Editar Aporte na Meta'
            : `Novo Aporte — ${activeGoalForContrib?.name}`
        }
        maxWidth="md"
        headerColor="#10B981"
      >
        <form onSubmit={handleSaveContrib} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CurrencyInput
              label="Valor do Aporte (R$)"
              value={contribAmount}
              onChange={setContribAmount}
              accentTextClass="text-[#10B981]"
              required
            />

            <LiquidDatePicker
              label="Data do Aporte"
              value={contribDate}
              onChange={setContribDate}
              accentColor="#10B981"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LiquidSelect
              label="Quem Fez o Aporte?"
              value={contribMember}
              onChange={(v) => setContribMember(v as PersonRole)}
              options={[
                { value: 'me', label: meMember.name, icon: 'User', color: '#2563EB' },
                { value: 'partner', label: partnerMember.name, icon: 'User', color: '#EC4899' },
              ]}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Observação (Opcional)
              </label>
              <input
                type="text"
                value={contribNotes}
                onChange={(e) => setContribNotes(e.target.value)}
                placeholder="Ex: Décimo terceiro, Economia mensal..."
                className="w-full liquid-input rounded-2xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setActiveGoalForContrib(null)}
              className="px-4 py-2 rounded-xl liquid-glass-interactive text-xs font-bold text-slate-300 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl btn-vivid-emerald text-xs font-bold cursor-pointer"
            >
              Confirmar Aporte
            </button>
          </div>
        </form>
      </LiquidModal>
    </div>
  );
}
