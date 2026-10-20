# Запуск и обновление lomviko.com

На VPS работают сайт, веб-приложение, две админки и API в Docker; HTTPS выпускает Caddy. Сервер: 185.25.117.161. DNS A-записи lomviko.com, www и поддоменов (app, admin, site-admin, api) указывают на него. Открыты только TCP 80/443 и SSH, внутренние порты 4545–4549 наружу не публикуются.

## Архив

Сначала проверки и push в GitHub. Затем из корня репозитория:

```sh
npm run check
npm run prepare:deployment
```

В `.runtime` появляется архив из чистого коммита и его SHA-256. Локальные данные и ключи в архив не попадают.

## Первый запуск

```sh
mkdir -p /opt/biz
tar -xzf /root/lomviko-COMMIT.tar.gz -C /opt/biz
cd /opt/biz/admin_crm_site/platform
cp deploy/lomviko.env.example deploy/.env
chmod 600 deploy/.env
sh deploy/manage.sh start
```

`.env` задаёт домены; при обновлении существующую `.env` не заменяйте. `manage.sh start` собирает образы, проверяет, что внутренние порты не опубликованы, и запускает сервисы с healthchecks.

Доступ к админкам создаётся на сервере в постоянном томе. Для первого входа на доверенном SSH-терминале:

```sh
cd deploy
docker compose --env-file .env -f compose.yaml -f compose.website.yaml exec orbit node tools/admin-setup.cjs /data --show-credentials
```

Команда показывает настоящие секреты: сохраните их в менеджер паролей, добавьте TOTP в аутентификатор и не отправляйте вывод в чат или Git. Для каждого входа нужен новый код.

После входа в админку продукта настройте SMTP (порт 587 — STARTTLS, 465 — TLS), адреса сайта и API и отправьте тестовое письмо. Без SMTP регистрация с кодом недоступна. Оферту и политики загрузите в админке сайта, раздел «Документи» (отдельно украинская и английская версия).

## Обновление

```sh
sha256sum -c   # сверить архив
docker stop orbit-admin-orbit-1
docker run --rm -v orbit-admin_orbit-data:/data -v /root/backups/prod-ДАТА:/backup alpine tar czf /backup/orbit-data.tgz -C /data .
tar -xzf /root/lomviko-COMMIT.tar.gz -C /opt/biz
cd /opt/biz/admin_crm_site/platform/deploy && sh manage.sh update
```

Бэкап тома перед каждым обновлением обязателен. Админка сайта и админка продукта запускаются из одного образа `lomviko-platform` (переменная `CH_ADMIN_PROFILE`).

## Проверка

```sh
sh deploy/manage.sh status
curl --fail https://api.lomviko.com/healthz
```

## Данные

Базы, ключ API, секрет TOTP и настройки SMTP хранятся в томе `orbit-admin_orbit-data`. Не удаляйте тома и не используйте `down -v`. Храните копии вне VPS и проверяйте восстановление: снимок провайдера не заменяет независимую копию.
