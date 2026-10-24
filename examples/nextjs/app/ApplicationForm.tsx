'use client';
import { useMemo, useReducer, useState } from 'react';
import { Alert, Tag } from 'antd';
import { useForm, useFormState, useWatch } from 'react-hook-form';
import type { FieldPath } from 'react-hook-form';
import { usePersistForm } from '@serggrey1992/react-hook-form-persist/local';
import { kit } from './kit';
import { buildFields } from './fields';
import type { ApplicationValues } from './model';
import { createDemoValues, flattenErrors, summarize } from './model';
import { saveApplication } from './mock-api';
import { CountryCityFields, EmployeeField, IndustryField } from './remote-fields';
import { ArrayStructureProvider, BranchesSection, ContactsSection } from './array-fields';
import { FormInspector } from './inspector';
const Slot = kit.FormBuilder.Slot;
export function ApplicationForm() {
  const [defaults] = useState(createDemoValues);
  const form = useForm<ApplicationValues>({
    defaultValues: defaults,
    mode: 'onChange',
    shouldUnregister: false,
  });
  const persist = usePersistForm({ form, key: 'form-builder-complex-application-v1' });
  const values = useWatch({ control: form.control }) as ApplicationValues;
  const { errors, isSubmitting } = useFormState({ control: form.control });
  const [action, setAction] = useState(
    'Попробуйте изменить поля, добавить вложенные элементы или воспользоваться пультом управления.',
  );
  const [submitted, setSubmitted] = useState<Awaited<
    ReturnType<typeof saveApplication<ApplicationValues>>
  > | null>(null);
  const [, refreshStructure] = useReducer((revision: number) => revision + 1, 0);
  const structureValues = form.getValues();
  const stats = summarize(values);
  const errorList = flattenErrors(errors);
  // The registry depends on structure/conditions, not on every keystroke. Each rule reads current values from RHF.
  const structure = JSON.stringify({
    kind: structureValues.company.kind,
    notifications: structureValues.preferences.notifications,
    approval: structureValues.preferences.requiresApproval,
    contacts: structureValues.contacts.map((contact) => contact.phones.length),
    branches: structureValues.branches.map((branch) =>
      branch.departments.map((department) => department.members.length),
    ),
  });
  const fields = useMemo(() => buildFields(structureValues), [structure]);
  const registeredNames = new Set(fields.map((field) => field.name));
  return (
    <div className="demo-shell">
      <header className="demo-hero">
        <div>
          <span className="eyebrow">React Form Builder / интерактивный пример</span>
          <h1>Заявка компании</h1>
          <p>
            Одна форма. Вложенные объекты, динамические команды и справочники с задержкой — все
            изменения сразу видны в инспекторе.
          </p>
          <nav className="section-links" aria-label="Разделы заявки">
            <a href="#company-section">Компания</a>
            <a href="#contacts-heading">Контакты</a>
            <a href="#branches-heading">Филиалы</a>
            <a href="#preferences-section">Согласование</a>
          </nav>
        </div>
        <div className="hero-status">
          <Tag color={persist.isRestored ? 'green' : 'blue'}>
            {persist.isRestored ? 'Черновик восстановлен' : 'Восстановление…'}
          </Tag>
          <span>
            {fields.length} полей · {stats.branches} филиала · {stats.members} сотрудника
          </span>
          <small>Данные вымышлены. Запросы — локальные Promise, 0.4–1.2 с.</small>
        </div>
      </header>
      <div className="action-banner" role="status">
        {action}
      </div>
      {persist.status === 'error' && (
        <Alert type="warning" showIcon message="Не удалось сохранить или восстановить черновик" />
      )}
      <ArrayStructureProvider value={refreshStructure}>
        <kit.FormBuilder
          form={form}
          fields={fields}
          loading={!persist.isRestored || isSubmitting}
          onInvalid={() =>
            setAction('В заявке есть ошибки. Найдите их в форме или во вкладке errors.')
          }
          onSubmit={async (data) => {
            setAction('Отправка заявки в моковый сервер…');
            try {
              const response = await saveApplication(structuredClone(data));
              setSubmitted(response);
              setAction(
                `Заявка ${response.requestId} успешно отправлена. Ниже сохранён снимок отправленных данных.`,
              );
              try {
                await persist.clearDraft();
              } catch {
                setAction(
                  `Заявка ${response.requestId} отправлена, но удалить черновик не удалось.`,
                );
              }
            } catch (error) {
              form.setError('root.save', {
                type: 'server',
                message: error instanceof Error ? error.message : 'Ошибка отправки',
              });
              setAction('Отправить заявку не удалось.');
            }
          }}
        >
          <div className="workspace">
            <div className="form-column">
              {errorList.length > 0 && (
                <div className="error-summary" role="alert">
                  <strong>Ошибок: {errorList.length}</strong>
                  <ul>
                    {errorList.map((error) => (
                      <li key={error.path}>
                        {registeredNames.has(error.path as FieldPath<ApplicationValues>) ? (
                          <button
                            type="button"
                            onClick={() =>
                              form.setFocus(error.path as FieldPath<ApplicationValues>)
                            }
                          >
                            {error.path}: {error.message}
                          </button>
                        ) : (
                          <span>
                            {error.path}: {error.message}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <section
                className="form-section"
                id="company-section"
                aria-labelledby="company-heading"
              >
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">01 / Простые поля и вложенные объекты</span>
                    <h2 id="company-heading">Компания и головной офис</h2>
                  </div>
                </div>
                <div className="fields-grid">
                  <Slot name="company.kind" />
                  <Slot name="company.name" />
                  {values.company.kind === 'company' ? (
                    <Slot name="company.taxId" />
                  ) : (
                    <Slot name="company.registrationNumber" />
                  )}
                  <IndustryField />
                  <Slot name="company.website" />
                  <Slot name="company.annualBudget" />
                </div>
                <h3 className="subsection-heading">Адрес головного офиса</h3>
                <div className="fields-grid">
                  <CountryCityFields
                    countryName="headquarters.country"
                    cityName="headquarters.city"
                  />
                  <Slot name="headquarters.street" />
                  <Slot name="headquarters.postalCode" />
                </div>
                <Slot name="company.notes" />
              </section>
              <ContactsSection />
              <BranchesSection />
              <section
                className="form-section"
                id="preferences-section"
                aria-labelledby="preferences-heading"
              >
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">04 / Условные поля и согласование</span>
                    <h2 id="preferences-heading">Уведомления и согласование</h2>
                  </div>
                </div>
                <div className="fields-grid">
                  <Slot name="preferences.notifications" />
                  <Slot name="preferences.channels" />
                  {values.preferences.notifications && (
                    <Slot name="preferences.notificationEmail" />
                  )}
                  <Slot name="preferences.requiresApproval" />
                  {values.preferences.requiresApproval && (
                    <EmployeeField name="preferences.approver" />
                  )}
                </div>
                <p className="section-note">
                  Отключите уведомления или согласование: зависимые поля исчезнут, а их значения
                  останутся в RHF. Включите обратно и проверьте.
                </p>
                <p className="section-note">
                  Для проверки ошибок загрузки введите «ошибка» в поиске любого сотрудника. Затем
                  измените поисковый запрос.
                </p>
              </section>
              <div className="submit-panel">
                <Slot name="preferences.accepted" />
                <div className="submit-actions">
                  <span>
                    {isSubmitting
                      ? 'Сохраняем вложенную заявку…'
                      : 'Перед отправкой проверяются все зарегистрированные поля.'}
                  </span>
                  <kit.FormBuilder.Submit>
                    {isSubmitting ? 'Отправка…' : 'Отправить заявку'}
                  </kit.FormBuilder.Submit>
                </div>
              </div>
              {submitted && (
                <section className="form-section submitted-result" aria-label="Результат отправки">
                  <Tag color="green">Отправлено: {submitted.requestId}</Tag>
                  <h2>Снимок отправленной заявки</h2>
                  <p>Этот JSON не меняется при последующем редактировании формы.</p>
                  <pre data-testid="submitted-json">
                    {JSON.stringify(submitted.values, null, 2)}
                  </pre>
                </section>
              )}
            </div>
            <FormInspector
              restored={persist.isRestored}
              clearDraft={persist.clearDraft}
              onAction={setAction}
            />
          </div>
        </kit.FormBuilder>
      </ArrayStructureProvider>
    </div>
  );
}
