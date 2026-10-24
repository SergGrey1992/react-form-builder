# Публикация

## npm

Публичный пакет: `@serggrey1992/react-form-builder`.

```sh
npm ci
npm run check
npm run test:consumer
npm publish --dry-run --access public
npm publish --access public --auth-type=web
```

npm может потребовать подтверждение 2FA в браузере. Не сохраняйте токены/OTP в репозитории. Новая публикация может некоторое время обрабатываться npm; проверяйте наличие версии через `npm view` перед установкой в примеры. Повторно публиковать существующую версию нельзя.

## Vercel

Деплоится `examples/nextjs`, а не корень npm-библиотеки. Framework: Next.js; Node: 24.x; install: `npm ci`; build: `npm run build`.

У примера должна быть обычная registry-зависимость на опубликованную версию библиотеки. `.vercel/` и `.env*` остаются локальными и исключены из Git/загрузки.

```sh
cd examples/nextjs
vercel project inspect --non-interactive
vercel deploy --prod --yes
```

Проверяйте owner/project перед деплоем. Этот проект: `react-form-builder` в `sergs-projects-11e29d8f`. Общий Vercel MCP endpoint: `https://mcp.vercel.com`; авторизация MCP и CLI независимы, доступ команды MCP подтверждается отдельно. Не добавляйте секреты Vercel в GitHub или исходники.

## Релиз 0.1.0 — 24 октября 2026

- npm: https://www.npmjs.com/package/@serggrey1992/react-form-builder
- Production: https://react-form-builder-bay.vercel.app
- Vercel project: `prj_QRuVGWKn3XloUzd43SAZlMXYJrJP`; team: `team_letFtgOOzNO7OZGStymazED1`.
- Deployment: `dpl_7ZZyL11cAwav3JXZy7cxnpcf5vRF`, target production, READY.
- Оба примера закреплены на registry-версии `0.1.0`, без зависимости от локального tgz.
- Проверены публичный HTTP 200, SSR-разметка, TypeScript, 11 тестов Next.js и сборки Next.js/Vite.
- CLI 65.2.0 авторизован; плагин Vercel установлен; общий MCP `https://mcp.vercel.com` авторизован с доступом команды. Проверены документационный поиск и чтение проекта через MCP.
- Production-секреты не скачивались. Использована удалённая сборка Vercel.
