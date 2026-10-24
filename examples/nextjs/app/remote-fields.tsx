'use client';
import { useCallback, useDeferredValue, useState } from 'react';
import { Alert, Button, Empty, Spin } from 'antd';
import { useFormContext, useWatch } from 'react-hook-form';
import type { FieldPath } from 'react-hook-form';
import { kit } from './kit';
import type { ApplicationValues } from './model';
import {
  fetchCountries,
  fetchCities,
  fetchIndustries,
  searchEmployees,
  selectedEmployee,
} from './mock-api';
import { useOptions } from './use-options';
const Slot = kit.FormBuilder.Slot;
function RequestStatus({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string | null;
  retry: () => void;
}) {
  if (error)
    return (
      <Alert
        type="error"
        showIcon
        message={error}
        action={
          <Button htmlType="button" size="small" onClick={retry}>
            Повторить
          </Button>
        }
      />
    );
  return (
    <small className="request-status" aria-live="polite">
      {loading ? 'Promise → загрузка данных…' : 'Данные получены из мокового API'}
    </small>
  );
}
export function CountryCityFields({
  countryName,
  cityName,
}: {
  countryName: FieldPath<ApplicationValues>;
  cityName: FieldPath<ApplicationValues>;
}) {
  const form = useFormContext<ApplicationValues>();
  const country = String(useWatch({ control: form.control, name: countryName }) ?? '');
  const countries = useOptions('countries', fetchCountries);
  const loadCities = useCallback(() => fetchCities(country), [country]);
  const cities = useOptions(`cities:${country}`, loadCities, Boolean(country));
  return (
    <>
      <div>
        <Slot
          name={countryName}
          props={{
            options: countries.options,
            loading: countries.loading,
            uiDisabled: countries.loading,
            showSearch: true,
            optionFilterProp: 'label',
            placeholder: 'Выберите страну',
            onChange: () => {
              form.setValue(cityName, '', { shouldDirty: true, shouldTouch: true });
              form.clearErrors(cityName);
            },
          }}
        />
        <RequestStatus {...countries} />
      </div>
      <div>
        <Slot
          name={cityName}
          props={{
            options: cities.options,
            loading: cities.loading,
            uiDisabled: !country || cities.loading,
            showSearch: true,
            optionFilterProp: 'label',
            placeholder: country ? 'Выберите город' : 'Сначала выберите страну',
            notFoundContent: cities.loading ? (
              <Spin size="small" />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Городов нет" />
            ),
          }}
        />
        {country && <RequestStatus {...cities} />}
      </div>
    </>
  );
}
export function IndustryField() {
  const request = useOptions('industries', fetchIndustries);
  return (
    <div>
      <Slot
        name="company.industry"
        props={{
          options: request.options,
          loading: request.loading,
          uiDisabled: request.loading,
          placeholder: 'Выберите отрасль',
        }}
      />
      <RequestStatus {...request} />
    </div>
  );
}
export function EmployeeField({ name }: { name: FieldPath<ApplicationValues> }) {
  const form = useFormContext<ApplicationValues>();
  const selected = useWatch({ control: form.control, name });
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const load = useCallback(() => searchEmployees(deferredQuery), [deferredQuery]);
  const request = useOptions(`employees:${deferredQuery}`, load);
  const options = [
    ...new Map(
      [
        ...selectedEmployee(typeof selected === 'string' ? selected : undefined),
        ...request.options,
      ].map((option) => [option.value, option]),
    ).values(),
  ];
  return (
    <div>
      <Slot
        name={name}
        props={{
          options,
          showSearch: true,
          filterOption: false,
          onSearch: setQuery,
          loading: request.loading,
          placeholder: 'Начните вводить имя',
          notFoundContent: request.loading ? <Spin size="small" /> : 'Ничего не найдено',
          onChange: () => setQuery(''),
        }}
      />
      <RequestStatus {...request} />
    </div>
  );
}
