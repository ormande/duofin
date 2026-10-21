-- =========================================================================
-- FINANÇAS PRO CASAL - SUPABASE SQL SCHEMA (100% CRUD + SINCRONIZAÇÃO)
-- =========================================================================
-- Execute este script no "SQL Editor" do seu painel Supabase para criar 
-- as tabelas de sincronização em nuvem (o app também possui persistência 
-- híbrida automática caso as tabelas ainda não tenham sido rodadas).

create extension if not exists "uuid-ossp";

-- 1. Perfis do Casal (Membros)
create table if not exists public.couple_members (
  id text primary key,
  name text not null,
  role text not null, -- 'me' | 'partner'
  avatar_color text not null,
  email text,
  updated_at timestamptz default now()
);

-- 2. Contas Bancárias / Carteiras
create table if not exists public.accounts (
  id text primary key,
  name text not null,
  type text not null, -- 'checking' | 'savings' | 'cash' | 'investment'
  initial_balance numeric(14,2) not null default 0,
  color text not null,
  icon text not null,
  owner text not null default 'both', -- 'me' | 'partner' | 'both'
  include_in_total boolean not null default true,
  updated_at timestamptz default now()
);

-- 3. Cartões de Crédito
create table if not exists public.credit_cards (
  id text primary key,
  name text not null,
  brand text not null,
  total_limit numeric(14,2) not null default 0,
  closing_day integer not null,
  due_day integer not null,
  default_account_id text,
  color text not null,
  icon text not null,
  owner text not null default 'both',
  updated_at timestamptz default now()
);

-- 4. Pagamentos de Faturas de Cartão
create table if not exists public.invoice_payments (
  id text primary key,
  card_id text not null,
  invoice_month text not null, -- YYYY-MM
  amount numeric(14,2) not null,
  paid_date text not null, -- YYYY-MM-DD
  account_id text not null,
  paid_by text not null default 'me',
  notes text,
  updated_at timestamptz default now()
);

-- 5. Categorias e Subcategorias
create table if not exists public.categories (
  id text primary key,
  name text not null,
  type text not null, -- 'expense' | 'income'
  icon text not null,
  color text not null,
  parent_id text,
  updated_at timestamptz default now()
);

-- 6. Tags Personalizadas
create table if not exists public.tags (
  id text primary key,
  name text not null,
  color text not null,
  updated_at timestamptz default now()
);

-- 7. Transações (Receitas, Despesas, Transferências, Parceladas e Fixas)
create table if not exists public.transactions (
  id text primary key,
  description text not null,
  amount numeric(14,2) not null,
  type text not null, -- 'expense' | 'income' | 'transfer'
  registration_date text not null, -- Data de Registro (Competência YYYY-MM-DD)
  due_date text not null,          -- Data de Vencimento (Caixa YYYY-MM-DD)
  paid_date text,
  status text not null,            -- 'paid' | 'pending'
  payment_method text not null,    -- 'account' | 'credit_card'
  account_id text,
  destination_account_id text,
  card_id text,
  invoice_month text,              -- YYYY-MM (Para compras no cartão)
  category_id text not null,
  subcategory_id text,
  tags jsonb default '[]'::jsonb,
  -- Divisão do Casal (Meu, Dela ou Split % / R$)
  responsibility text not null default 'me', -- 'me' | 'partner' | 'split'
  paid_by text not null default 'me',        -- 'me' | 'partner'
  split_mode text default 'percentage',      -- 'percentage' | 'manual'
  my_share_percent numeric(6,2) default 50,
  partner_share_percent numeric(6,2) default 50,
  my_share_amount numeric(14,2) default 0,
  partner_share_amount numeric(14,2) default 0,
  -- Controle de Parcelas e Contas Fixas
  recurrence_type text not null default 'single', -- 'single' | 'installment' | 'fixed'
  series_id text,
  installment_number integer,
  total_installments integer,
  notes text,
  is_refund boolean default false,
  updated_at timestamptz default now()
);

-- 8. Orçamentos Mensais (Teto de Gastos)
create table if not exists public.budgets (
  id text primary key,
  name text not null,
  scope_type text not null, -- 'category' | 'tag' | 'card'
  target_id text not null,  -- ID da categoria, tag ou cartão
  monthly_limit numeric(14,2) not null,
  owner_filter text not null default 'all', -- 'all' | 'me' | 'partner'
  alert_percent integer not null default 80,
  color text not null,
  icon text not null,
  updated_at timestamptz default now()
);

-- 9. Metas Financeiras e Histórico de Aportes
create table if not exists public.goals (
  id text primary key,
  name text not null,
  target_amount numeric(14,2) not null,
  initial_amount numeric(14,2) not null default 0,
  deadline text not null, -- YYYY-MM-DD
  linked_account_id text,
  icon text not null,
  color text not null,
  owner text not null default 'both',
  contributions jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);

-- 10. Tabela KV de Estado Sincronizado (para sincronização instantânea zero-config)
create table if not exists public.couple_workspace_state (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz default now()
);

-- Liberar acesso para usuários autenticados / anon do projeto do casal
alter table public.couple_members enable row level security;
alter table public.accounts enable row level security;
alter table public.credit_cards enable row level security;
alter table public.invoice_payments enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.goals enable row level security;
alter table public.couple_workspace_state enable row level security;

create policy "Allow all couple_members" on public.couple_members for all using (true) with check (true);
create policy "Allow all accounts" on public.accounts for all using (true) with check (true);
create policy "Allow all credit_cards" on public.credit_cards for all using (true) with check (true);
create policy "Allow all invoice_payments" on public.invoice_payments for all using (true) with check (true);
create policy "Allow all categories" on public.categories for all using (true) with check (true);
create policy "Allow all tags" on public.tags for all using (true) with check (true);
create policy "Allow all transactions" on public.transactions for all using (true) with check (true);
create policy "Allow all budgets" on public.budgets for all using (true) with check (true);
create policy "Allow all goals" on public.goals for all using (true) with check (true);
create policy "Allow all couple_workspace_state" on public.couple_workspace_state for all using (true) with check (true);
