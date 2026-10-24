# React Form Builder

Один ESM пакет, React 18/19, RHF 7.66+, strict TypeScript. Native useForm — единственный источник состояния.

## Архитектура

- defineField: вывод props из компонента, bind возвращает защищённые bindings.
- createFormAdapter: реестр полей, отдельные renderWrapper/renderSubmit контракты.
- createFormBuilder({adapter}): типизированный Builder, Provider и defineFields<T>().
- defineFields<T>()(fields) возвращает Form с захваченными literal names; Form.Slot проверяет наличие в конфигурации и props конкретного вида. Прямой Builder выводит T из form, но его Slot знает только реестр: документировать ограничения JSX.
- Context содержит только runtime; ближайший Provider и локальный adapter override имеют приоритет.
- Один useController на смонтированный слот; дубликаты диагностируются эффектом с очисткой для StrictMode.
- HTML form, FormProvider, handleSubmit, transformed output, async lock и useFormState для submit.
- loading блокирует fieldset и submit, aria-busy, не меняет значения и регистрацию RHF.
- useId, label, descriptions, alert и ARIA merge. bind должен направить id/ref/ARIA к реальному input.
- Ядро не содержит UI kit, persistence, схем удалённого JSON, layout engine и автоматического array renderer.

## Альтернативы

Context без фабрики не переносит TS generics. Глобальная module augmentation ограничивает несколько UI kit. Выбрана фабрика и конфигурация формы, поскольку они сохраняют локальную типизацию без singleton.

## Проверка

Runtime RTL: bindings, overrides, provider, errors, submit, RHF lifecycle, StrictMode, slots, SSR/hydration. Компилятор: негативные @ts-expect-error, nested paths, slot props, transformed output. Собрать пакет и Vite/Next приложения. Публикация npm и создание удалённого GitHub repo — отдельные действия; локальный новый git repo входит в задачу.
