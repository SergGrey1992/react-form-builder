'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { usePersistForm } from '@serggrey1992/react-hook-form-persist/local';
import { kit } from './kit';
const application = kit.defineFields<{ email: string; organization: string; accepted: boolean }>()([
  {
    name: 'email',
    type: 'text',
    label: 'Email',
    rules: { required: 'Введите email' },
    props: { autoComplete: 'email' },
  },
  {
    name: 'organization',
    type: 'select',
    label: 'Организация',
    props: {
      showSearch: true,
      allowClear: true,
      options: [{ value: 'acme', label: 'Acme' }],
      optionFilterProp: 'label',
      'aria-label': 'Организация',
    },
  },
  { name: 'accepted', type: 'checkbox', label: 'Согласие' },
]);
export function ApplicationForm() {
  const form = useForm({ defaultValues: { email: '', organization: '', accepted: false } });
  const persist = usePersistForm({ form, key: 'form-builder-application' });
  const [result, setResult] = useState('');
  return (
    <application.Form
      form={form}
      loading={!persist.isRestored}
      onSubmit={async (values) => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setResult(JSON.stringify(values));
        await persist.clearDraft();
      }}
    >
      <application.Form.Slot name="email" />
      <application.Form.Slot name="organization" />
      <application.Form.Slot name="accepted" />
      <application.Form.Submit>Сохранить</application.Form.Submit>
      <p role="status">{result}</p>
    </application.Form>
  );
}
