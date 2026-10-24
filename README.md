# @serggrey1992/react-form-builder

Универсальный code-first конструктор React-форм поверх **React Hook Form**. Один раз подключите компоненты UI Kit, затем описывайте поля в TSX. Простые формы создаются автоматически; сложные используют именованные слоты и обычный JSX.

Ядро не зависит от UI Kit, CSS-фреймворка и библиотеки валидации. Единственный источник состояния — переданный экземпляр `useForm`.

## Установка

```sh
npm install @serggrey1992/react-form-builder react-hook-form
```

React 18.2+/19, React Hook Form >=7.66 <8. Пакет ESM, с TypeScript declarations. До публикации используйте `npm pack` и устанавливайте полученный архив.

## Быстрый старт и свой UI Kit

```tsx
import { forwardRef } from 'react';
import type { ComponentProps } from 'react';
import { useForm } from 'react-hook-form';
import {
  createFormAdapter,
  createFormBuilder,
  defineField,
} from '@serggrey1992/react-form-builder';

const Input = forwardRef<HTMLInputElement, ComponentProps<'input'>>((props, ref) => (
  <input {...props} ref={ref} />
));

// Создайте kit один раз в модуле приложения.
const adapter = createFormAdapter({
  fields: {
    text: defineField({
      component: Input,
      bind: ({ field, controlProps }) => ({
        ...controlProps,
        ...field,
        value: String(field.value ?? ''),
      }),
    }),
    password: defineField({
      component: Input,
      defaults: { type: 'password' },
      bind: ({ field, controlProps }) => ({
        ...controlProps,
        ...field,
        value: String(field.value ?? ''),
      }),
    }),
  },
});
export const kit = createFormBuilder({ adapter });

type LoginValues = { email: string; password: string };
const login = kit.defineFields<LoginValues>()([
  {
    name: 'email',
    type: 'text',
    label: 'Email',
    rules: { required: 'Введите email' },
    props: { type: 'email', autoComplete: 'email', 'data-testid': 'email' },
  },
  {
    name: 'password',
    type: 'password',
    label: 'Пароль',
    props: { autoComplete: 'current-password' },
  },
]);

export function LoginForm() {
  const form = useForm<LoginValues>({ defaultValues: { email: '', password: '' } });
  return (
    <login.Form
      form={form}
      submit="Войти"
      onSubmit={async (values) => {
        console.log(values);
      }}
    />
  );
}
```

Встроенная кнопка **опциональна**: по умолчанию `submit={false}`. Автоматическая сетка использует `auto-fit` и размер контейнера, без фиксированных breakpoint. Значения хранятся в RHF и не зависят от сетки.

## Provider и локальные настройки

Фабрика обеспечивает типы и fallback-адаптер. `<kit.Provider>` задаёт runtime-настройки всему поддереву. Вложенный Provider объединяет реестры с ближайшим родителем. Порядок: адаптер фабрики → Provider → локальный `adapter` формы.

```tsx
<kit.Provider>
  <LoginForm />
</kit.Provider>
```

Также доступны `FormBuilderProvider` и `FormBuilder` без фабрики. Для них нужен адаптер в Provider либо prop. React Context **не передаёт generic-типы JSX**. Используйте фабрику для типизации UI props и `defineFields<Values>()` для проверки конкретных слотов. Не создавайте фабрики внутри render: это изменит идентичность компонентов.

```tsx
<login.Form form={form} adapter={{ fields: { text: alternateTextDefinition } }} />
```

Локальный override сохраняет публичный контракт props исходного типа поля; новый контракт требует нового kit.

## Именованные Slot

```tsx
<login.Form form={form} onSubmit={save}>
  <section className="your-grid">
    <login.Form.Slot name="email" props={{ placeholder: 'Рабочая почта' }} />
    <div>
      <login.Form.Slot name="password" />
    </div>
  </section>
  <login.Form.Submit>Сохранить</login.Form.Submit>
</login.Form>
```

Если `children === undefined`, поля рендерятся автоматически. Любые переданные `children`, включая `null`, включают ручную компоновку: поля появляются только в слотах. При ручной компоновке используйте собственную кнопку либо `Form.Submit`; prop `submit` применяется только к автоматической форме.

`login.Form.Slot` проверяет наличие имени в **конкретной конфигурации**, nested `FieldPath` и props её типа компонента. `kit.FormBuilder` выводит значения из `form`, но его статический `.Slot` имеет только runtime-проверку: он не наследует generic родителя. Неизвестные слоты и повторное размещение поля вызывают понятную ошибку. Дубликаты проверяются при commit эффекта, включая StrictMode; SSR не исполняет эффекты.

## Props, обработчики и оболочки

Props выводятся из реального компонента. Сохраняются literal unions, ARIA и `data-*`. Приоритет: результат `bind` → Slot → field → adapter defaults. `name`, `value`, `checked`, `defaultValue`, `defaultChecked` запрещены в конфигурации props; задавайте значения через RHF.

Совпадающие callback props из `bind` и пользователя выполняются последовательно: сначала RHF binding, затем пользовательский callback. Slot callback заменяет callback поля. Нестандартные `onValueChange` работают по тем же правилам. Ref передаётся адаптером и объединяется с пользовательским ref. `aria-describedby` объединяет уникальные ID. Control `className` заменяется более приоритетным; wrapper `className` поля и слота объединяются через пробел.

`wrapperProps` по умолчанию типизированы как HTML div props. Для UI Kit можно независимо задать контракт оболочки:

```tsx
import type { WrapperContext } from '@serggrey1992/react-form-builder';
const adapter = createFormAdapter({
  fields: { text },
  renderWrapper: (ctx: WrapperContext<{ tone?: 'quiet' | 'loud' }>) => (
    <section data-tone={ctx.wrapperProps.tone}>{ctx.children}</section>
  ),
});
```

