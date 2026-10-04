-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query)

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric,
  description text,
  image_url text,
  category text,
  featured boolean default false,
  created_at timestamptz default now()
);

create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  product_name text,
  created_at timestamptz default now()
);

create table if not exists blocked_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz default now()
);

-- Runs with elevated privileges so the public insert policy below can check
-- the blocklist without needing (and without granting) public read access to it.
create or replace function is_email_blocked(check_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from blocked_emails where lower(email) = lower(check_email));
$$;

alter table products enable row level security;
alter table inquiries enable row level security;
alter table blocked_emails enable row level security;

create policy "Authenticated can manage blocked emails"
  on blocked_emails for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Anyone can view products (public storefront)
create policy "Public can read products"
  on products for select
  using (true);

-- Only signed-in users (the admin login) can add/edit/delete products
create policy "Authenticated can manage products"
  on products for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Anyone can submit an inquiry (the contact form), unless their email is blocked
create policy "Public can submit inquiries"
  on inquiries for insert
  with check (not is_email_blocked(email));

-- Only the signed-in admin can read/delete inquiries
create policy "Authenticated can read inquiries"
  on inquiries for select
  using (auth.role() = 'authenticated');

create policy "Authenticated can delete inquiries"
  on inquiries for delete
  using (auth.role() = 'authenticated');

-- Storage bucket for product photos: create a bucket named "products"
-- in Supabase Dashboard > Storage, and mark it Public.
-- Being "Public" only allows reading files by URL — uploading still needs
-- its own policies below (storage has its own RLS, separate from the tables above).

create policy "Public can view product images"
  on storage.objects for select
  using (bucket_id = 'products');

create policy "Authenticated can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'products' and auth.role() = 'authenticated');

create policy "Authenticated can update product images"
  on storage.objects for update
  using (bucket_id = 'products' and auth.role() = 'authenticated');

create policy "Authenticated can delete product images"
  on storage.objects for delete
  using (bucket_id = 'products' and auth.role() = 'authenticated');

-- Bookkeeping: orders + a general income/expense ledger.
-- Fully private — no public policies at all, only the signed-in admin.

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer text not null,
  item text not null,
  amount numeric not null,
  paid boolean default false,
  created_at timestamptz default now()
);

create table if not exists ledger_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default current_date,
  description text not null,
  amount numeric not null,
  type text not null check (type in ('income', 'expense')),
  created_at timestamptz default now()
);

alter table orders enable row level security;
alter table ledger_entries enable row level security;

create policy "Authenticated can manage orders"
  on orders for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated can manage ledger"
  on ledger_entries for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Contact details shown on the site (single row, id = 1), edited from Admin > Contact
create table if not exists site_settings (
  id int primary key default 1 check (id = 1),
  address text,
  email text,
  phone text
);

alter table site_settings enable row level security;

create policy "Public can read site settings"
  on site_settings for select
  using (true);

create policy "Authenticated can manage site settings"
  on site_settings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

insert into site_settings (id, address, email, phone)
values (1, '14 Ahmadu Bello Way, Lagos, Nigeria', 'hello@stitchesbyliyah.com', '+234 800 000 0000')
on conflict (id) do nothing;

-- Root admin + per-admin permissions.
-- Each admin gets a list of areas they may use: products, inquiries, orders,
-- ledger, contact. The root admin can use everything and is the only one who
-- can add/remove admins or change permissions (done by the manage-admins Edge
-- Function with the service-role key, so this table has no write policies).
-- Signed-in users with no row here have no access at all.

create table if not exists admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('root', 'admin')),
  permissions text[] not null default '{}',
  created_at timestamptz default now()
);

-- (several root admins are allowed)

alter table admin_profiles enable row level security;

drop policy if exists "Read own admin profile" on admin_profiles;
create policy "Read own admin profile"
  on admin_profiles for select
  using (user_id = auth.uid());

create or replace function has_perm(area text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from admin_profiles
    where user_id = auth.uid() and (role = 'root' or area = any(permissions))
  );
$$;

-- products (+ product photos)
drop policy if exists "Authenticated can manage products" on products;
create policy "Admins with products access can manage products"
  on products for all
  using (has_perm('products')) with check (has_perm('products'));

drop policy if exists "Authenticated can upload product images" on storage.objects;
drop policy if exists "Authenticated can update product images" on storage.objects;
drop policy if exists "Authenticated can delete product images" on storage.objects;
create policy "Products admins can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'products' and has_perm('products'));
create policy "Products admins can update product images"
  on storage.objects for update
  using (bucket_id = 'products' and has_perm('products'));
create policy "Products admins can delete product images"
  on storage.objects for delete
  using (bucket_id = 'products' and has_perm('products'));

-- inquiries (+ the spam blocklist)
drop policy if exists "Authenticated can read inquiries" on inquiries;
drop policy if exists "Authenticated can delete inquiries" on inquiries;
create policy "Inquiries admins can read inquiries"
  on inquiries for select using (has_perm('inquiries'));
create policy "Inquiries admins can delete inquiries"
  on inquiries for delete using (has_perm('inquiries'));

drop policy if exists "Authenticated can manage blocked emails" on blocked_emails;
create policy "Inquiries admins can manage blocked emails"
  on blocked_emails for all
  using (has_perm('inquiries')) with check (has_perm('inquiries'));

-- orders and ledger
drop policy if exists "Authenticated can manage orders" on orders;
create policy "Orders admins can manage orders"
  on orders for all
  using (has_perm('orders')) with check (has_perm('orders'));

drop policy if exists "Authenticated can manage ledger" on ledger_entries;
create policy "Ledger admins can manage ledger"
  on ledger_entries for all
  using (has_perm('ledger')) with check (has_perm('ledger'));

-- contact details
drop policy if exists "Authenticated can manage site settings" on site_settings;
create policy "Contact admins can manage site settings"
  on site_settings for all
  using (has_perm('contact')) with check (has_perm('contact'));

-- One-time setup, run once by hand (replace the email) BEFORE the policies above
-- take effect for you, or you will lock yourself out:
--   insert into admin_profiles (user_id, role)
--   select id, 'root' from auth.users where email = 'you@example.com';
