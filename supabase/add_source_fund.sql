-- AmmaLedger: Add source_fund to expenses
-- Run this in Supabase SQL Editor → New Query → Run

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS source_fund TEXT DEFAULT NULL;

COMMENT ON COLUMN public.expenses.source_fund IS
  'Which allocation fund this expense was drawn from (e.g. Savings, Household Balance, Mother Personal)';
