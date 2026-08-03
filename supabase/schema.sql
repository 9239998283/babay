-- B-Bay / Бабай — Supabase schema, RLS policies, Storage bucket and demo data.
-- Run this file once in Supabase Dashboard → SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text unique not null,
  description text,
  composition text,
  price integer not null check (price >= 0),
  weight text,
  image_url text,
  is_available boolean not null default true,
  is_popular boolean not null default false,
  is_new boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_active_order_idx on public.categories (is_active, sort_order, name);
create index if not exists menu_items_available_order_idx on public.menu_items (is_available, sort_order, name);
create index if not exists menu_items_category_available_idx on public.menu_items (category_id, is_available, sort_order);
create index if not exists menu_items_popular_idx on public.menu_items (is_popular, sort_order) where is_available;
create index if not exists menu_items_new_idx on public.menu_items (is_new, sort_order) where is_available;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists menu_items_set_updated_at on public.menu_items;
create trigger menu_items_set_updated_at
before update on public.menu_items
for each row execute procedure public.set_updated_at();

-- Tables exposed through the Data API must have RLS enabled.
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.menu_items to anon, authenticated;
grant insert, update, delete on public.categories, public.menu_items to authenticated;

-- The role is stored only in Supabase Auth app_metadata. Do not use user_metadata for authorization.
drop policy if exists "Public read active categories" on public.categories;
create policy "Public read active categories"
on public.categories for select to anon, authenticated
using (is_active = true);

drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories"
on public.categories for all to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Public read available menu items" on public.menu_items;
create policy "Public read available menu items"
on public.menu_items for select to anon, authenticated
using (
  is_available = true
  and exists (
    select 1 from public.categories
    where categories.id = menu_items.category_id and categories.is_active = true
  )
);

