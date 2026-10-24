'use client';
import { useState } from 'react';
import { Button, Tag } from 'antd';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';
import type { ApplicationValues } from './model';
import { createDemoValues, createEmptyValues, flattenErrors, summarize } from './model';
export function FormInspector({
  restored,
  clearDraft,
  onAction,
}: {
  restored: boolean;
  clearDraft: () => Promise<void>;
  onAction: (message: string) => void;
}) {
  const form = useFormContext<ApplicationValues>();
  const values = useWatch({ control: form.control }) as ApplicationValues;
  const { errors, dirtyFields, touchedFields, isDirty, isValid, isSubmitting, submitCount } =
    useFormState({ control: form.control });
  const [tab, setTab] = useState<'values' | 'errors' | 'dirty' | 'touched' | 'snapshot'>('values');
  const [snapshot, setSnapshot] = useState<ApplicationValues | null>(null);
  const [clearing, setClearing] = useState(false);
  const stats = summarize(values);
  const errorList = flattenErrors(errors);
  const busy = !restored || isSubmitting || clearing;
  const payload = {
    values,
    errors: errorList,
    dirty: dirtyFields,
    touched: touchedFields,
    snapshot,
  }[tab];
  function resetTo(value: ApplicationValues, message: string) {
    form.reset(value);
    onAction(message);
  }
  return (
    <aside className="inspector" aria-label="Управление и состояние формы">
      <div className="inspector-heading">
        <span className="eyebrow">Пульт управления</span>
        <h2>Что происходит в форме</h2>
        <div className="status-tags">
          <Tag color={isDirty ? 'orange' : 'green'}>dirty: {String(isDirty)}</Tag>
          <Tag color={isValid ? 'green' : 'red'}>valid: {String(isValid)}</Tag>
          <Tag color={isSubmitting ? 'blue' : 'default'}>submitting: {String(isSubmitting)}</Tag>
          <Tag>submitCount: {submitCount}</Tag>
        </div>
      </div>
      <div className="stats-grid">
        <div>
          <strong>{stats.branches}</strong>
          <span>филиала</span>
        </div>
        <div>
          <strong>{stats.departments}</strong>
          <span>отдела</span>
        </div>
        <div>
          <strong>{stats.members}</strong>
          <span>сотрудника</span>
        </div>
        <div>
          <strong>{stats.phones}</strong>
          <span>телефона</span>
        </div>
      </div>
      <div
        className={`budget-summary ${stats.budget > Number(values.company.annualBudget) ? 'over-budget' : ''}`}
      >
        <span>Распределено по филиалам</span>
        <strong>
          {stats.budget.toLocaleString('ru-RU')} /{' '}
          {Number(values.company.annualBudget).toLocaleString('ru-RU')} BYN
        </strong>
      </div>
      <fieldset disabled={busy} className="control-buttons">
        <legend>Попробуйте стандартные API RHF</legend>
        <Button
          htmlType="button"
          disabled={busy}
          onClick={() => resetTo(createDemoValues(), 'reset(demo): восстановлена исходная заявка')}
        >
          Загрузить демоданные
        </Button>
        <Button
          htmlType="button"
          disabled={busy}
          onClick={() => resetTo(createEmptyValues(), 'reset(empty): форма очищена, массивы пусты')}
        >
          Очистить форму
        </Button>
        <Button
          htmlType="button"
          disabled={busy}
          onClick={() => {
            form.setValue('company.name', 'Изменено через setValue', {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });
            form.setValue('headquarters.street', 'Новый адрес из панели', {
              shouldDirty: true,
              shouldTouch: true,
            });
            onAction('setValue: изменены название и вложенный адрес');
          }}
        >
          Изменить через setValue
        </Button>
        <Button
          htmlType="button"
          disabled={busy}
          onClick={() => {
            form.reset();
            onAction('reset(): возврат к последней загруженной версии');
          }}
        >
          Сбросить изменения
        </Button>
        <Button
          htmlType="button"
          disabled={busy}
          onClick={() => {
            form.reset(form.getValues());
            onAction('reset(getValues()): текущие данные стали новой исходной версией');
          }}
        >
          Принять как исходные
        </Button>
        <Button
          htmlType="button"
          disabled={busy}
          onClick={() => {
            form.resetField('company.name');
            onAction('resetField(company.name): сброшено только название');
          }}
        >
          Сбросить одно поле
        </Button>
        <Button
          htmlType="button"
          disabled={busy}
          onClick={async () => {
            const valid = await form.trigger(undefined, { shouldFocus: true });
            onAction(`trigger(): ${valid ? 'все поля корректны' : 'найдены ошибки'}`);
          }}
        >
          Проверить все поля
        </Button>
        <Button
          htmlType="button"
          disabled={busy}
          onClick={() => {
            const path =
              form.getValues('company.kind') === 'company'
                ? 'company.taxId'
                : 'company.registrationNumber';
            form.setError(
              path,
              { type: 'server', message: 'Сервер: организация с таким номером уже существует' },
              { shouldFocus: true },
            );
            setTab('errors');
            onAction(`setError(${path}): показана ошибка сервера`);
          }}
        >
          Показать серверную ошибку
        </Button>
        <Button
          htmlType="button"
          disabled={busy}
          onClick={() => {
            form.clearErrors();
            onAction('clearErrors(): ошибки очищены; для пересчёта isValid нажмите «Проверить»');
          }}
        >
          Очистить ошибки
        </Button>
        <Button
          htmlType="button"
          disabled={busy}
          onClick={() => {
            setSnapshot(structuredClone(form.getValues()));
            setTab('snapshot');
            onAction('getValues(): сделан снимок без подписки на изменения');
          }}
        >
          Снимок getValues
        </Button>
        <Button
          htmlType="button"
          disabled={busy}
          onClick={async () => {
            setClearing(true);
            try {
              await clearDraft();
              onAction('clearDraft(): сохранённый черновик удалён; значения формы сохранены');
            } catch (error) {
              onAction(error instanceof Error ? error.message : 'Не удалось удалить черновик');
            } finally {
              setClearing(false);
            }
          }}
        >
          Удалить черновик
        </Button>
      </fieldset>
      <div className="json-tabs" role="tablist" aria-label="Инспектор RHF">
        {(['values', 'errors', 'dirty', 'touched', 'snapshot'] as const).map((key) => (
          <button
            type="button"
            role="tab"
            aria-selected={tab === key}
            aria-controls="inspector-json"
            id={`inspector-tab-${key}`}
            key={key}
            onClick={() => setTab(key)}
          >
            {key}
            {key === 'errors' && errorList.length ? ` (${errorList.length})` : ''}
          </button>
        ))}
      </div>
      <pre
        className="json-view"
        id="inspector-json"
        role="tabpanel"
        aria-labelledby={`inspector-tab-${tab}`}
        data-testid="form-json"
      >
        {JSON.stringify(payload, null, 2)}
      </pre>
      <p className="inspector-note">
        values обновляются через useWatch. dirty и touched показывают только изменённые и посещённые
        пути. snapshot остаётся прежним, пока вы не сделаете новый снимок.
      </p>
    </aside>
  );
}
