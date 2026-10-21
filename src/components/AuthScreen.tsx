import React, { useState } from 'react';
import { AppUserSession, authenticateEmailPassword } from '../lib/supabase';
import { Lock, Mail, User, Heart, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface AuthScreenProps {
  onSuccess: (session: AppUserSession) => void;
}

export function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'me' | 'partner'>('me');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authenticateEmailPassword(mode, email, password, name, role);
      if (res.error) {
        setError(res.error);
      } else if (res.session) {
        onSuccess(res.session);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen liquid-bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-md liquid-glass-elevated rounded-3xl p-7 sm:p-8 border border-white/15 shadow-2xl">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3.5 shadow-lg">
            <img src="/icon.svg" alt="DuoFin Logo" className="w-16 h-16 rounded-2xl" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Duo<span className="text-[#2563EB]">Fin</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1.5">
            <Sparkles size={13} className="text-[#10B981]" />
            Finanças Inteligentes para o Casal
          </p>
        </div>

        {/* Toggle Login / Cadastro */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/30 border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              mode === 'login' ? 'btn-vivid-blue text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Entrar com E-mail
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              mode === 'register'
                ? 'btn-vivid-blue text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Criar Cadastro Rápido
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-[#F43F5E]/15 border border-[#F43F5E]/50 text-xs font-semibold text-[#F43F5E]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Seu Nome
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Lucas / Mariana"
                    className="w-full liquid-input rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Perfil no Espaço do Casal
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('me')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer transition ${
                      role === 'me'
                        ? 'bg-[#2563EB]/20 border-[#3B82F6] text-[#60A5FA]'
                        : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    <User size={14} />
                    Perfil 1 (Você)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('partner')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer transition ${
                      role === 'partner'
                        ? 'bg-[#EC4899]/20 border-[#EC4899] text-[#F472B6]'
                        : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    <User size={14} />
                    Perfil 2 (Namorada)
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full liquid-input rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full liquid-input rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl btn-vivid-blue text-sm font-bold text-white flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading
              ? 'Conectando...'
              : mode === 'login'
              ? 'Acessar Painel Financeiro'
              : 'Criar Conta e Entrar Direto'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Access */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2.5">
            <span className="flex items-center gap-1">
              <ShieldCheck size={13} className="text-[#10B981]" />
              Sem confirmação de e-mail
            </span>
            <span>Acesso rápido 1 clique:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                onSuccess({
                  id: 'usr-me',
                  email: 'voce@casal.com',
                  name: 'Você',
                  role: 'me',
                  syncMode: 'supabase',
                })
              }
              className="py-2 px-3 rounded-xl liquid-glass-interactive text-xs font-semibold text-[#60A5FA] hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <User size={13} />
              Entrar como Você
            </button>
            <button
              type="button"
              onClick={() =>
                onSuccess({
                  id: 'usr-partner',
                  email: 'namorada@casal.com',
                  name: 'Namorada',
                  role: 'partner',
                  syncMode: 'supabase',
                })
              }
              className="py-2 px-3 rounded-xl liquid-glass-interactive text-xs font-semibold text-[#F472B6] hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <User size={13} />
              Entrar como Namorada
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
