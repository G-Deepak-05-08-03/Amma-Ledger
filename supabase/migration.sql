-- AmmaLedger Database Migration
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard

-- =====================
-- 1. PROFILES TABLE
-- =====================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  role text not null default 'admin',
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'admin'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- =====================
-- 2. SALARIES TABLE
-- =====================
create table if not exists public.salaries (
  id uuid primary key default gen_random_uuid(),
  amount numeric not null check (amount > 0),
  received_date date not null,
  source text not null,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

alter table public.salaries enable row level security;

create policy "Authenticated users can manage salaries"
  on public.salaries for all
  using (auth.role() = 'authenticated');


-- =====================
-- 3. ALLOCATIONS TABLE
-- =====================
create table if not exists public.allocations (
  id uuid primary key default gen_random_uuid(),
  salary_id uuid references public.salaries(id) on delete cascade not null,
  allocated_to text not null,
  amount numeric not null check (amount >= 0),
  created_at timestamptz default now() not null
);

alter table public.allocations enable row level security;

create policy "Authenticated users can manage allocations"
  on public.allocations for all
  using (auth.role() = 'authenticated');


-- =====================
-- 4. EXPENSES TABLE
-- =====================
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  amount numeric not null check (amount > 0),
  category text not null,
  expense_date date not null,
  notes text,
  paid_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

alter table public.expenses enable row level security;

create policy "Authenticated users can manage expenses"
  on public.expenses for all
  using (auth.role() = 'authenticated');


-- =====================
-- 5. INDEXES
-- =====================
create index if not exists idx_salaries_received_date on public.salaries(received_date);
create index if not exists idx_expenses_expense_date on public.expenses(expense_date);
create index if not exists idx_expenses_category on public.expenses(category);
create index if not exists idx_allocations_salary_id on public.allocations(salary_id);