Собственная оболочка отвечает за label, описание и ошибки по переданным ID. `renderSubmit` получает HTML button props плюс `loading`; адаптируйте их к API UI Kit (например, Ant Design `htmlType="submit"`), не передавайте `loading` в DOM. Пример полного Ant Design адаптера: [examples/nextjs/app/kit.tsx](examples/nextjs/app/kit.tsx).

## Кастомный render

```tsx
<login.Form.Slot name="email">
  {({ field, fieldState, formState, controlProps }) => (
    <input {...controlProps} {...field} aria-invalid={fieldState.invalid} />
  )}
</login.Form.Slot>
```

Контроллер уже создан слотом: не вызывайте второй `useController` и не делайте дополнительный `register`. Здесь `field.value` имеет тип конкретного RHF пути. В общем адаптере значение имеет `unknown`, поскольку один адаптер используется с разными моделями; нормализация — ответственность адаптера.

## React Hook Form, вложенность и условия

Обычные `reset`, `setValue`, `setError`, `useWatch`, `useFormContext`, resolver и async defaultValues работают с тем же экземпляром RHF. FormBuilder предоставляет `FormProvider`; его не нужно дублировать.

`address.city` и `contacts.0.name` проверяются стандартным `FieldPath<T>`. Условия выражаются React-кодом и `useWatch`; меняйте `fields` либо наличие слотов. Значения скрытых полей сохраняются по стандартной политике RHF, а `shouldUnregister` можно задать в `useForm` или конфигурации поля.

Для массивов используйте нативный `useFieldArray` в приложении и `field.id` как React key. При перестановках избегайте `shouldUnregister`, как рекомендует RHF. Массивы примитивов вроде `string[]` не объявляются готовым сценарием `useFieldArray`. Автоматические array nodes оставлены для будущего API; подробнее [docs/arrays.md](docs/arrays.md).

## Zod и transformed values

```tsx
const schema = z.object({ age: z.string().transform(Number) });
const form = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: { age: '' },
});
// onSubmit получает z.output, поля используют z.input.
```

`rules` используют контракт `useController`. `required` управляет отображением/ARIA; для валидации задавайте `rules.required` или resolver.

## Submit, loading и ошибки

FormBuilder вызывает `form.handleSubmit(onSubmit, onInvalid)`, поддерживает Promise и блокирует конкурентную отправку немедленно, ещё до завершения асинхронной валидации. `Form.Submit` подписывается на `isSubmitting` и блокирует кнопку. Исключения не подавляются: приложение обрабатывает ошибки API внутри `onSubmit`, например через `setError('root', ...)`. Error boundaries не ловят ошибки асинхронных обработчиков.

`loading` оставляет поля смонтированными, выставляет `aria-busy`, блокирует HTML fieldset и submit. Оно не вызывает `reset`, `unregister` или `setValue`, не меняет флаг RHF disabled и не удаляет значения из payload. Для portal-based компонентов адаптер получает disabled в field и controlProps; направьте его в UI-компонент. Не задавайте `disabled` через loading в RHF: RHF исключает disabled значения из submit. `disabled` поля, в отличие от loading, передаётся в RHF по его стандартным правилам. `readOnly` передаётся как обычный prop компонента.

## Next.js App Router

Kit, Provider и компонент формы разместите в файлах `'use client'`. Root layout и page могут оставаться серверными. Пакет помечает собранный entrypoint `'use client'`; `dynamic({ ssr: false })` не нужен. Пример использует AntdRegistry для серверных стилей и собирается с обычным Next.js App Router.

```sh
npm ci && npm run prepare:examples
cd examples/nextjs
npm ci && npm run build
npm run dev
```

## Accessibility

По умолчанию: SSR-совместимый `useId`, label/htmlFor, description/help/error IDs, `aria-invalid`, `aria-required` и `role="alert"`. Пользовательские `aria-describedby` сохраняются. Ref RHF позволяет фокусировать ошибочное поле. При изменении `label` или ID адаптер должен направить соответствующие props на настоящий control, а не только внешнюю обёртку. Нестандартные компоненты обязаны реализовать keyboard navigation и доступность своего UI Kit.

## react-hook-form-persist

Обязательной зависимости и специального моста нет. Используйте тот же `form`:

```tsx
const persist = usePersistForm({ form, key: 'application' });
return (
  <application.Form
    form={form}
    loading={!persist.isRestored}
    onSubmit={async (values) => {
      await save(values);
      await persist.clearDraft();
    }}
  />
);
```

Рабочий Next.js пример использует опубликованный пакет `@serggrey1992/react-hook-form-persist/local`. Хранилище и восстановление полностью принадлежат persistence-библиотеке.

## Разработка

```sh
npm ci
npm run check
npm run test:consumer
npm run format
cd examples/vite && npm ci && npm run build
```

Runtime тесты — Vitest/RTL; type tests — `tests/types.tsx` с `@ts-expect-error`; CI проверяет React 18/19. `npm run test:consumer` упаковывает пакет и проверяет ESM/types consumer. Каждый пример имеет собственный lock-файл.

## Ограничения первой версии

Нет визуального редактора, собственного form state, автоматического persistence, удалённых JSON-схем, условного DSL и автоматического array renderer. Связь типов с моделью формы реализуется фабрикой конфигурации, а не наследованием generics через JSX. Конфигурацию можно менять runtime: точная типизация слотов относится к исходной декларации, актуальное наличие проверяется runtime. Не вкладывайте HTML form в HTML form. Для адаптера с generic/overloaded UI компонентом точность вывода props ограничивается TypeScript и типами самого компонента: используйте типизированную обёртку.

MIT.
