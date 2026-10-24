# Проверка версии 0.1.0

Проверено 24 октября 2026.

- `npm run check`: strict TypeScript (включая негативные type tests), ESLint, Vitest/RTL и ESM/declarations build.
- Отдельная установка React 18.3.1 + @types/react 18: тот же набор проверок. Основная установка: React 19.
- `npm run test:consumer`: npm pack, установка в чистый каталог, NodeNext TypeScript consumer, ESM import и проверка use client/peer dependencies.
- `examples/vite`: TypeScript + production build; браузерная проверка async login, блокировки кнопки, регистрации со слотами, вложенного address.city и числового custom control.
- `examples/nextjs`: Next.js App Router production build со статической предгенерацией `/`; браузерная проверка гидратации, Ant Design input/checkbox и async submit, восстановление черновика через опубликованный persistence/local.
- Независимое ревью: два important дефекта (ref cleanup React19, обязательность props) исправлены с регрессионными тестами; critical/minor не обнаружены.

Ожидаемые диагностические тесты намеренно вызывают ошибки для отсутствующего адаптера, неизвестных/дублированных слотов и повторной конфигурации. React18 выводит эти ожидаемые ошибки в stderr; позитивные сценарии проверены отдельно без controlled/uncontrolled warnings.

Vite сообщает MODULE_LEVEL_DIRECTIVE для `use client`, который в клиентском SPA не нужен. Пакет сохраняет директиву через banner tsdown; Next production build подтверждает работоспособность SSR.

Решения: один публичный пакет; RHF >=7.66; фабрика + defineFields для точных Slot типов; нативные useFieldArray в приложении; без автоматического array renderer в v0.1. Публичный JSX `.Slot` без defineFields проверяет имена только runtime. Generic/overloaded UI компоненты могут потребовать типизированной обёртки.
