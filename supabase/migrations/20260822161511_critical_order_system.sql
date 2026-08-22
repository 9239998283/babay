-- Critical order-processing foundation for B-Bay / «Бабай».
-- The migration is additive. Existing categories, dishes and storage objects are preserved.

create extension if not exists "pgcrypto";

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- A dish with a zero price cannot be published or ordered.
alter table public.menu_items drop constraint if exists menu_items_price_check;
alter table public.menu_items
  add constraint menu_items_price_check check (price > 0);

create table if not exists public.restaurant_settings (
  id boolean primary key default true check (id),
  establishment_name text not null default 'B-Bay «Бабай»'
    check (char_length(establishment_name) between 2 and 120),
  address text not null default 'Грозный, центр города'
    check (char_length(address) between 2 and 250),
  phone text not null default '+7 988 902-60-14'
    check (char_length(phone) between 5 and 40),
  whatsapp_phone text not null default '79889026014'
    check (whatsapp_phone ~ '^[0-9]{10,15}$'),
  orders_open boolean not null default true,
  opening_hours jsonb not null default '{
    "1":{"enabled":true,"open":"10:00","close":"23:00"},
    "2":{"enabled":true,"open":"10:00","close":"23:00"},
    "3":{"enabled":true,"open":"10:00","close":"23:00"},
    "4":{"enabled":true,"open":"10:00","close":"23:00"},
    "5":{"enabled":true,"open":"10:00","close":"23:00"},
    "6":{"enabled":true,"open":"10:00","close":"23:00"},
    "7":{"enabled":true,"open":"10:00","close":"23:00"}
  }'::jsonb check (jsonb_typeof(opening_hours) = 'object'),
  minimum_order integer not null default 0 check (minimum_order >= 0),
  preparation_minutes integer not null default 30 check (preparation_minutes between 1 and 480),
  delivery_minutes integer not null default 60 check (delivery_minutes between 1 and 720),
  payment_methods text[] not null default array['cash', 'transfer']::text[]
    check (coalesce(array_length(payment_methods, 1), 0) > 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 100),
  description text check (description is null or char_length(description) <= 300),
  fee integer not null default 0 check (fee >= 0),
  minimum_order integer not null default 0 check (minimum_order >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0 check (sort_order between 0 and 9999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promo_codes (
  code text primary key check (code = upper(code) and char_length(code) between 2 and 40),
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value integer not null check (discount_value > 0),
  minimum_order integer not null default 0 check (minimum_order >= 0),
  maximum_discount integer check (maximum_discount is null or maximum_discount > 0),
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  usage_count integer not null default 0 check (usage_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promo_codes_dates_check check (ends_at is null or starts_at is null or ends_at > starts_at),
  constraint promo_codes_percent_check check (discount_type <> 'percent' or discount_value <= 100)
);

create table if not exists public.menu_item_modifiers (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  price_delta integer not null default 0 check (price_delta >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0 check (sort_order between 0 and 9999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (menu_item_id, name)
);

create sequence if not exists public.order_number_seq as bigint start with 1 increment by 1;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  idempotency_key uuid not null unique,
  public_token_hash text not null unique check (public_token_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status_updated_at timestamptz not null default now(),
  customer_name text not null check (char_length(customer_name) between 2 and 80),
  customer_phone text not null check (customer_phone ~ '^\+7[0-9]{10}$'),
  fulfillment_method text not null check (fulfillment_method in ('delivery', 'pickup')),
  delivery_address text check (
    (fulfillment_method = 'delivery' and char_length(coalesce(delivery_address, '')) between 5 and 250)
    or (fulfillment_method = 'pickup' and delivery_address is null)
  ),
  delivery_zone_id uuid references public.delivery_zones(id) on delete set null,
  delivery_zone_name text,
  payment_method text not null check (char_length(payment_method) between 2 and 40),
  promo_code text,
  subtotal integer not null check (subtotal > 0),
  discount_amount integer not null default 0 check (discount_amount >= 0),
  delivery_fee integer not null default 0 check (delivery_fee >= 0),
  total integer not null check (total >= 0),
  order_comment text check (order_comment is null or char_length(order_comment) <= 500),
  status text not null default 'new' check (
    status in ('new', 'confirmed', 'preparing', 'ready', 'courier', 'delivered', 'cancelled')
  ),
  cancelled_reason text check (cancelled_reason is null or char_length(cancelled_reason) <= 300),
  source text not null default 'web' check (source in ('web', 'admin')),
  constraint orders_total_calculation_check check (total = subtotal - discount_amount + delivery_fee),
  constraint orders_discount_check check (discount_amount <= subtotal)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name text not null check (char_length(item_name) between 1 and 120),
  unit_price integer not null check (unit_price > 0),
  quantity integer not null check (quantity between 1 and 99),
  modifiers jsonb not null default '[]'::jsonb check (jsonb_typeof(modifiers) = 'array'),
  modifiers_total integer not null default 0 check (modifiers_total >= 0),
  item_comment text check (item_comment is null or char_length(item_comment) <= 250),
  line_total integer not null check (line_total > 0),
  created_at timestamptz not null default now(),
  constraint order_items_total_check check (line_total = (unit_price + modifiers_total) * quantity)
);

create table if not exists public.order_status_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null check (
    status in ('new', 'confirmed', 'preparing', 'ready', 'courier', 'delivered', 'cancelled')
  ),
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_user_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 2 and 100),
  entity_type text not null check (char_length(entity_type) between 2 and 80),
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create table if not exists private.login_rate_limits (
  key_hash text primary key check (key_hash ~ '^[a-f0-9]{64}$'),
  attempts integer not null default 0 check (attempts >= 0),
  window_started_at timestamptz not null default now(),
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists private.order_rate_limits (
  key_hash text primary key check (key_hash ~ '^[a-f0-9]{64}$'),
  attempts integer not null default 0 check (attempts >= 0),
  window_started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists delivery_zones_active_order_idx
  on public.delivery_zones (is_active, sort_order, name);
create index if not exists promo_codes_active_dates_idx
  on public.promo_codes (is_active, starts_at, ends_at);
create index if not exists menu_item_modifiers_item_active_idx
  on public.menu_item_modifiers (menu_item_id, is_active, sort_order);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_created_at_idx on public.orders (status, created_at desc);
create index if not exists orders_customer_phone_idx on public.orders (customer_phone);
create index if not exists orders_current_idx on public.orders (created_at desc)
  where status not in ('delivered', 'cancelled');
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_menu_item_id_idx on public.order_items (menu_item_id);
create index if not exists order_status_events_order_id_idx
  on public.order_status_events (order_id, created_at desc);
create index if not exists admin_audit_log_created_at_idx on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_admin_idx on public.admin_audit_log (admin_user_id, created_at desc);

insert into public.restaurant_settings (id)
values (true)
on conflict (id) do nothing;

insert into public.delivery_zones (name, description, fee, minimum_order, sort_order)
values ('Грозный', 'Доставка в пределах города. Стоимость можно изменить в админке.', 0, 0, 1)
on conflict (name) do nothing;

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

drop trigger if exists restaurant_settings_set_updated_at on public.restaurant_settings;
create trigger restaurant_settings_set_updated_at
before update on public.restaurant_settings
for each row execute procedure public.set_updated_at();

drop trigger if exists delivery_zones_set_updated_at on public.delivery_zones;
create trigger delivery_zones_set_updated_at
before update on public.delivery_zones
for each row execute procedure public.set_updated_at();

drop trigger if exists promo_codes_set_updated_at on public.promo_codes;
create trigger promo_codes_set_updated_at
before update on public.promo_codes
for each row execute procedure public.set_updated_at();

drop trigger if exists menu_item_modifiers_set_updated_at on public.menu_item_modifiers;
create trigger menu_item_modifiers_set_updated_at
before update on public.menu_item_modifiers
for each row execute procedure public.set_updated_at();

create or replace function private.prepare_order_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  if new.status is distinct from old.status then
    if not (
      (old.status = 'new' and new.status in ('confirmed', 'cancelled'))
      or (old.status = 'confirmed' and new.status in ('preparing', 'cancelled'))
      or (old.status = 'preparing' and new.status in ('ready', 'cancelled'))
      or (old.status = 'ready' and new.status in ('courier', 'delivered', 'cancelled'))
      or (old.status = 'courier' and new.status in ('delivered', 'cancelled'))
    ) then
      raise exception using errcode = '22023', message = 'INVALID_STATUS_TRANSITION';
    end if;
    if new.status = 'cancelled' and char_length(btrim(coalesce(new.cancelled_reason, ''))) < 3 then
      raise exception using errcode = '22023', message = 'CANCEL_REASON_REQUIRED';
    end if;
    if new.status <> 'cancelled' then
      new.cancelled_reason = null;
    end if;
    new.status_updated_at = now();
  end if;
  return new;
end;
$$;

create or replace function private.is_ordering_open(p_settings public.restaurant_settings)
returns boolean
language plpgsql
stable
set search_path = ''
as $$
declare
  v_day integer := extract(isodow from timezone('Europe/Moscow', now()))::integer;
  v_previous_day integer;
  v_time text := to_char(timezone('Europe/Moscow', now()), 'HH24:MI');
  v_today jsonb;
  v_previous jsonb;
begin
  if not p_settings.orders_open then return false; end if;
  v_previous_day := case when v_day = 1 then 7 else v_day - 1 end;
  v_today := p_settings.opening_hours -> v_day::text;
  v_previous := p_settings.opening_hours -> v_previous_day::text;

  return (
    coalesce((v_today ->> 'enabled')::boolean, false)
    and (
      ((v_today ->> 'open') < (v_today ->> 'close') and v_time >= (v_today ->> 'open') and v_time < (v_today ->> 'close'))
      or ((v_today ->> 'open') > (v_today ->> 'close') and v_time >= (v_today ->> 'open'))
      or ((v_today ->> 'open') = (v_today ->> 'close'))
    )
  ) or (
    coalesce((v_previous ->> 'enabled')::boolean, false)
    and (v_previous ->> 'open') > (v_previous ->> 'close')
    and v_time < (v_previous ->> 'close')
  );
end;
$$;

drop trigger if exists orders_prepare_update on public.orders;
create trigger orders_prepare_update
before update on public.orders
for each row execute procedure private.prepare_order_update();

create or replace function private.record_order_status_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_status_events (order_id, status, changed_by)
    values (new.id, new.status, (select auth.uid()));
  end if;
  return new;
end;
$$;

revoke execute on function private.prepare_order_update() from public, anon, authenticated;
revoke execute on function private.record_order_status_event() from public, anon, authenticated;
revoke execute on function private.is_ordering_open(public.restaurant_settings) from public, anon, authenticated;

drop trigger if exists orders_record_status_event on public.orders;
create trigger orders_record_status_event
after insert or update of status on public.orders
for each row execute procedure private.record_order_status_event();

-- Returns validated line snapshots and a server-authoritative calculation.
create or replace function private.calculate_order_pricing(
  p_items jsonb,
  p_fulfillment_method text,
  p_delivery_zone_id uuid,
  p_promo_code text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_input jsonb;
  v_menu record;
  v_item_id uuid;
  v_quantity integer;
  v_modifier_ids uuid[];
  v_modifier_count integer;
  v_modifier_total integer;
  v_modifiers jsonb;
  v_lines jsonb := '[]'::jsonb;
  v_subtotal integer := 0;
  v_line_total integer;
  v_zone_id uuid;
  v_zone_name text;
  v_zone_fee integer;
  v_zone_minimum_order integer;
  v_delivery_fee integer := 0;
  v_minimum_order integer := 0;
  v_settings public.restaurant_settings%rowtype;
  v_promo public.promo_codes%rowtype;
  v_discount integer := 0;
  v_code text := nullif(upper(btrim(coalesce(p_promo_code, ''))), '');
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 100 then
    raise exception using errcode = '22023', message = 'INVALID_ITEMS';
  end if;

  if p_fulfillment_method not in ('delivery', 'pickup') then
    raise exception using errcode = '22023', message = 'INVALID_FULFILLMENT';
  end if;

  select * into v_settings from public.restaurant_settings where id = true;
  if not found then
    raise exception using errcode = '55000', message = 'SETTINGS_MISSING';
  end if;

  for v_input in select value from jsonb_array_elements(p_items)
  loop
    begin
      v_item_id := (v_input ->> 'menuItemId')::uuid;
      v_quantity := (v_input ->> 'quantity')::integer;
      if jsonb_typeof(coalesce(v_input -> 'modifierIds', '[]'::jsonb)) <> 'array' then
        raise exception using errcode = '22023', message = 'INVALID_MODIFIERS';
      end if;
      select coalesce(array_agg(distinct value::uuid), array[]::uuid[])
      into v_modifier_ids
      from jsonb_array_elements_text(coalesce(v_input -> 'modifierIds', '[]'::jsonb));
    exception when others then
      raise exception using errcode = '22023', message = 'INVALID_ITEM_INPUT';
    end;

    if v_quantity < 1 or v_quantity > 99 then
      raise exception using errcode = '22023', message = 'INVALID_QUANTITY';
    end if;
    if char_length(coalesce(v_input ->> 'comment', '')) > 250 then
      raise exception using errcode = '22023', message = 'ITEM_COMMENT_TOO_LONG';
    end if;

    select mi.id, mi.name, mi.price
    into v_menu
    from public.menu_items mi
    join public.categories c on c.id = mi.category_id
    where mi.id = v_item_id
      and mi.is_available = true
      and mi.price > 0
      and c.is_active = true;

    if not found then
      raise exception using errcode = '22023', message = 'ITEM_UNAVAILABLE';
    end if;

    select count(*)::integer,
           coalesce(sum(m.price_delta), 0)::integer,
           coalesce(jsonb_agg(jsonb_build_object(
             'id', m.id,
             'name', m.name,
             'price', m.price_delta
           ) order by m.sort_order, m.name), '[]'::jsonb)
    into v_modifier_count, v_modifier_total, v_modifiers
    from public.menu_item_modifiers m
    where m.menu_item_id = v_item_id
      and m.is_active = true
      and m.id = any(v_modifier_ids);

    if v_modifier_count <> coalesce(array_length(v_modifier_ids, 1), 0) then
      raise exception using errcode = '22023', message = 'MODIFIER_UNAVAILABLE';
    end if;

    v_line_total := (v_menu.price + v_modifier_total) * v_quantity;
    v_subtotal := v_subtotal + v_line_total;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'menuItemId', v_menu.id,
      'name', v_menu.name,
      'unitPrice', v_menu.price,
      'quantity', v_quantity,
      'modifiers', v_modifiers,
      'modifiersTotal', v_modifier_total,
      'comment', nullif(btrim(coalesce(v_input ->> 'comment', '')), ''),
      'lineTotal', v_line_total
    ));
  end loop;

  v_minimum_order := v_settings.minimum_order;
  if p_fulfillment_method = 'delivery' then
    if p_delivery_zone_id is null then
      raise exception using errcode = '22023', message = 'DELIVERY_ZONE_REQUIRED';
    end if;
    select id, name, fee, minimum_order
    into v_zone_id, v_zone_name, v_zone_fee, v_zone_minimum_order
    from public.delivery_zones
    where id = p_delivery_zone_id and is_active = true;
    if not found then
      raise exception using errcode = '22023', message = 'DELIVERY_ZONE_UNAVAILABLE';
    end if;
    v_delivery_fee := v_zone_fee;
    v_minimum_order := greatest(v_minimum_order, v_zone_minimum_order);
  end if;

  if v_subtotal < v_minimum_order then
    raise exception using errcode = '22023', message = 'MINIMUM_ORDER_NOT_MET';
  end if;

  if v_code is not null then
    select * into v_promo
    from public.promo_codes
    where code = v_code
      and is_active = true
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at > now())
      and (usage_limit is null or usage_count < usage_limit);

    if not found or v_subtotal < v_promo.minimum_order then
      raise exception using errcode = '22023', message = 'PROMO_INVALID';
    end if;

    if v_promo.discount_type = 'percent' then
      v_discount := floor(v_subtotal * v_promo.discount_value / 100.0)::integer;
    else
      v_discount := v_promo.discount_value;
    end if;
    if v_promo.maximum_discount is not null then
      v_discount := least(v_discount, v_promo.maximum_discount);
    end if;
    v_discount := least(v_discount, v_subtotal);
  end if;

  return jsonb_build_object(
    'items', v_lines,
    'subtotal', v_subtotal,
    'discountAmount', v_discount,
    'deliveryFee', v_delivery_fee,
    'total', v_subtotal - v_discount + v_delivery_fee,
    'promoCode', v_code,
    'deliveryZoneId', v_zone_id,
    'deliveryZoneName', v_zone_name,
    'minimumOrder', v_minimum_order
  );
end;
$$;

revoke execute on function private.calculate_order_pricing(jsonb, text, uuid, text)
  from public, anon, authenticated;

create or replace function public.quote_order(
  p_items jsonb,
  p_fulfillment_method text,
  p_delivery_zone_id uuid,
  p_promo_code text default null
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.calculate_order_pricing(
    p_items,
    p_fulfillment_method,
    p_delivery_zone_id,
    p_promo_code
  ) - 'items';
$$;

create or replace function public.place_order(
  p_idempotency_key uuid,
  p_public_token_hash text,
  p_customer_name text,
  p_customer_phone text,
  p_fulfillment_method text,
  p_delivery_address text,
  p_delivery_zone_id uuid,
  p_payment_method text,
  p_promo_code text,
  p_order_comment text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_settings public.restaurant_settings%rowtype;
  v_existing public.orders%rowtype;
  v_order public.orders%rowtype;
  v_quote jsonb;
  v_line jsonb;
  v_number text;
  v_name text := btrim(coalesce(p_customer_name, ''));
  v_address text := nullif(btrim(coalesce(p_delivery_address, '')), '');
  v_comment text := nullif(btrim(coalesce(p_order_comment, '')), '');
begin
  if p_public_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception using errcode = '22023', message = 'INVALID_TRACKING_TOKEN';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception using errcode = '22023', message = 'INVALID_CUSTOMER_NAME';
  end if;
  if p_customer_phone !~ '^\+7[0-9]{10}$' then
    raise exception using errcode = '22023', message = 'INVALID_CUSTOMER_PHONE';
  end if;
  if char_length(coalesce(v_comment, '')) > 500 then
    raise exception using errcode = '22023', message = 'ORDER_COMMENT_TOO_LONG';
  end if;
  if p_fulfillment_method = 'delivery' and char_length(coalesce(v_address, '')) < 5 then
    raise exception using errcode = '22023', message = 'DELIVERY_ADDRESS_REQUIRED';
  end if;
  if p_fulfillment_method = 'pickup' then
    v_address := null;
  end if;

  select * into v_existing
  from public.orders
  where idempotency_key = p_idempotency_key;
  if found then
    if v_existing.public_token_hash <> p_public_token_hash then
      raise exception using errcode = '22023', message = 'IDEMPOTENCY_CONFLICT';
    end if;
    return jsonb_build_object(
      'orderNumber', v_existing.order_number,
      'createdAt', v_existing.created_at,
      'status', v_existing.status,
      'subtotal', v_existing.subtotal,
      'discountAmount', v_existing.discount_amount,
      'deliveryFee', v_existing.delivery_fee,
      'total', v_existing.total,
      'duplicate', true
    );
  end if;

  select * into v_settings from public.restaurant_settings where id = true;
  if not found or not private.is_ordering_open(v_settings) then
    raise exception using errcode = '55000', message = 'ORDERS_CLOSED';
  end if;
  if not (p_payment_method = any(v_settings.payment_methods)) then
    raise exception using errcode = '22023', message = 'PAYMENT_METHOD_UNAVAILABLE';
  end if;

  v_quote := private.calculate_order_pricing(
    p_items,
    p_fulfillment_method,
    p_delivery_zone_id,
    p_promo_code
  );
  v_number := 'BB-' || to_char(current_date, 'YYMMDD') || '-' ||
    lpad(nextval('public.order_number_seq')::text, 5, '0');

  insert into public.orders (
    order_number,
    idempotency_key,
    public_token_hash,
    customer_name,
    customer_phone,
    fulfillment_method,
    delivery_address,
    delivery_zone_id,
    delivery_zone_name,
    payment_method,
    promo_code,
    subtotal,
    discount_amount,
    delivery_fee,
    total,
    order_comment
  ) values (
    v_number,
    p_idempotency_key,
    p_public_token_hash,
    v_name,
    p_customer_phone,
    p_fulfillment_method,
    v_address,
    (v_quote ->> 'deliveryZoneId')::uuid,
    v_quote ->> 'deliveryZoneName',
    p_payment_method,
    v_quote ->> 'promoCode',
    (v_quote ->> 'subtotal')::integer,
    (v_quote ->> 'discountAmount')::integer,
    (v_quote ->> 'deliveryFee')::integer,
    (v_quote ->> 'total')::integer,
    v_comment
  ) returning * into v_order;

  for v_line in select value from jsonb_array_elements(v_quote -> 'items')
  loop
    insert into public.order_items (
      order_id,
      menu_item_id,
      item_name,
      unit_price,
      quantity,
      modifiers,
      modifiers_total,
      item_comment,
      line_total
    ) values (
      v_order.id,
      (v_line ->> 'menuItemId')::uuid,
      v_line ->> 'name',
      (v_line ->> 'unitPrice')::integer,
      (v_line ->> 'quantity')::integer,
      v_line -> 'modifiers',
      (v_line ->> 'modifiersTotal')::integer,
      v_line ->> 'comment',
      (v_line ->> 'lineTotal')::integer
    );
  end loop;

  if v_quote ->> 'promoCode' is not null then
    update public.promo_codes
    set usage_count = usage_count + 1
    where code = v_quote ->> 'promoCode'
      and is_active = true
      and (usage_limit is null or usage_count < usage_limit);
    if not found then
      raise exception using errcode = '22023', message = 'PROMO_INVALID';
    end if;
  end if;

  return jsonb_build_object(
    'orderNumber', v_order.order_number,
    'createdAt', v_order.created_at,
    'status', v_order.status,
    'subtotal', v_order.subtotal,
    'discountAmount', v_order.discount_amount,
    'deliveryFee', v_order.delivery_fee,
    'total', v_order.total,
    'duplicate', false
  );
end;
$$;

create or replace function public.get_order_status(
  p_order_number text,
  p_public_token_hash text
)
returns jsonb
language sql
security definer
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'orderNumber', o.order_number,
    'createdAt', o.created_at,
    'updatedAt', o.status_updated_at,
    'status', o.status,
    'fulfillmentMethod', o.fulfillment_method,
    'subtotal', o.subtotal,
    'discountAmount', o.discount_amount,
    'deliveryFee', o.delivery_fee,
    'total', o.total,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', oi.item_name,
        'quantity', oi.quantity,
        'lineTotal', oi.line_total
      ) order by oi.created_at, oi.id)
      from public.order_items oi
      where oi.order_id = o.id
    ), '[]'::jsonb)
  )
  from public.orders o
  where o.order_number = p_order_number
    and o.public_token_hash = p_public_token_hash
    and p_public_token_hash ~ '^[a-f0-9]{64}$';
$$;

-- Database-backed throttling. Callers only know opaque, server-peppered hashes.
create or replace function public.is_login_rate_limited(p_key_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row private.login_rate_limits%rowtype;
begin
  if p_key_hash !~ '^[a-f0-9]{64}$' then
    return true;
  end if;
  select * into v_row from private.login_rate_limits where key_hash = p_key_hash;
  if not found then return false; end if;
  if v_row.blocked_until is not null and v_row.blocked_until > now() then return true; end if;
  return v_row.window_started_at > now() - interval '15 minutes' and v_row.attempts >= 5;
end;
$$;

create or replace function public.record_login_attempt(p_key_hash text, p_success boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_key_hash !~ '^[a-f0-9]{64}$' then return; end if;
  delete from private.login_rate_limits where updated_at < now() - interval '1 day';
  if not exists (select 1 from private.login_rate_limits where key_hash = p_key_hash)
     and (select count(*) from private.login_rate_limits) >= 10000 then
    return;
  end if;
  if p_success then
    -- A public caller must never be able to erase a limiter row. Successful
    -- authentication simply leaves earlier failures to expire naturally.
    return;
  end if;
  insert into private.login_rate_limits (key_hash, attempts)
  values (p_key_hash, 1)
  on conflict (key_hash) do update set
    attempts = case
      when private.login_rate_limits.window_started_at <= now() - interval '15 minutes' then 1
      else private.login_rate_limits.attempts + 1
    end,
    window_started_at = case
      when private.login_rate_limits.window_started_at <= now() - interval '15 minutes' then now()
      else private.login_rate_limits.window_started_at
    end,
    blocked_until = case
      when (
        case
          when private.login_rate_limits.window_started_at <= now() - interval '15 minutes' then 1
          else private.login_rate_limits.attempts + 1
        end
      ) >= 5 then now() + interval '15 minutes'
      else private.login_rate_limits.blocked_until
    end,
    updated_at = now();
end;
$$;

create or replace function public.consume_order_rate_limit(p_key_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempts integer;
begin
  if p_key_hash !~ '^[a-f0-9]{64}$' then return false; end if;
  delete from private.order_rate_limits where updated_at < now() - interval '1 day';
  if not exists (select 1 from private.order_rate_limits where key_hash = p_key_hash)
     and (select count(*) from private.order_rate_limits) >= 10000 then
    return false;
  end if;
  insert into private.order_rate_limits (key_hash, attempts)
  values (p_key_hash, 1)
  on conflict (key_hash) do update set
    attempts = case
      when private.order_rate_limits.window_started_at <= now() - interval '10 minutes' then 1
      else private.order_rate_limits.attempts + 1
    end,
    window_started_at = case
      when private.order_rate_limits.window_started_at <= now() - interval '10 minutes' then now()
      else private.order_rate_limits.window_started_at
    end,
    updated_at = now()
  returning attempts into v_attempts;
  return v_attempts <= 12;
end;
$$;

revoke execute on function public.quote_order(jsonb, text, uuid, text) from public;
revoke execute on function public.place_order(uuid, text, text, text, text, text, uuid, text, text, text, jsonb) from public;
revoke execute on function public.get_order_status(text, text) from public;
revoke execute on function public.is_login_rate_limited(text) from public;
revoke execute on function public.record_login_attempt(text, boolean) from public;
revoke execute on function public.consume_order_rate_limit(text) from public;

grant execute on function public.quote_order(jsonb, text, uuid, text) to anon, authenticated;
grant execute on function public.place_order(uuid, text, text, text, text, text, uuid, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.get_order_status(text, text) to anon, authenticated;
grant execute on function public.is_login_rate_limited(text) to anon, authenticated;
grant execute on function public.record_login_attempt(text, boolean) to anon, authenticated;
grant execute on function public.consume_order_rate_limit(text) to anon, authenticated;

alter table public.restaurant_settings enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.promo_codes enable row level security;
alter table public.menu_item_modifiers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_events enable row level security;
alter table public.admin_audit_log enable row level security;

drop policy if exists "Public read restaurant settings" on public.restaurant_settings;
create policy "Public read restaurant settings"
on public.restaurant_settings for select to anon, authenticated
using (id = true);

drop policy if exists "Admins update restaurant settings" on public.restaurant_settings;
create policy "Admins update restaurant settings"
on public.restaurant_settings for update to authenticated
using ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin')
with check ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin');

drop policy if exists "Public read active delivery zones" on public.delivery_zones;
create policy "Public read active delivery zones"
on public.delivery_zones for select to anon
using (is_active = true);

drop policy if exists "Authenticated read delivery zones" on public.delivery_zones;
create policy "Authenticated read delivery zones"
on public.delivery_zones for select to authenticated
using (is_active = true or (((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin');

drop policy if exists "Admins manage delivery zones" on public.delivery_zones;
create policy "Admins manage delivery zones"
on public.delivery_zones for all to authenticated
using ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin')
with check ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin');

drop policy if exists "Admins manage promo codes" on public.promo_codes;
create policy "Admins manage promo codes"
on public.promo_codes for all to authenticated
using ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin')
with check ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin');

drop policy if exists "Public read active menu modifiers" on public.menu_item_modifiers;
create policy "Public read active menu modifiers"
on public.menu_item_modifiers for select to anon
using (
  is_active = true and exists (
    select 1
    from public.menu_items mi
    join public.categories c on c.id = mi.category_id
    where mi.id = menu_item_modifiers.menu_item_id and c.is_active = true
  )
);

drop policy if exists "Authenticated read menu modifiers" on public.menu_item_modifiers;
create policy "Authenticated read menu modifiers"
on public.menu_item_modifiers for select to authenticated
using (
  is_active = true
  or (((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin'
);

drop policy if exists "Admins manage menu modifiers" on public.menu_item_modifiers;
create policy "Admins manage menu modifiers"
on public.menu_item_modifiers for all to authenticated
using ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin')
with check ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin');

drop policy if exists "Admins read orders" on public.orders;
create policy "Admins read orders"
on public.orders for select to authenticated
using ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin');

drop policy if exists "Admins update orders" on public.orders;
create policy "Admins update orders"
on public.orders for update to authenticated
using ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin')
with check ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin');

drop policy if exists "Admins read order items" on public.order_items;
create policy "Admins read order items"
on public.order_items for select to authenticated
using ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin');

drop policy if exists "Admins read order events" on public.order_status_events;
create policy "Admins read order events"
on public.order_status_events for select to authenticated
using ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin');

drop policy if exists "Admins read audit log" on public.admin_audit_log;
create policy "Admins read audit log"
on public.admin_audit_log for select to authenticated
using ((((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin');

drop policy if exists "Admins append audit log" on public.admin_audit_log;
create policy "Admins append audit log"
on public.admin_audit_log for insert to authenticated
with check (
  (((select auth.jwt()) -> 'app_metadata' ->> 'role')) = 'admin'
  and admin_user_id = (select auth.uid())
);

grant select on public.restaurant_settings, public.delivery_zones, public.menu_item_modifiers
  to anon, authenticated;
grant update on public.restaurant_settings to authenticated;
grant insert, update, delete on public.delivery_zones, public.promo_codes, public.menu_item_modifiers
  to authenticated;
grant select on public.promo_codes, public.orders, public.order_items, public.order_status_events, public.admin_audit_log
  to authenticated;
grant update (status, cancelled_reason) on public.orders to authenticated;
grant insert on public.admin_audit_log to authenticated;
revoke insert, update, delete on public.restaurant_settings, public.delivery_zones, public.promo_codes,
  public.menu_item_modifiers, public.orders, public.order_items, public.order_status_events,
  public.admin_audit_log from anon;
revoke insert, delete on public.orders from authenticated;
revoke insert, update, delete on public.order_items, public.order_status_events from authenticated;
revoke update, delete on public.admin_audit_log from authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end;
$$;
