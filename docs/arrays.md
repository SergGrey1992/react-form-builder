# Динамические коллекции

В первой версии поле — листовой узел с абсолютным `FieldPath`. Приложение владеет `useFieldArray`, добавлением/удалением и относительными именами.

```tsx
const array = useFieldArray({ control: form.control, name: 'contacts' });
const fields = array.fields.map((_, i) => ({
  name: `contacts.${i}.name` as const,
  type: 'text' as const,
}));
return (
  <kit.FormBuilder form={form} fields={fields}>
    {array.fields.map((item, i) => (
      <kit.FormBuilder.Slot key={item.id} name={`contacts.${i}.name`} />
    ))}
  </kit.FormBuilder>
);
```

Динамический `.Slot` проверяет актуальную конфигурацию runtime. Статически объявленные формы используют `defineFields` для точной проверки имени. Вложенные массивы организуются пользовательскими компонентами с собственными RHF hooks. `defaultValues` и валидация задаются RHF. Не ставьте `shouldUnregister` при reorder.

Будущий array renderer должен быть отдельным discriminated node (`kind: 'array'`), отличным от текущего leaf field. Он будет явно переводить относительные item paths в абсолютные RHF пути и владеть `useFieldArray` только в отдельном компоненте, а не вызывать hooks в цикле. Стабильный ключ — RHF item.id. Для `string[]` нужен самостоятельный контракт: нативный useFieldArray не поддерживает flat field arrays. Текущий API не резервирует `type: 'array'`: это свободное имя пользовательского адаптера, поэтому будущие nodes требуют отдельного discriminator.
