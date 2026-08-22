-- Follow-up from Supabase performance advisors after the critical order migration.

create index if not exists orders_delivery_zone_id_idx on public.orders (delivery_zone_id);
create index if not exists order_status_events_changed_by_idx on public.order_status_events (changed_by);
create index if not exists restaurant_settings_updated_by_idx on public.restaurant_settings (updated_by);

-- Split ALL policies so authenticated SELECT has one permissive policy per table.
drop policy if exists "Admins manage delivery zones" on public.delivery_zones;
drop policy if exists "Admins insert delivery zones" on public.delivery_zones;
create policy "Admins insert delivery zones"
on public.delivery_zones for insert to authenticated
with check ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin');
drop policy if exists "Admins update delivery zones" on public.delivery_zones;
create policy "Admins update delivery zones"
on public.delivery_zones for update to authenticated
using ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin')
with check ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin');
drop policy if exists "Admins delete delivery zones" on public.delivery_zones;
create policy "Admins delete delivery zones"
on public.delivery_zones for delete to authenticated
using ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin');

drop policy if exists "Admins manage menu modifiers" on public.menu_item_modifiers;
drop policy if exists "Admins insert menu modifiers" on public.menu_item_modifiers;
create policy "Admins insert menu modifiers"
on public.menu_item_modifiers for insert to authenticated
with check ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin');
drop policy if exists "Admins update menu modifiers" on public.menu_item_modifiers;
create policy "Admins update menu modifiers"
on public.menu_item_modifiers for update to authenticated
using ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin')
with check ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin');
drop policy if exists "Admins delete menu modifiers" on public.menu_item_modifiers;
create policy "Admins delete menu modifiers"
on public.menu_item_modifiers for delete to authenticated
using ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin');

comment on function public.quote_order(jsonb, text, uuid, text) is
  'Intentional anonymous SECURITY DEFINER boundary: validates identifiers and returns price totals only.';
comment on function public.place_order(uuid, text, text, text, text, text, uuid, text, text, text, jsonb) is
  'Intentional anonymous SECURITY DEFINER boundary: validates all input and calculates authoritative prices.';
comment on function public.get_order_status(text, text) is
  'Intentional anonymous SECURITY DEFINER boundary: requires a 256-bit token hash and returns a limited DTO.';