drop policy if exists "Admins manage menu items" on public.menu_items;
create policy "Admins manage menu items"
on public.menu_items for all to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- The menu images are public to display quickly through Next/Image. Writes are restricted to admins.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-images', 'menu-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins manage B-Bay menu images" on storage.objects;
create policy "Admins manage B-Bay menu images"
on storage.objects for all to authenticated
using (
  bucket_id = 'menu-images'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
with check (
  bucket_id = 'menu-images'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Demo categories.
insert into public.categories (name, slug, sort_order) values
  ('Пицца', 'pizza', 1),
  ('Бургеры', 'burgers', 2),
  ('Суши', 'sushi', 3),
  ('Роллы', 'rolls', 4),
  ('Салаты', 'salads', 5),
  ('Горячие блюда', 'hot-dishes', 6),
  ('Напитки', 'drinks', 7),
  ('Десерты', 'desserts', 8)
on conflict (slug) do nothing;

-- Demo menu. Images are temporary Unsplash photos; replace them in /admin after uploading to Storage.
insert into public.menu_items (category_id, name, slug, description, composition, price, weight, image_url, is_available, is_popular, is_new, sort_order)
values
  ((select id from public.categories where slug = 'pizza'), 'Маргарита', 'margherita', 'Томатный соус, моцарелла и базилик.', 'Тесто, томатный соус, моцарелла, базилик.', 490, '420 г', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1000&q=82', true, true, false, 1),
  ((select id from public.categories where slug = 'pizza'), 'Пепперони', 'pepperoni', 'Пикантная колбаса и двойная моцарелла.', 'Тесто, соус, моцарелла, пепперони.', 590, '460 г', 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=1000&q=82', true, true, false, 2),
  ((select id from public.categories where slug = 'pizza'), 'BBQ с курицей', 'bbq-chicken', 'Нежная курица, соус BBQ и красный лук.', 'Тесто, курица, соус BBQ, моцарелла, лук.', 620, '470 г', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1000&q=82', true, false, true, 3),
  ((select id from public.categories where slug = 'burgers'), 'Чизбургер', 'cheeseburger', 'Сочная говяжья котлета и сыр чеддер.', 'Булочка бриошь, говядина, чеддер, салат, томат, соус.', 350, '280 г', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=82', true, true, false, 1),
  ((select id from public.categories where slug = 'burgers'), 'Смоки Бургер', 'smoky-burger', 'Говядина, бекон и фирменный дымный соус.', 'Булочка, говядина, бекон, чеддер, лук, соус.', 470, '340 г', 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=82', true, false, true, 2),
  ((select id from public.categories where slug = 'sushi'), 'Суши с лососем', 'salmon-sushi', 'Норвежский лосось на рисе.', 'Рис, лосось, рисовый уксус.', 290, '90 г', 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=1000&q=82', true, false, false, 1),
  ((select id from public.categories where slug = 'sushi'), 'Суши с креветкой', 'shrimp-sushi', 'Сладкая креветка и деликатный рис.', 'Рис, тигровая креветка, рисовый уксус.', 310, '90 г', 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=1000&q=82', true, false, true, 2),
  ((select id from public.categories where slug = 'rolls'), 'Филадельфия', 'philadelphia', 'Лосось, сливочный сыр и огурец.', 'Рис, лосось, сливочный сыр, огурец, нори.', 690, '260 г', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1000&q=82', true, true, false, 1),
  ((select id from public.categories where slug = 'rolls'), 'Калифорния', 'california', 'Краб, авокадо и икра масаго.', 'Рис, краб, авокадо, огурец, масаго.', 520, '240 г', 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=1000&q=82', true, false, false, 2),
  ((select id from public.categories where slug = 'salads'), 'Цезарь с курицей', 'caesar-chicken', 'Хрустящий салат, курица и пармезан.', 'Романо, куриное филе, пармезан, томаты, соус цезарь.', 390, '250 г', 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=1000&q=82', true, true, false, 1),
  ((select id from public.categories where slug = 'salads'), 'Греческий салат', 'greek-salad', 'Свежие овощи, фета и оливки.', 'Томаты, огурцы, перец, фета, оливки, масло.', 320, '230 г', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1000&q=82', true, false, false, 2),
  ((select id from public.categories where slug = 'hot-dishes'), 'Курица терияки', 'chicken-teriyaki', 'Куриное филе с овощами и рисом.', 'Куриное филе, рис, брокколи, перец, соус терияки.', 440, '360 г', 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=1000&q=82', true, false, true, 1),
  ((select id from public.categories where slug = 'hot-dishes'), 'Паста альфредо', 'pasta-alfredo', 'Фетучини в сливочном соусе с курицей.', 'Фетучини, курица, сливки, пармезан, чеснок.', 460, '330 г', 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1000&q=82', true, true, false, 2),
  ((select id from public.categories where slug = 'drinks'), 'Цитрусовый лимонад', 'citrus-lemonade', 'Освежающий лимон, апельсин и мята.', 'Лимон, апельсин, мята, сироп, газированная вода.', 190, '400 мл', 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?auto=format&fit=crop&w=1000&q=82', true, false, false, 1),
  ((select id from public.categories where slug = 'drinks'), 'Капучино', 'cappuccino', 'Двойной эспрессо и нежная молочная пена.', 'Эспрессо, молоко.', 180, '300 мл', 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=1000&q=82', true, true, false, 2),
  ((select id from public.categories where slug = 'desserts'), 'Сан-Себастьян', 'san-sebastian', 'Кремовый чизкейк с карамельной корочкой.', 'Сливочный сыр, сливки, яйца, сахар.', 330, '160 г', 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=1000&q=82', true, false, true, 1),
  ((select id from public.categories where slug = 'desserts'), 'Шоколадный брауни', 'chocolate-brownie', 'Насыщенный шоколадный десерт.', 'Тёмный шоколад, масло, яйца, какао.', 280, '140 г', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1000&q=82', true, false, false, 2)
on conflict (slug) do nothing;

-- Create a user in Authentication → Users, then run this statement (replace the email):
-- update auth.users
-- set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
-- where email = 'admin@example.com';
-- The user must sign out and sign in again to receive a refreshed JWT with the role.
