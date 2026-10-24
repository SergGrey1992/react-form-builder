import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { ApplicationForm } from '../app/ApplicationForm';
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      },
    }),
  });
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  HTMLElement.prototype.scrollIntoView = () => {};
});
beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function values() {
  return JSON.parse(screen.getByTestId('form-json').textContent || '{}');
}
async function ready() {
  await waitFor(
    () =>
      expect(
        (screen.getByRole('button', { name: 'Загрузить демоданные' }) as HTMLButtonElement)
          .disabled,
      ).toBe(false),
    { timeout: 4000 },
  );
}
it('adds three nested array levels and preserves edited values when moving parent branches', async () => {
  render(<ApplicationForm />);
  await ready();
  const first = screen.getByTestId('branch-0');
  const second = screen.getByTestId('branch-1');
  fireEvent.change(within(first).getByLabelText('Название филиала', { exact: false }), {
    target: { value: 'Edited first' },
  });
  fireEvent.click(within(second).getByRole('button', { name: 'Поднять филиал 2' }));
  await waitFor(() => expect(values().branches[1].name).toBe('Edited first'));
  fireEvent.click(
    within(screen.getByTestId('branch-1')).getByRole('button', { name: 'Добавить отдел' }),
  );
  await waitFor(() => expect(values().branches[1].departments).toHaveLength(3));
  fireEvent.click(
    within(screen.getByTestId('department-1-2')).getByRole('button', {
      name: 'Добавить сотрудника',
    }),
  );
  await waitFor(() => expect(values().branches[1].departments[2].members).toHaveLength(2));
  expect(values().branches[1].departments[0].members[0].employeeId).toBe('e1');
  fireEvent.click(
    within(screen.getByTestId('contact-0')).getByRole('button', { name: 'Добавить телефон' }),
  );
  await waitFor(() => expect(values().contacts[0].phones).toHaveLength(3));
  fireEvent.click(
    within(screen.getByTestId('contact-1')).getByRole('button', { name: 'Поднять контакт 2' }),
  );
  await waitFor(() => expect(values().contacts[1].phones).toHaveLength(3));
  expect(values().contacts[1].fullName).toBe('Анна Демонстрационная');
  fireEvent.click(
    within(screen.getByTestId('branch-1')).getByRole('button', { name: 'Копировать' }),
  );
  await waitFor(() => expect(values().branches).toHaveLength(3));
  expect(values().branches[2].departments[0].members[0].employeeId).toBe('e1');
}, 20000);
it('operates native RHF controls, conditionally hides fields and shows safe error JSON', async () => {
  render(<ApplicationForm />);
  await ready();
  fireEvent.click(screen.getByRole('button', { name: 'Изменить через setValue' }));
  expect(values().company.name).toBe('Изменено через setValue');
  fireEvent.click(screen.getByRole('button', { name: 'Сбросить одно поле' }));
  expect(values().company.name).toBe('Северные технологии');
  fireEvent.click(screen.getByLabelText('Получать уведомления', { exact: false }));
  await waitFor(() =>
    expect(screen.queryByLabelText('Email для уведомлений', { exact: false })).toBeNull(),
  );
  expect(values().preferences.notificationEmail).toBe('operations@example.com');
  fireEvent.click(screen.getByRole('button', { name: 'Показать серверную ошибку' }));
  await waitFor(() =>
    expect(screen.getByTestId('form-json').textContent).toContain('организация с таким номером'),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Очистить ошибки' }));
  expect(screen.getByTestId('form-json').textContent).toBe('[]');
}, 20000);
it('submits complete nested data and retains values blocked only for options loading', async () => {
  const errors = vi.spyOn(console, 'error');
  render(<ApplicationForm />);
  await ready();
  fireEvent.click(screen.getByLabelText('Подтверждаю корректность данных', { exact: false }));
  fireEvent.click(screen.getByRole('button', { name: /Отправить заявку/ }));
  const output = await screen.findByTestId('submitted-json', {}, { timeout: 10000 });
  const data = JSON.parse(output.textContent || '{}');
  expect(data.headquarters.city).toBe('minsk');
  expect(data.branches[1].departments[0].members[0].employeeId).toBe('e4');
  expect(errors.mock.calls.filter((call) => String(call[0]).includes('uncontrolled'))).toEqual([]);
  errors.mockRestore();
}, 20000);
it('rejects completely empty contacts and branches instead of silently accepting empty arrays', async () => {
  render(<ApplicationForm />);
  await ready();
  fireEvent.click(screen.getByRole('button', { name: 'Очистить форму' }));
  await waitFor(() => expect(values().branches).toEqual([]));
  fireEvent.click(screen.getByRole('button', { name: 'Проверить все поля' }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('найдены ошибки'));
  fireEvent.click(screen.getByRole('tab', { name: /errors/ }));
  const errors = JSON.parse(screen.getByTestId('form-json').textContent || '[]');
  expect(errors.map((error: { path: string }) => error.path)).toContain('contacts.root');
  expect(errors.map((error: { path: string }) => error.path)).toContain('branches.root');
}, 20000);
it('validates empty nested phones, departments and members', async () => {
  render(<ApplicationForm />);
  await ready();
  for (let i = 0; i < 2; i++)
    fireEvent.click(
      within(screen.getByTestId('contact-0')).getByRole('button', { name: 'Удалить телефон 1' }),
    );
  for (let i = 0; i < 2; i++)
    fireEvent.click(
      within(screen.getByTestId('department-0-0')).getAllByRole('button', {
        name: 'Удалить сотрудника',
      })[0]!,
    );
  fireEvent.click(
    within(screen.getByTestId('branch-1')).getByRole('button', { name: 'Удалить отдел' }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Проверить все поля' }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('найдены ошибки'));
  fireEvent.click(screen.getByRole('tab', { name: /errors/ }));
  const paths = JSON.parse(screen.getByTestId('form-json').textContent || '[]').map(
    (error: { path: string }) => error.path,
  );
  expect(paths).toContain('contacts.0.phones.root');
  expect(paths).toContain('branches.0.departments.0.members.root');
  expect(paths).toContain('branches.1.departments.root');
}, 20000);
