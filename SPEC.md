# SPEC — Техническая спецификация Fitnes

Связанные документы: `PRD.md` (что делаем), `design.md` (как выглядит), `Tasks.md` (шаги).

## 1. Технологический стек

| Слой | Технология |
|------|-----------|
| Фреймворк | Next.js 15 (App Router), React 19, TypeScript (strict) |
| Стили | Tailwind CSS 4 + CSS-переменные из `design.md` |
| БД | Turso (libSQL, облачный SQLite) |
| ORM | Drizzle ORM + drizzle-kit (миграции) |
| Клиент БД | `@libsql/client` |
| Авторизация | Auth.js (next-auth v5), Credentials provider, JWT-сессии |
| Хэш паролей | `bcryptjs` (или `argon2`) |
| Валидация | zod |
| Формы | react-hook-form + `@hookform/resolvers/zod` |
| Графики | Recharts |
| Анимации | Framer Motion, canvas-confetti |
| Иконки | lucide-react |
| Тема | next-themes |
| Шрифты | `next/font` (Playfair Display, Inter; latin + cyrillic) |
| Тесты | Vitest (юнит), Playwright (e2e) |
| Линт/формат | ESLint, Prettier |
| Хостинг | Vercel |

## 2. Архитектура

```
Браузер ──► Next.js (Vercel)
             ├─ Server Components  (чтение данных, SEO)
             ├─ Server Actions     (мутации: профиль, сессии тренировок)
             ├─ Route Handlers     (/api/auth/*, /api/analytics/*)
             └─ Middleware         (защита маршрутов)
                     │
                     ▼
              Drizzle ORM ──► Turso (libSQL, HTTPS)
```

- Чтение — в серверных компонентах; мутации — Server Actions с zod-валидацией и проверкой сессии.
- Клиентские компоненты только для интерактива (формы, слайдеры, графики, таймер, анимации).

## 3. Структура проекта

```
C:\Fitnes
├─ src/
│  ├─ app/
│  │  ├─ (public)/            лендинг, /login, /register
│  │  ├─ (app)/               защищённая зона с нижней панелью
│  │  │  ├─ page.tsx          главная (категории)
│  │  │  ├─ workouts/         список + фильтры, [id]/ карточка
│  │  │  ├─ workout/[id]/run  прохождение
│  │  │  ├─ analytics/        графики
│  │  │  ├─ achievements/
│  │  │  └─ profile/
│  │  ├─ onboarding/
│  │  ├─ api/auth/[...nextauth]/route.ts
│  │  ├─ layout.tsx, globals.css
│  ├─ components/ui/          Button, Input, Card, Chip, Slider, Modal...
│  ├─ components/             BottomNav, SideNav, CategoryCard, WorkoutCard, charts/*
│  ├─ db/
│  │  ├─ client.ts            createClient(libsql)
│  │  ├─ schema.ts            таблицы Drizzle
│  │  ├─ seed.ts              данные каталога
│  ├─ lib/                    auth.ts, validators.ts, bmi.ts, xp.ts, streak.ts
│  ├─ actions/                server actions
│  ├─ middleware.ts
├─ drizzle/                   миграции
├─ public/exercises/          ролики (webm/mp4) и постеры
├─ .env.local                 секреты (в .gitignore)
├─ drizzle.config.ts
```

## 4. Переменные окружения

```
TURSO_DATABASE_URL=libsql://<db>-<org>.turso.io
TURSO_AUTH_TOKEN=<token>
AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=http://localhost:3000
```
Файл `.env.local` не коммитится; `.env.example` — с пустыми значениями.

## 5. Модель данных (Drizzle / SQLite)

### users
| Поле | Тип | Примечание |
|------|-----|-----------|
| id | text PK | uuid |
| email | text unique not null | lowercase |
| password_hash | text not null | |
| name | text | |
| created_at | integer (timestamp) | |

### profiles
| Поле | Тип | Примечание |
|------|-----|-----------|
| user_id | text PK FK→users | 1:1, cascade |
| sex | text | `male/female/other` |
| birth_year | integer | |
| height_cm | integer | 100–250 |
| weight_kg | real | 30–300 |
| goal | text | `lose_weight / gain_weight / build_muscle` |
| focus_muscle | text null | при `build_muscle` |
| place | text | `gym / home / both` |
| level | text | `beginner / intermediate / advanced` |
| weekly_target | integer | 1–7 |
| xp | integer default 0 | |
| theme | text | `system/light/dark` |

### weight_logs
`id`, `user_id` FK, `weight_kg` real, `logged_at` integer. Индекс `(user_id, logged_at)`.

