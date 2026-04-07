-- Run this in your Supabase SQL editor

drop table if exists tasks cascade;
drop table if exists clients cascade;

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null,
  bg text not null,
  text_color text not null,
  created_at timestamptz default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mode text not null check (mode in ('work', 'personal')),
  priority text not null check (priority in ('high', 'med', 'low')),
  due date,
  done boolean default false,
  notes text,
  client_id uuid references clients(id) on delete set null,
  created_at timestamptz default now()
);

alter table clients enable row level security;
alter table tasks enable row level security;

create policy "public all clients" on clients for all using (true) with check (true);
create policy "public all tasks" on tasks for all using (true) with check (true);

-- Add this separately if you already have the tables set up:
create table if not exists settings (
  id integer primary key default 1,
  business_brief text,
  updated_at timestamptz default now()
);
alter table settings enable row level security;
create policy "public all settings" on settings for all using (true) with check (true);
