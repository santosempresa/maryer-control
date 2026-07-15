-- Fisio (Atendimentos Maryer) — schema para Supabase (Fase 2)
-- Rode este script uma vez no SQL Editor do projeto Supabase.
--
-- Login e sessão são geridos pelo próprio app (usuário/senha, não Supabase Auth).
-- Por isso nenhuma tabela aqui fica acessível pela chave anon: todo acesso passa
-- pelas rotas do servidor Next.js, que usam a service role key. RLS fica ligado
-- em todas as tabelas como uma segunda camada de proteção, sem nenhuma policy
-- liberando anon/authenticated (a service role sempre ignora RLS).

create extension if not exists pgcrypto;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  avatar_data text,
  created_at timestamptz not null default now()
);

alter table app_users add column if not exists avatar_data text;

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null check (plan in ('1x_semana', '2x_semana', '3x_semana', 'experimental', 'fisioterapia')),
  weekdays jsonb not null default '[]'::jsonb,
  time text not null,
  start_date date not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients (id) on delete cascade,
  scheduled_date date not null,
  scheduled_time text not null,
  status text not null default 'pending' check (status in ('pending', 'done', 'rescheduled', 'missed')),
  plan text not null check (plan in ('1x_semana', '2x_semana', '3x_semana', 'experimental', 'fisioterapia')),
  reschedule_reason text,
  rescheduled_from uuid references sessions (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_patient_id_idx on sessions (patient_id);
create index if not exists sessions_scheduled_date_idx on sessions (scheduled_date);

alter table app_users enable row level security;
alter table patients enable row level security;
alter table sessions enable row level security;

-- Nenhuma policy é criada de propósito: anon e authenticated não têm nenhum
-- acesso a essas tabelas. Só a service role key (usada nas rotas do servidor)
-- consegue ler ou escrever aqui.