### exercises
`id`, `slug` unique, `name`, `description`, `muscle_group` (`chest/back/legs/shoulders/arms/abs/glutes/full_body`), `equipment` (`none/dumbbells/barbell/machine/bands`), `place` (`gym/home/both`), `video_url`, `poster_url`, `difficulty`, `tips`.

### workouts
`id`, `slug` unique, `title`, `description`, `place` (`gym/home`), `goal` (`lose_weight/gain_weight/build_muscle`), `target_muscle` null, `level`, `duration_min`, `cover_url`, `xp_reward`.
Индексы: `(place, goal)`, `(target_muscle)`.

### workout_exercises
`id`, `workout_id` FK, `exercise_id` FK, `position`, `sets`, `reps` (или `duration_sec`), `rest_sec`, `suggested_weight_kg` null.

### workout_sessions
`id`, `user_id` FK, `workout_id` FK, `started_at`, `finished_at` null, `duration_sec`, `xp_earned`, `total_volume_kg`. Индекс `(user_id, started_at)`.

### session_sets
`id`, `session_id` FK, `exercise_id` FK, `set_number`, `reps`, `weight_kg` null, `completed` boolean.

### achievements
`id`, `code` unique, `title`, `description`, `icon`, `xp_bonus`.

### user_achievements
`user_id`, `achievement_id`, `unlocked_at`; PK `(user_id, achievement_id)`.

### Правила целостности
- Все FK с `ON DELETE CASCADE` для данных пользователя (удаление аккаунта удаляет всё).
- Даты в UTC (Unix seconds), отображение — в часовом поясе клиента.

## 6. Авторизация

1. `POST /register` (Server Action): zod (email, пароль ≥ 8 симв., буква+цифра) → проверка уникальности → bcrypt (cost 12) → создание `users` + пустого `profiles` → автоматический вход.
2. `Credentials.authorize`: поиск по email, `bcrypt.compare`, возврат `{id, email, name}`. Одинаковая ошибка для «нет пользователя» и «неверный пароль».
3. Сессии: JWT в httpOnly, Secure, SameSite=Lax cookie; `session.user.id` пробрасывается через callbacks.
4. `middleware.ts`: неавторизованных редиректит на `/login`; авторизованных без заполненного профиля — на `/onboarding`.
5. Rate limit: ≤ 5 неудачных входов/мин на IP+email (in-memory/Upstash на проде).

## 7. Логика рекомендаций

Рекомендованные тренировки = фильтр по `place` (из профиля; `both` → любые) + `goal` + `level` (± один уровень), для `build_muscle` — `target_muscle = focus_muscle`. Сортировка: совпадение уровня → ещё не проходилась → `xp_reward`.

Рекомендуемая цель по ИМТ (справочно): ИМТ = вес / (рост м)². < 18.5 → подсказка «набор веса», ≥ 25 → «сброс веса»; решение всегда за пользователем.

## 8. Аналитика (агрегаты)

| Метрика | Источник | Запрос |
|---------|----------|--------|
| Вес по времени | `weight_logs` | выборка по периоду, сортировка по дате |
| Объём по неделям | `workout_sessions.total_volume_kg` | GROUP BY неделя |
| Тренировок в неделю | `workout_sessions` (finished) | COUNT GROUP BY неделя |
| Части тела | `session_sets` ⨝ `exercises` | COUNT GROUP BY muscle_group |
| Рекорды | `session_sets` | MAX(weight_kg) по упражнению |

Эндпоинт `GET /api/analytics?range=7d|30d|90d|1y` → JSON; проверка сессии; кэш на клиенте (SWR / React cache).

## 9. Геймификация

- **XP:** `workout.xp_reward` + бонус 10% за завершение всех подходов.
- **Уровень:** `level = floor(sqrt(xp / 100)) + 1`.
- **Серия:** подряд идущие календарные дни (в TZ пользователя) с ≥ 1 завершённой тренировкой; пересчёт при завершении сессии.
- **Достижения (MVP):** `first_workout`, `streak_3`, `streak_7`, `workouts_10`, `workouts_50`, `lost_1kg`, `all_muscles` — проверка после завершения сессии/записи веса в Server Action.

## 10. Server Actions (контракты)

| Action | Вход | Результат |
|--------|------|-----------|
| `registerUser` | email, password, name | redirect `/onboarding` |
| `saveProfile` | zod ProfileInput | обновляет `profiles`, пишет `weight_logs` при смене веса |
| `logWeight` | weight_kg | запись + проверка достижений |
| `startSession` | workout_id | создаёт `workout_sessions`, возвращает id |
| `saveSet` | session_id, exercise_id, set_number, reps, weight | upsert `session_sets` |
| `finishSession` | session_id | считает объём/XP/серию, достижения, возвращает сводку |
| `deleteAccount` | — | каскадное удаление |

