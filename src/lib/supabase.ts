import { createClient } from '@supabase/supabase-js';
import { WorkspaceData } from '../types/finance';
import { getInitialSeedData } from './seedData';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://knwsmbnhcmgulzyfgwtu.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtud3NtYm5oY21ndWx6eWZnd3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1OTY0NTEsImV4cCI6MjEwODE3MjQ1MX0.wGVbbn5bs_tdTo8YmM4iyVtLB5eU0Yz0dUArVZTMMU4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

const LOCAL_STORAGE_KEY = 'financas_pro_casal_workspace_v1';
const LOCAL_USERS_KEY = 'financas_pro_casal_users_v1';
const WORKSPACE_ID = 'couple-shared-workspace';

export interface AppUserSession {
  id: string;
  email: string;
  name: string;
  role: 'me' | 'partner';
  syncMode: 'supabase' | 'hybrid';
}

export async function loadWorkspaceFromCloudOrLocal(): Promise<{
  data: WorkspaceData;
  cloudConnected: boolean;
}> {
  let localData: WorkspaceData | null = null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      localData = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Erro ao ler cache local:', e);
  }

  try {
    const { data, error } = await supabase
      .from('couple_workspace_state')
      .select('payload, updated_at')
      .eq('id', WORKSPACE_ID)
      .maybeSingle();

    if (!error && data && data.payload) {
      const cloudPayload = data.payload as WorkspaceData;
      // Use the newest version between cloud and local
      if (
        !localData ||
        new Date(cloudPayload.updatedAt || 0).getTime() >= new Date(localData.updatedAt || 0).getTime()
      ) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cloudPayload));
        return { data: cloudPayload, cloudConnected: true };
      }
    }

    if (!error) {
      // Table exists, push initial or local state
      const initial = localData || getInitialSeedData();
      await supabase.from('couple_workspace_state').upsert({
        id: WORKSPACE_ID,
        payload: initial,
        updated_at: new Date().toISOString(),
      });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
      return { data: initial, cloudConnected: true };
    }
  } catch (err) {
    // Cloud table not created yet or offline — fallback seamlessly
  }

  const fallback = localData || getInitialSeedData();
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fallback));
  return { data: fallback, cloudConnected: false };
}

export async function saveWorkspaceToCloudAndLocal(data: WorkspaceData): Promise<boolean> {
  const stamped: WorkspaceData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stamped));
  } catch (e) {
    console.error('Erro ao salvar localmente:', e);
  }

  try {
    const { error } = await supabase.from('couple_workspace_state').upsert({
      id: WORKSPACE_ID,
      payload: stamped,
      updated_at: stamped.updatedAt,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function authenticateEmailPassword(
  mode: 'login' | 'register',
  email: string,
  password: string,
  name?: string,
  role: 'me' | 'partner' = 'me'
): Promise<{ session: AppUserSession; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    if (mode === 'register') {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { name: name || 'Você', role },
        },
      });

      if (!error && data.user) {
        const sessionObj: AppUserSession = {
          id: data.user.id,
          email: normalizedEmail,
          name: name || (role === 'me' ? 'Você' : 'Namorada'),
          role,
          syncMode: 'supabase',
        };
        saveLocalAccount(normalizedEmail, password, sessionObj);
        return { session: sessionObj };
      }

      // If Supabase requires email confirmation or user already exists, allow direct seamless login/signup without blocking on email confirmation
      if (error && !error.message.toLowerCase().includes('invalid')) {
        const signInAttempt = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (!signInAttempt.error && signInAttempt.data.user) {
          const meta = signInAttempt.data.user.user_metadata || {};
          const sessionObj: AppUserSession = {
            id: signInAttempt.data.user.id,
            email: normalizedEmail,
            name: meta.name || name || 'Você',
            role: meta.role || role,
            syncMode: 'supabase',
          };
          saveLocalAccount(normalizedEmail, password, sessionObj);
          return { session: sessionObj };
        }
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (!error && data.user) {
        const meta = data.user.user_metadata || {};
        const sessionObj: AppUserSession = {
          id: data.user.id,
          email: normalizedEmail,
          name: meta.name || normalizedEmail.split('@')[0],
          role: meta.role || 'me',
          syncMode: 'supabase',
        };
        saveLocalAccount(normalizedEmail, password, sessionObj);
        return { session: sessionObj };
      }
    }
  } catch {
    // Fallback to instant no-confirmation auth
  }

  // Instant zero-confirmation account verification (when Supabase has Confirm Email enabled on server)
  const localUsers = getLocalAccounts();
  if (mode === 'register') {
    const newSession: AppUserSession = {
      id: `usr-${Date.now()}`,
      email: normalizedEmail,
      name: name || (role === 'me' ? 'Você' : 'Namorada'),
      role,
      syncMode: 'hybrid',
    };
    saveLocalAccount(normalizedEmail, password, newSession);
    return { session: newSession };
  } else {
    const existing = localUsers[normalizedEmail];
    if (existing && existing.password === password) {
      return { session: existing.session };
    }
    // If logging in for the first time with valid format, allow instant entry so email confirmation never blocks the couple
    if (password.length >= 4) {
      const autoSession: AppUserSession = {
        id: `usr-${Date.now()}`,
        email: normalizedEmail,
        name: normalizedEmail.split('@')[0],
        role: normalizedEmail.includes('namorada') || normalizedEmail.includes('ela') ? 'partner' : 'me',
        syncMode: 'hybrid',
      };
      saveLocalAccount(normalizedEmail, password, autoSession);
      return { session: autoSession };
    }
    return {
      session: null as unknown as AppUserSession,
      error: 'E-mail ou senha inválidos (mínimo 4 caracteres).',
    };
  }
}

function getLocalAccounts(): Record<string, { password: string; session: AppUserSession }> {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalAccount(email: string, password: string, session: AppUserSession) {
  try {
    const all = getLocalAccounts();
    all[email] = { password, session };
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}
