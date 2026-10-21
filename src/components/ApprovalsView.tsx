import React, { useState } from 'react';
import {
  CoupleMember,
  MovementApproval,
  PersonRole,
  WorkspaceData,
} from '../types/finance';
import { formatCurrency, formatDateBR } from '../lib/financeUtils';
import { DynamicIcon } from '../lib/icons';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Users,
  CreditCard as CardIcon,
  Landmark,
  ArrowRight,
  Filter,
  Check,
  Trash2,
  Edit3,
  PlusCircle,
} from 'lucide-react';

interface ApprovalsViewProps {
  workspace: WorkspaceData;
  sessionRole: PersonRole;
  onApprove: (approval: MovementApproval) => void;
  onReject: (approval: MovementApproval) => void;
  onCancelRequest: (approvalId: string) => void;
}

export function ApprovalsView({
  workspace,
  sessionRole,
  onApprove,
  onReject,
  onCancelRequest,
}: ApprovalsViewProps) {
  const [filterTab, setFilterTab] = useState<'pending' | 'history'>('pending');

  const meMember = workspace.members.find((m) => m.role === 'me') || {
    name: 'Membro 1',
    avatarColor: '#2563EB',
  };
  const partnerMember = workspace.members.find((m) => m.role === 'partner') || {
    name: 'Membro 2',
    avatarColor: '#EC4899',
  };

  const currentMember = sessionRole === 'me' ? meMember : partnerMember;
  const otherMember = sessionRole === 'me' ? partnerMember : meMember;

  const approvals = workspace.approvals || [];

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const historyApprovals = approvals.filter(
    (a) => a.status === 'approved' || a.status === 'rejected'
  );

  const displayedList = filterTab === 'pending' ? pendingApprovals : historyApprovals;

  // Quantas pendências aguardam a ação do usuário logado
  const waitingForMeCount = pendingApprovals.filter(
    (a) => a.requestedBy !== sessionRole
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="liquid-glass rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#2563EB]/20 border border-[#2563EB]/40 flex items-center justify-center text-[#2563EB]">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">
                Aprovações do Casal
              </h2>
              <p className="text-xs text-slate-300">
                Movimentações compartilhadas requerem aprovação mútua antes de serem efetivadas
              </p>
            </div>
          </div>
        </div>

        {/* Tabs de Filtro: Pendentes / Histórico */}
        <div className="flex items-center liquid-glass-interactive rounded-2xl p-1 gap-1">
          <button
            type="button"
            onClick={() => setFilterTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              filterTab === 'pending'
                ? 'bg-[#2563EB] on-vivid shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Clock size={14} />
            Pendentes
            {pendingApprovals.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F43F5E] text-white">
                {pendingApprovals.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              filterTab === 'history'
                ? 'bg-[#2563EB] on-vivid shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <CheckCircle2 size={14} />
            Histórico
            {historyApprovals.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 text-white">
                {historyApprovals.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Info Banner se houver pendências para o usuário logado */}
      {filterTab === 'pending' && waitingForMeCount > 0 && (
        <div className="p-4 rounded-3xl bg-[#2563EB]/15 border border-[#2563EB]/40 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#2563EB] on-vivid flex items-center justify-center shrink-0 font-bold">
            !
          </div>
          <div className="text-xs">
            <span className="font-bold text-white">
              Você tem {waitingForMeCount} movimentação{waitingForMeCount > 1 ? 'ões' : ''} aguardando sua autorização!
            </span>
            <p className="text-slate-300">
              {otherMember.name} solicitou alterações em finanças compartilhadas do casal.
            </p>
          </div>
        </div>
      )}

      {/* Lista de Aprovações */}
      {displayedList.length === 0 ? (
        <div className="liquid-glass rounded-3xl p-12 text-center">
          <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <ShieldCheck size={32} />
          </div>
          <h3 className="text-base font-extrabold text-white">
            {filterTab === 'pending'
              ? 'Tudo em dia! Nenhuma aprovação pendente'
              : 'Nenhum histórico de aprovações registrado'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            {filterTab === 'pending'
              ? 'Quando qualquer um de vocês cadastrar ou alterar uma despesa, receita ou conta compartilhada do casal, o pedido aparecerá aqui para autorização.'
              : 'As decisões de aprovação ou recusa do casal ficam arquivadas nesta aba para controle e transparência.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayedList.map((item) => {
            const isRequester = item.requestedBy === sessionRole;
            const requester = item.requestedBy === 'me' ? meMember : partnerMember;
            const reviewer = item.reviewedBy === 'me' ? meMember : partnerMember;

            const actionLabel =
              item.action === 'create'
                ? 'Novo Lançamento'
                : item.action === 'edit'
                ? 'Edição de Lançamento'
                : 'Exclusão de Lançamento';

            const actionIcon =
              item.action === 'create' ? (
                <PlusCircle size={15} />
              ) : item.action === 'edit' ? (
                <Edit3 size={15} />
              ) : (
                <Trash2 size={15} />
              );

            return (
              <div
                key={item.id}
                className="liquid-glass-elevated rounded-3xl p-5 border border-white/15 space-y-4 hover:border-white/25 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Badge Solicitante */}
                    <div
                      className="w-10 h-10 rounded-2xl on-vivid flex items-center justify-center font-extrabold text-sm shrink-0 shadow-sm"
                      style={{ backgroundColor: requester.avatarColor }}
                    >
                      {requester.name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-white">
                          {item.description}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-300 flex items-center gap-1">
                          {actionIcon}
                          {actionLabel}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                        <span>
                          Solicitado por{' '}
                          <strong className="text-slate-200">
                            {isRequester ? 'Você' : requester.name}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>{item.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Valor e Status Badge */}
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    {item.amount !== undefined && (
                      <div className="text-base font-extrabold text-[#2563EB]">
                        {formatCurrency(item.amount)}
                      </div>
                    )}

                    {item.status === 'pending' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#F59E0B]/20 border border-[#F59E0B]/50 text-[#F59E0B] flex items-center gap-1.5">
                        <Clock size={13} />
                        {isRequester
                          ? `Aguardando ${otherMember.name}`
                          : 'Aguardando sua autorização'}
                      </span>
                    ) : item.status === 'approved' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#10B981]/20 border border-[#10B981]/50 text-[#10B981] flex items-center gap-1.5">
                        <CheckCircle2 size={13} />
                        Aprovado por {reviewer.name}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#F43F5E]/20 border border-[#F43F5E]/50 text-[#F43F5E] flex items-center gap-1.5">
                        <XCircle size={13} />
                        Recusado por {reviewer.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Detalhes da Movimentação */}
                {item.payload && (
                  <div className="p-3 rounded-2xl bg-black/25 border border-white/5 text-xs text-slate-300 space-y-1">
                    <div className="font-semibold text-slate-200">Detalhes:</div>
                    {item.targetType === 'transaction' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px] text-slate-300">
                        {item.payload.dueDate && (
                          <div>
                            Vencimento: <strong className="text-white">{formatDateBR(item.payload.dueDate)}</strong>
                          </div>
                        )}
                        {item.payload.responsibility && (
                          <div>
                            Divisão:{' '}
                            <strong className="text-white">
                              {item.payload.responsibility === 'split'
                                ? `Split (${meMember.name} ${formatCurrency(item.payload.myShareAmount || 0)} / ${partnerMember.name} ${formatCurrency(item.payload.partnerShareAmount || 0)})`
                                : item.payload.responsibility === 'me'
                                ? meMember.name
                                : partnerMember.name}
                            </strong>
                          </div>
                        )}
                        {item.payload.notes && (
                          <div className="col-span-full">
                            Observações: <span className="text-slate-400">{item.payload.notes}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Ações (Apenas em status pending) */}
                {item.status === 'pending' && (
                  <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-2.5">
                    {/* Se o usuário logado for quem DEVE APROVAR */}
                    {!isRequester ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onReject(item)}
                          className="px-4 py-2 rounded-2xl bg-[#F43F5E]/15 border border-[#F43F5E]/40 hover:bg-[#F43F5E]/30 text-[#F43F5E] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                        >
                          <XCircle size={15} />
                          Recusar Movimentação
                        </button>
                        <button
                          type="button"
                          onClick={() => onApprove(item)}
                          className="px-5 py-2 rounded-2xl bg-[#10B981] on-vivid hover:opacity-90 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition"
                        >
                          <CheckCircle2 size={15} />
                          Aprovar Movimentação
                        </button>
                      </>
                    ) : (
                      // Se o usuário logado for o SOLICITANTE
                      <button
                        type="button"
                        onClick={() => onCancelRequest(item.id)}
                        className="px-4 py-2 rounded-2xl liquid-glass-interactive text-xs font-bold text-slate-300 hover:text-[#F43F5E] flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 size={14} />
                        Cancelar Solicitação
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
