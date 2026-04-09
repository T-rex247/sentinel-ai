-- SentinelAI Schema

-- Agents: wallets registered for monitoring
create table agents (
  id              uuid primary key default gen_random_uuid(),
  wallet_address  text not null,
  label           text,
  owner_id        uuid references auth.users(id),
  telegram_chat_id bigint,
  webhook_url     text,
  config          jsonb not null default '{}'::jsonb,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint agents_wallet_unique unique (wallet_address)
);

create index idx_agents_wallet on agents (wallet_address) where is_active = true;
create index idx_agents_owner on agents (owner_id);

-- Transactions: decoded transactions for monitored wallets
create table transactions (
  id               uuid primary key default gen_random_uuid(),
  agent_id         uuid not null references agents(id) on delete cascade,
  signature        text not null,
  slot             bigint not null,
  block_time       timestamptz,
  program_id       text not null,
  instruction_type text,
  decoded_data     jsonb not null default '{}'::jsonb,
  accounts         text[] not null default '{}',
  sol_amount       numeric(20,9),
  token_amount     numeric(30,9),
  token_mint       text,
  created_at       timestamptz not null default now(),
  constraint tx_sig_unique unique (signature, agent_id)
);

create index idx_tx_agent on transactions (agent_id, created_at desc);
create index idx_tx_signature on transactions (signature);
create index idx_tx_program on transactions (program_id);

-- Risk scores: per-transaction risk assessment
create table risk_scores (
  id              uuid primary key default gen_random_uuid(),
  agent_id        uuid not null references agents(id) on delete cascade,
  transaction_id  uuid references transactions(id) on delete set null,
  score           integer not null check (score >= 0 and score <= 100),
  rule_scores     jsonb not null default '{}'::jsonb,
  claude_analysis jsonb,
  created_at      timestamptz not null default now()
);

create index idx_risk_agent on risk_scores (agent_id, created_at desc);
create index idx_risk_score on risk_scores (score desc) where score >= 60;

-- Alerts: triggered when risk exceeds threshold
create table alerts (
  id              uuid primary key default gen_random_uuid(),
  agent_id        uuid not null references agents(id) on delete cascade,
  risk_score_id   uuid references risk_scores(id) on delete set null,
  severity        text not null check (severity in ('low', 'medium', 'high', 'critical')),
  title           text not null,
  message         text not null,
  tx_signature    text,
  telegram_sent   boolean not null default false,
  webhook_sent    boolean not null default false,
  acknowledged    boolean not null default false,
  created_at      timestamptz not null default now()
);

create index idx_alerts_agent on alerts (agent_id, created_at desc);
create index idx_alerts_severity on alerts (severity, created_at desc) where acknowledged = false;

-- API keys: for programmatic access
create table api_keys (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  key_hash    text not null,
  label       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  last_used   timestamptz
);

create index idx_apikeys_hash on api_keys (key_hash) where is_active = true;

-- Balance snapshots: periodic balance tracking
create table balance_snapshots (
  id             uuid primary key default gen_random_uuid(),
  agent_id       uuid not null references agents(id) on delete cascade,
  sol_balance    numeric(20,9) not null,
  token_balances jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

create index idx_balance_agent on balance_snapshots (agent_id, created_at desc);

-- Enable Realtime
alter publication supabase_realtime add table alerts;
alter publication supabase_realtime add table risk_scores;

-- RLS
alter table agents enable row level security;
alter table transactions enable row level security;
alter table risk_scores enable row level security;
alter table alerts enable row level security;
alter table api_keys enable row level security;
alter table balance_snapshots enable row level security;

create policy "Users manage own agents" on agents for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Users read own transactions" on transactions for select
  using (agent_id in (select id from agents where owner_id = auth.uid()));

create policy "Users read own risk scores" on risk_scores for select
  using (agent_id in (select id from agents where owner_id = auth.uid()));

create policy "Users manage own alerts" on alerts for all
  using (agent_id in (select id from agents where owner_id = auth.uid()));

create policy "Users manage own api keys" on api_keys for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Users read own balances" on balance_snapshots for select
  using (agent_id in (select id from agents where owner_id = auth.uid()));

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger agents_updated_at
  before update on agents
  for each row execute function update_updated_at();
