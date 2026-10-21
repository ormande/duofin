import React, { useState } from 'react';
import { CoupleMember, WorkspaceData } from '../types/finance';
import { VIVID_PALETTE } from '../lib/icons';
import { Check, Cloud, RefreshCw, RotateCcw, Users, Save } from 'lucide-react';

interface CoupleSettingsViewProps {
  workspace: WorkspaceData;
  cloudConnected: boolean;
  onSaveMembers: (members: CoupleMember[]) => void;
  onResetDemoData: () => void;
  onForceSync: () => void;
}

export function CoupleSettingsView({
  workspace,
  cloudConnected,
  onSaveMembers,
  onResetDemoData,
  onForceSync,
}: CoupleSettingsViewProps) {
  const me = workspace.members.find((m) => m.role === 'me') || {
    id: 'member-me',
    name: 'Você',
    role: 'me' as const,
    avatarColor: '#0052FF',
    email: 'voce@casal.com',
  };
  const partner = workspace.members.find((m) => m.role === 'partner') || {
    id: 'member-partner',
    name: 'Namorada',
    role: 'partner' as const,
    avatarColor: '#FF2E93',
    email: 'namorada@casal.com',
  };

  const [myName, setMyName] = useState(me.name);
  const [myEmail, setMyEmail] = useState(me.email);
  const [myColor, setMyColor] = useState(me.avatarColor);

  const [partnerName, setPartnerName] = useState(partner.name);
  const [partnerEmail, setPartnerEmail] = useState(partner.email);
  const [partnerColor, setPartnerColor] = useState(partner.avatarColor);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveMembers([
      {
        id: 'member-me',
        role: 'me',
        name: myName.trim() || 'Você',
        email: myEmail.trim(),
        avatarColor: myColor,
      },
      {
        id: 'member-partner',
        role: 'partner',
        name: partnerName.trim() || 'Namorada',
        email: partnerEmail.trim(),
        avatarColor: partnerColor,
      },
    ]);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="liquid-glass rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">
            Perfis do Casal & Sincronização Supabase
          </h2>
          <p className="text-xs text-slate-300">
            Personalize os nomes, cores de perfil e gerencie a sincronização em nuvem
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onForceSync}
            className="px-4 py-2.5 rounded-2xl liquid-glass-interactive text-xs font-bold text-[#00D4FF] hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={14} />
            Sincronizar Nuvem Agora
          </button>

          <button
            type="button"
            onClick={onResetDemoData}
            className="px-4 py-2.5 rounded-2xl liquid-glass-interactive text-xs font-bold text-amber-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            Restaurar Dados Iniciais
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Perfil 1 */}
        <div className="liquid-glass rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl on-vivid flex items-center justify-center text-lg font-extrabold shadow-md"
              style={{ backgroundColor: myColor }}
            >
              {myName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Membro 1</h3>
              <p className="text-xs text-slate-400">Primeiro perfil do casal no sistema</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Nome / Apelido
            </label>
            <input
              type="text"
              required
              value={myName}
              onChange={(e) => setMyName(e.target.value)}
              className="w-full liquid-input rounded-2xl px-4 py-2.5 text-sm font-bold text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              value={myEmail}
              onChange={(e) => setMyEmail(e.target.value)}
              className="w-full liquid-input rounded-2xl px-4 py-2.5 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Cor do Perfil
            </label>
            <div className="flex flex-wrap gap-2">
              {VIVID_PALETTE.slice(0, 8).map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setMyColor(c.hex)}
                  className={`w-8 h-8 rounded-xl on-vivid flex items-center justify-center cursor-pointer transition ${
                    myColor === c.hex ? 'ring-2 ring-[#2563EB] scale-110 shadow-md' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {myColor === c.hex && <Check size={15} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Perfil 2 */}
        <div className="liquid-glass rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl on-vivid flex items-center justify-center text-lg font-extrabold shadow-md"
              style={{ backgroundColor: partnerColor }}
            >
              {partnerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Membro 2</h3>
              <p className="text-xs text-slate-400">Segundo perfil do casal no sistema</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Nome / Apelido
            </label>
            <input
              type="text"
              required
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              className="w-full liquid-input rounded-2xl px-4 py-2.5 text-sm font-bold text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              className="w-full liquid-input rounded-2xl px-4 py-2.5 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Cor do Perfil
            </label>
            <div className="flex flex-wrap gap-2">
              {VIVID_PALETTE.slice(0, 8).map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setPartnerColor(c.hex)}
                  className={`w-8 h-8 rounded-xl on-vivid flex items-center justify-center cursor-pointer transition ${
                    partnerColor === c.hex ? 'ring-2 ring-[#2563EB] scale-110 shadow-md' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {partnerColor === c.hex && <Check size={15} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 flex items-center justify-between liquid-glass rounded-3xl p-5">
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <Cloud
              size={18}
              className={cloudConnected ? 'text-[#00E676]' : 'text-[#00D4FF]'}
            />
            <span>
              Status Supabase:{' '}
              <strong className="text-white">
                {cloudConnected
                  ? 'Conectado e Sincronizando em Nuvem'
                  : 'Modo Híbrido Ativo (Salvo Instantaneamente + Pronto para SQL Supabase)'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {savedNotice && (
              <span className="text-xs font-bold text-[#00E676]">
                ✓ Perfis atualizados com sucesso!
              </span>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl btn-vivid-blue text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={15} />
              Salvar Perfis do Casal
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
