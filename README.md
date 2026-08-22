# B-Bay («Бабай») — электронное меню и обработка заказов

Next.js-приложение кафе B-Bay: клиентское меню, серверное оформление и отслеживание заказов, а также административная панель для операционной работы.

## Основные возможности

- меню, поиск, категории, карточки блюд, модификаторы и корзина;
- доставка или самовывоз, российская маска телефона и проверка полей рядом с вводом;
- авторитетный расчёт цены в PostgreSQL: клиент не передаёт цены и итог;
- серверные заказы с уникальным номером, idempotency key и закрытым tracking token;
- экран успеха, история ссылок на устройстве и актуальный серверный статус;
- опциональное дублирование уже сохранённого заказа в WhatsApp;
- админ-разделы «Заказы», «Блюда», «Категории», «Настройки», «Аналитика»;
- поиск и фильтры заказов, допустимые переходы статуса, причина отмены, печать и polling;
- быстрый и массовый стоп-лист;
- часы работы, ручное закрытие, зоны/стоимость доставки, минимальный заказ, оплаты и промокоды;
- RLS, серверная проверка администратора, журнал действий, ограничение входа и проверка сигнатуры изображений;
- смена пароля только после повторной авторизации и отзыв других сессий.

## Стек

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Supabase PostgreSQL/Auth/Storage, Zod и Vitest.

## Запуск

Требуется Node.js 22.x.

```bash
npm ci
copy .env.example .env.local
npm run dev
```

Переменные окружения:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_WHATSAPP_PHONE=79990000000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
AUTH_RATE_LIMIT_SECRET=long-random-server-only-value
```

`AUTH_RATE_LIMIT_SECRET` должен быть длинным случайным значением и не должен иметь префикс `NEXT_PUBLIC_`.

## База данных

Для нового проекта сначала примените `supabase/schema.sql`, затем миграции из `supabase/migrations/` в порядке имени. Миграция `20260822161511_critical_order_system.sql` добавляет:

- `restaurant_settings`, `delivery_zones`, `promo_codes`, `menu_item_modifiers`;
- `orders`, `order_items`, `order_status_events`, `admin_audit_log`;
- закрытые rate-limit таблицы в схеме `private`;
- функции `quote_order`, `place_order`, `get_order_status`;
- индексы, ограничения, триггеры, RLS и Realtime для заказов.

Миграция аддитивная: существующие категории, блюда и изображения не удаляются. Цена блюда после неё должна быть строго больше нуля.

## Администратор

Роль должна находиться только в `app_metadata`:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'admin')
where email = 'admin@example.com';
```

После изменения роли пользователь должен войти заново. Административные API дополнительно получают свежего пользователя через Supabase Auth; политики RLS остаются вторым уровнем защиты.

## Проверки

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Тесты покрывают нормализацию и серверную схему заказа, запрет клиентских цен/итогов, скидки, допустимые статусы, административную роль и расписание заведения. SQL-миграцию следует дополнительно выполнять в транзакции на staging/branch перед production.

## Ключевые маршруты

- `/` — меню;
- `/cart` — корзина и оформление;
- `/order/[orderNumber]` — защищённый tracking token статус;
- `/admin` — операционная панель;
- `/admin/orders/[id]/print` — печатная версия;
- `/api/orders/quote`, `/api/orders`, `/api/orders/[orderNumber]/status` — публичный order flow;
- `/api/admin/*` — авторизованные административные действия.
