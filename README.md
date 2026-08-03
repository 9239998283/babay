# B-Bay («Бабай») — электронное меню кафе

Лёгкое мобильное приложение на Next.js для выбора блюд и отправки заказа в WhatsApp. В первой версии нет онлайн-оплаты: сотрудник кафе вручную подтверждает заказ в WhatsApp.

## Что реализовано

- адаптивное меню с поиском, категориями, блоками «Популярное» и «Новинки»;
- подробная карточка блюда с составом, количеством, опциями и комментарием;
- корзина в `localStorage`, которая сохраняется после обновления;
- оформление доставки или самовывоза с проверкой формы через Zod;
- формирование готового сообщения и безопасная ссылка WhatsApp с `encodeURIComponent`;
- `/admin` и `/login` для администратора Supabase Auth;
- CRUD категорий и блюд, порядок, доступность, популярность/новинка и загрузка фото в Supabase Storage;
- SQL-схема с индексами, RLS и 17 демонстрационными блюдами;
- SEO-метаданные, JSON-LD `Restaurant`, favicon и Open Graph-обложка.

## Стек

Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Supabase (PostgreSQL, Auth, Storage), Zod и Lucide React.

## Локальный запуск

Требуется Node.js 20.9 или новее.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000). Пока переменные Supabase не заполнены, приложение работает с демонстрационным меню и локальными изображениями-заглушками — это удобно для быстрой проверки интерфейса.

Для проверки production-сборки:

```bash
npm run build
npm run start
```

## Настройка Supabase

1. Создайте проект в [Supabase](https://supabase.com/dashboard).
2. Откройте **Connect** в проекте и скопируйте Project URL и Publishable key.
3. В `.env.local` заполните:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   NEXT_PUBLIC_WHATSAPP_PHONE=79990000000
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. Откройте **SQL Editor** → **New query**, вставьте содержимое [supabase/schema.sql](supabase/schema.sql) и выполните его. Скрипт создаёт таблицы `categories` и `menu_items`, индексы, RLS-политики, public bucket `menu-images` и демо-данные.
5. В **Authentication → URL Configuration** добавьте адрес локального приложения в `Site URL` и `Redirect URLs` (например, `http://localhost:3000`). На Vercel добавьте и production URL.

Используется новый пакет `@supabase/ssr` и cookies для серверной проверки сессии. Public key допустимо передавать в браузер, но **никогда не добавляйте Service Role key** в `.env.local` с префиксом `NEXT_PUBLIC_`.

## Создание администратора

1. В Supabase откройте **Authentication → Users** и создайте пользователя с email и паролем.
2. В SQL Editor выполните, заменив email:

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
     || jsonb_build_object('role', 'admin')
   where email = 'admin@example.com';
   ```

3. Выйдите и войдите заново на `/login`, затем откройте `/admin`.

Роль хранится в `app_metadata`, а не в редактируемом `user_metadata`; RLS разрешает записи и загрузку файлов только пользователям с `app_metadata.role = admin`.

## WhatsApp

Измените `NEXT_PUBLIC_WHATSAPP_PHONE` в `.env.local` и перезапустите dev-сервер. Номер указывается только цифрами, с кодом страны и без `+`, например `79990000000`.

Кнопка оформления открывает ссылку вида `https://wa.me/НОМЕР?text=...`. Корзина не очищается автоматически; после реальной отправки пользователь нажимает отдельную кнопку «Заказ отправлен — очистить корзину».

## Деплой на Vercel

1. Загрузите репозиторий в GitHub/GitLab/Bitbucket и импортируйте его в [Vercel](https://vercel.com/new).
2. Framework preset оставьте **Next.js**. Команда build — `npm run build`.
3. В **Settings → Environment Variables** добавьте все четыре значения из `.env.example`, заменив `NEXT_PUBLIC_SITE_URL` на production-домен Vercel.
4. В Supabase добавьте production URL в **Authentication → URL Configuration**.
5. Выполните деплой. После первой публикации проверьте `/`, `/cart`, `/checkout`, `/login` и `/admin`.

## Публикация в GitHub

В проект уже добавлен workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml): GitHub Actions запускает линтер, проверку TypeScript и production-сборку для каждого pull request и push в `main`.

Перед первым коммитом укажите свои данные Git (делается один раз на компьютере):

```bash
git config --global user.name "Ваше имя"
git config --global user.email "you@example.com"
```

Затем создайте пустой репозиторий на GitHub без README, `.gitignore` и license, и выполните в папке проекта:

```bash
git add .
git commit -m "Initial B-Bay menu application"
git remote add origin https://github.com/<ваш-аккаунт>/b-bay-menu.git
git push -u origin main
```

`.env.local`, Supabase-ключи, `node_modules`, `.next` и локальные build-файлы защищены `.gitignore`. Файл `.env.example` намеренно публикуется как безопасный шаблон переменных окружения.

## Структура

```text
src/
├── app/              # маршруты App Router
├── components/       # menu, cart, checkout, admin и ui
├── data/             # безопасный demo fallback
├── hooks/            # место для будущих хуков
├── lib/              # Supabase, Zod, форматирование, WhatsApp
├── store/            # корзина и localStorage
└── types/            # типы домена
supabase/schema.sql   # БД, Storage, RLS и seed
```

## Проверочный сценарий

1. Добавьте блюдо быстрым плюсом и через окно деталей с опциями.
2. Перейдите в корзину, измените количество, обновите страницу и убедитесь, что позиции остались.
3. Перейдите к оформлению, выберите доставку и заполните поля.
4. Нажмите «Оформить через WhatsApp» и проверьте текст перед отправкой.
5. После выполнения SQL войдите администратором, создайте/измените блюдо и загрузите фото.

## Важные файлы

- [Переменные окружения](.env.example)
- [Схема Supabase](supabase/schema.sql)
- [WhatsApp-форматтер](src/lib/whatsapp.ts)
- [Административная панель](src/app/admin/page.tsx)
