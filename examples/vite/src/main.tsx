import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { kit } from './kit';
import './style.css';
const loginSchema = z.object({
  email: z.string().email('Введите email'),
  password: z.string().min(8, 'Минимум 8 символов'),
});
const login = kit.defineFields<z.input<typeof loginSchema>>()([
  { name: 'email', type: 'text', label: 'Email', props: { type: 'email', autoComplete: 'email' } },
  {
    name: 'password',
    type: 'password',
    label: 'Пароль',
    props: { autoComplete: 'current-password' },
  },
]);
function Login() {
  const form = useForm({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(loginSchema),
  });
  const [status, setStatus] = useState('');
  return (
    <section>
      <h2>Вход: автоматическая форма</h2>
      <login.Form
        form={form}
        submit="Войти"
        onSubmit={async () => {
          await new Promise((resolve) => setTimeout(resolve, 400));
          setStatus('Вход выполнен (демо)');
        }}
      />
      <p role="status">{status}</p>
    </section>
  );
}
const registration = kit.defineFields<{
  name: string;
  address: { city: string };
  rating: number;
}>()([
  { name: 'name', type: 'text', label: 'Имя', rules: { required: 'Введите имя' } },
  { name: 'address.city', type: 'text', label: 'Город' },
  {
    name: 'rating',
    type: 'text',
    label: 'Оценка',
    description: 'Кастомный контрол без глобального адаптера',
  },
]);
function Registration() {
  const form = useForm({ defaultValues: { name: '', address: { city: '' }, rating: 3 } });
  const [result, setResult] = useState('');
  return (
    <section>
      <h2>Регистрация: слоты и вложенные поля</h2>
      <registration.Form
        form={form}
        onSubmit={(values) => setResult(JSON.stringify(values, null, 2))}
      >
        <div className="columns">
          <registration.Form.Slot name="name" props={{ placeholder: 'Ваше имя' }} />
          <registration.Form.Slot name="address.city" />
        </div>
        <registration.Form.Slot name="rating">
          {({ field, controlProps }) => (
            <input
              {...controlProps}
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              type="range"
              min={1}
              max={5}
              value={field.value}
              onChange={(e) => field.onChange(Number(e.target.value))}
            />
          )}
        </registration.Form.Slot>
        <registration.Form.Submit>Зарегистрироваться</registration.Form.Submit>
      </registration.Form>
      <pre aria-live="polite">{result}</pre>
    </section>
  );
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <kit.Provider>
      <main>
        <h1>React Form Builder</h1>
        <Login />
        <Registration />
      </main>
    </kit.Provider>
  </StrictMode>,
);
