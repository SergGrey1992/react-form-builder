import { ApplicationForm } from './ApplicationForm';
export default function Page() {
  return (
    <main style={{ maxWidth: 600, margin: '40px auto', padding: 20 }}>
      <h1>Заявка — Ant Design</h1>
      <p>Форма предварительно рендерится сервером, затем гидратируется в браузере.</p>
      <ApplicationForm />
    </main>
  );
}
