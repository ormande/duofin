import React, { useState } from 'react';
import { AppUserSession, authenticateEmailPassword } from '../lib/supabase';
import { CoupleMember } from '../types/finance';
import { Lock, Mail, User, Sparkles, ArrowRight, ShieldCheck, Heart, Users } from 'lucide-react';

interface AuthScreenProps {
  members: CoupleMember[];
  onSuccess: (session: AppUserSession, registeredMember?: CoupleMember) => void;
}

export function AuthScreen({ members, onSuccess }: AuthScreenProps) {
  const member1 = members.find((m) => m.role === 'me') || members[0];
  const member2 = members.find((m) => m.role === 'partner') || members[1];

  const isMember1Registered = Boolean(member1?.isRegistered);
  const isMember2Registered = Boolean(member2?.isRegistered);
  const bothRegistered = isMember1Registered && isMember2Registered;

  // Se nenhum membro se registrou, o padrão pode ser registro. Se já houver alguém, login.
  const [mode, setMode] = useState<'login' | 'register'>(
    !isMember1Registered && !isMember2Registered ? 'register' : 'login'
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Determina qual perfil está sendo criado no registro
  const targetRoleToRegister = !isMember1Registered ? 'me' : 'partner';
  const partnerAlreadyRegisteredName = isMember1Registered
    ? member1.name
    : isMember2Registered
    ? member2.name
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!name.trim()) {
          setError('Por favor, informe seu nome.');
          return;
        }

        const res = await authenticateEmailPassword(
          'register',
          email,
          password,
          name.trim(),
          targetRoleToRegister
        );

        if (res.error) {
          setError(res.error);
        } else if (res.session) {
          const registeredMemberObj: CoupleMember = {
            id: targetRoleToRegister === 'me' ? 'member-me' : 'member-partner',
            name: name.trim(),
            role: targetRoleToRegister,
            avatarColor: targetRoleToRegister === 'me' ? '#2563EB' : '#EC4899',
            email: email.trim().toLowerCase(),
            isRegistered: true,
          };
          onSuccess(res.session, registeredMemberObj);
        }
      } else {
        // Mode: Login
        const res = await authenticateEmailPassword('login', email, password);

        if (res.error) {
          setError(res.error);
        } else if (res.session) {
          // Detecta a role com base no email cadastrado nos membros
          let resolvedRole: 'me' | 'partner' = res.session.role;
          let resolvedName = res.session.name;

          const normEmail = email.trim().toLowerCase();
          if (member1?.email && member1.email.toLowerCase() === normEmail) {
            resolvedRole = 'me';
            resolvedName = member1.name;
          } else if (member2?.email && member2.email.toLowerCase() === normEmail) {
            resolvedRole = 'partner';
            resolvedName = member2.name;
          }

          onSuccess({
            ...res.session,
            role: resolvedRole,
            name: resolvedName,
          });
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Ocorreu um erro ao conectar. Tente novamente.');
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
              mode === 'login' ? 'btn-vivid-blue on-vivid' : 'text-slate-400 hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              mode === 'register' ? 'btn-vivid-blue on-vivid' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cadastrar
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-[#F43F5E]/15 border border-[#F43F5E]/50 text-xs font-semibold text-[#F43F5E]">
            {error}
          </div>
        )}

        {/* Se ambos já estiverem cadastrados e usuário tentar registrar */}
        {mode === 'register' && bothRegistered ? (
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2563EB]/20 border border-[#2563EB]/40 flex items-center justify-center mx-auto text-[#2563EB]">
              <Users size={20} />
            </div>
            <h4 className="text-sm font-extrabold text-white">Casal Já Cadastrado!</h4>
            <p className="text-xs text-slate-300">
              O espaço já possui os dois perfis cadastrados ({member1.name} e {member2.name}). Por favor, acesse com seu e-mail e senha.
            </p>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full py-2.5 rounded-xl btn-vivid-blue on-vivid text-xs font-bold cursor-pointer"
            >
              Ir para o Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                {/* Banner de Indicação de Perfil do Casal */}
                <div className="p-3.5 rounded-2xl bg-[#2563EB]/15 border border-[#2563EB]/35 text-xs">
                  {partnerAlreadyRegisteredName ? (
                    <div className="flex items-center gap-2 text-slate-200">
                      <Heart size={16} className="text-[#EC4899] shrink-0" />
                      <span>
                        Conectando ao espaço de{' '}
                        <strong className="text-white">{partnerAlreadyRegisteredName}</strong>. Você será o 2º membro do casal!
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-200">
                      <ShieldCheck size={16} className="text-[#10B981] shrink-0" />
                      <span>
                        Primeiro acesso! Você está cadastrando o <strong className="text-white">1º membro do casal</strong>.
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Seu Nome ou Apelido
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Lucas, Mariana..."
                      className="w-full liquid-input rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400"
                    />
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
              className="w-full py-3 rounded-2xl btn-vivid-blue on-vivid text-sm font-bold flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading
                ? 'Processando...'
                : mode === 'login'
                ? 'Acessar DuoFin'
                : 'Concluir Cadastro e Entrar'}
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Rodapé informativo de segurança */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-[#10B981]" />
            Acesso individual seguro para cada membro do casal
          </p>
        </div>
      </div>
    </div>
  );
}
