-- Enable RLS on public tables and switch views to security invoker
-- Safe to run multiple times

begin;

-- 1) Enable Row Level Security on key tables
alter table if exists public."Product"    enable row level security;
alter table if exists public."PriceList"  enable row level security;
alter table if exists public."PriceItem"  enable row level security;
alter table if exists public."Customer"   enable row level security;
alter table if exists public."Order"      enable row level security;
alter table if exists public."OrderLine"  enable row level security;

-- 2) Optional: anon can read only active products (keeps storefront working without service key)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'Product'
      and policyname = 'anon_read_active_products'
  ) then
    create policy "anon_read_active_products"
      on public."Product"
      for select
      to anon
      using ( coalesce(active, true) = true );
  end if;
end$$;

-- 3) Views: change to security invoker to avoid SECURITY DEFINER advisories
-- (Requires Postgres 15+, which Supabase uses)
do $$
begin
  -- vw_routes_full
  if exists (
    select 1 from pg_views
    where schemaname = 'public' and viewname = 'vw_routes_full'
  ) then
    execute 'alter view public.vw_routes_full set (security_invoker = true)';
  end if;

  -- vw_route_dates_map
  if exists (
    select 1 from pg_views
    where schemaname = 'public' and viewname = 'vw_route_dates_map'
  ) then
    execute 'alter view public.vw_route_dates_map set (security_invoker = true)';
  end if;
end$$;

commit;