Все: проверка `auth()`, zod-валидация, проверка владения ресурсом (`session.user_id === auth.user.id`).

## 11. UI-контракты

- Реализация по `design.md`: токены, шрифты, 8/12px радиусы, нижняя панель из 5 вкладок.
- Ролики: `<video muted loop playsInline autoPlay preload="none" poster>`, ленивая подгрузка через IntersectionObserver.
- Графики: общий компонент `GradientLineChart` (Recharts `AreaChart` + `linearGradient`).
- Анимации: пресеты в `lib/motion.ts`; учитывается `useReducedMotion()`.

## 12. Безопасность

- Параметризованные запросы (Drizzle) — без SQL-инъекций.
- Секреты только в env; токен Turso с минимальными правами.
- Заголовки безопасности (CSP, X-Frame-Options, Referrer-Policy) в `next.config`.
- Валидация серверная (клиентской недостаточно).
- Диапазоны биометрики (рост 100–250, вес 30–300) на сервере.
- Логи без паролей и токенов.

## 13. Тестирование

- **Юнит (Vitest):** ИМТ, XP/уровень, серия, рекомендации, zod-схемы.
- **Интеграционные:** Server Actions на тестовой БД (локальный файл libSQL).
- **E2E (Playwright):** регистрация → онбординг → выбор тренировки → прохождение → график.
- **Ручные:** обе темы, 375/768/1280px, `prefers-reduced-motion`, Lighthouse.

## 14. Деплой

1. Turso: создать БД (`turso db create fitnes`), получить URL и токен.
2. `drizzle-kit push/migrate` на Turso.
3. `seed` — наполнить каталог.
4. Vercel: подключить репозиторий, задать env, деплой.
5. Проверка: регистрация, вход, сохранение тренировки на проде.

## 14.1 Локализация (RU/EN)

- Без префиксов в URL: язык хранится в cookie `NEXT_LOCALE`, по умолчанию — Accept-Language, иначе `ru`.
- Словари: `src/i18n/messages/ru.ts` (источник типов) и `en.ts` (обязан совпадать по структуре). Серверный `getT()`, клиентский `useT()` через `I18nProvider`.
- Валидация zod — фабрики `makeLoginSchema(t)` / `makeRegisterSchema(t)`; сообщения Server Actions тоже через `t`.
- Контент каталога: колонки `name_en`, `tips_en` (exercises), `title_en`, `description_en` (workouts); выбор через `localized(locale, ru, en)`. Seed: `seed-en.ts`.
- Новые тексты интерфейса добавляются в оба словаря (TypeScript не даст забыть ключ).

## 14.2 Питание и ИИ-помощник

**Таблицы:** `foods` (slug, name, name_en, category, kcal/protein/fat/carbs на 100 г, serving_g), `meal_logs` (user_id, day, meal, food_id, grams), `water_logs` (user_id+day → ml), `chat_messages` (user_id, role, content, on_topic).

**Расчёт (`lib/nutrition.ts`):** BMR по Миффлину — Сан-Жеору; TDEE = BMR × коэффициент активности (по тренировкам в неделю: ≤2 → 1.375, ≤4 → 1.55, ≤6 → 1.725, 7 → 1.9); цель: сброс = TDEE×0.8 (минимум 1200/1500 ккал, до 18 лет без дефицита), набор = ×1.15, масса = ×1.08; белок 1.8–2.0 г/кг, жиры 27% ккал, остальное — углеводы; вода 35 мл/кг (1.5–4 л); приёмы пищи 25/35/25/15%. Меню: шаблоны по цели × приём пищи, овощи — фиксированные порции, остальное добирает калории.

**ИИ-помощник:** `POST /api/coach` → `lib/coach-server.ts`. Модель `claude-opus-5-5`, `output_config.effort = "low"`, структурированный ответ `{on_topic, reply}` (JSON schema). При `on_topic=false` текст модели не используется, пользователь видит фиксированный отказ (RU/EN), пара «вопрос — отказ» не попадает в контекст дальше. Включены серверные `fallbacks: "default"` (beta `server-side-fallback-2026-07-01`). Защита: сессия, проверка Origin, ≤1000 символов, 20 сообщений / 10 минут на пользователя, история ≤12 сообщений. В запрос уходят только цель, уровень, место, пол, возраст, рост, вес и суточные цели — без имени и email. Переменная окружения: `ANTHROPIC_API_KEY`. Затраты: платный внешний сервис — следите за расходом в консоли Anthropic.

## 15. Нефункциональные цели

- LCP ≤ 2.5с, CLS ≤ 0.1, TTI ≤ 3.5с на 4G.
- Бандл первой загрузки ≤ 200 КБ JS (gzip) на главной.
- Доступность: Lighthouse A11y ≥ 95.
