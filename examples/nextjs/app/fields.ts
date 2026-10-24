import type { FieldConfig } from '@serggrey1992/react-form-builder';
import { adapter } from './kit';
import type { ApplicationValues } from './model';
import { summarize } from './model';
export type ApplicationField = FieldConfig<ApplicationValues, typeof adapter.fields>;
const required = { required: 'Обязательное поле' };
const email = {
  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Введите корректный email' },
};
export function buildFields(values: ApplicationValues): ApplicationField[] {
  const fields: ApplicationField[] = [
    {
      name: 'company.kind',
      type: 'select',
      label: 'Тип заявителя',
      props: {
        options: [
          { value: 'company', label: 'Юридическое лицо' },
          { value: 'individual', label: 'Индивидуальный предприниматель' },
        ],
      },
    },
    { name: 'company.name', type: 'text', label: 'Название организации', rules: required },
    {
      name: 'company.website',
      type: 'text',
      label: 'Сайт',
      rules: {
        validate: (value) =>
          !value || /^https?:\/\//.test(String(value)) || 'Начните адрес с https://',
      },
      props: { placeholder: 'https://example.com' },
    },
    {
      name: 'company.industry',
      type: 'select',
      label: 'Отрасль',
      rules: required,
      props: { placeholder: 'Загрузка справочника…' },
    },
    {
      name: 'company.annualBudget',
      type: 'number',
      label: 'Годовой бюджет, BYN',
      rules: {
        min: { value: 1, message: 'Бюджет должен быть положительным' },
        validate: (value, allValues) =>
          Number(value) >= summarize(allValues).budget ||
          'Бюджеты филиалов превышают годовой бюджет',
      },
      props: { step: 1000 },
    },
    {
      name: 'company.notes',
      type: 'textarea',
      label: 'Комментарий',
      props: { maxLength: 2000, showCount: true },
    },
    {
      name: 'headquarters.country',
      type: 'select',
      label: 'Страна головного офиса',
      rules: required,
    },
    { name: 'headquarters.city', type: 'select', label: 'Город головного офиса', rules: required },
    { name: 'headquarters.street', type: 'text', label: 'Адрес головного офиса', rules: required },
    {
      name: 'headquarters.postalCode',
      type: 'text',
      label: 'Почтовый индекс',
      props: { maxLength: 12 },
    },
    { name: 'preferences.notifications', type: 'checkbox', label: 'Получать уведомления' },
    {
      name: 'preferences.channels',
      type: 'select',
      label: 'Каналы связи',
      props: {
        mode: 'multiple',
        options: [
          { value: 'email', label: 'Email' },
          { value: 'sms', label: 'SMS' },
          { value: 'dashboard', label: 'Личный кабинет' },
        ],
      },
    },
    { name: 'preferences.requiresApproval', type: 'checkbox', label: 'Требуется согласование' },
    {
      name: 'preferences.accepted',
      type: 'checkbox',
      label: 'Подтверждаю корректность данных',
      rules: {
        validate: (value) => value === true || 'Подтвердите корректность данных перед отправкой',
      },
    },
  ];
  if (values.company.kind === 'company')
    fields.push({
      name: 'company.taxId',
      type: 'text',
      label: 'УНП / налоговый номер',
      rules: { ...required, pattern: { value: /^\d{9}$/, message: 'Нужно ровно 9 цифр' } },
      props: { maxLength: 9 },
    });
  else
    fields.push({
      name: 'company.registrationNumber',
      type: 'text',
      label: 'Номер регистрации ИП',
      rules: required,
    });
  if (values.preferences.notifications)
    fields.push({
      name: 'preferences.notificationEmail',
      type: 'text',
      label: 'Email для уведомлений',
      rules: { ...required, ...email },
    });
  if (values.preferences.requiresApproval)
    fields.push({
      name: 'preferences.approver',
      type: 'select',
      label: 'Согласующий сотрудник',
      rules: required,
    });
  values.contacts.forEach((contact, index) => {
    fields.push(
      { name: `contacts.${index}.fullName`, type: 'text', label: 'ФИО контакта', rules: required },
      {
        name: `contacts.${index}.email`,
        type: 'text',
        label: 'Email контакта',
        rules: { ...required, ...email },
      },
      { name: `contacts.${index}.position`, type: 'text', label: 'Должность' },
      { name: `contacts.${index}.primary`, type: 'checkbox', label: 'Основной контакт' },
    );
    contact.phones.forEach((_, phoneIndex) =>
      fields.push(
        {
          name: `contacts.${index}.phones.${phoneIndex}.kind`,
          type: 'select',
          label: 'Тип телефона',
          props: {
            options: [
              { value: 'mobile', label: 'Мобильный' },
              { value: 'work', label: 'Рабочий' },
            ],
          },
        },
        {
          name: `contacts.${index}.phones.${phoneIndex}.number`,
          type: 'text',
          label: 'Номер телефона',
          rules: {
            ...required,
            pattern: {
              value: /^\+?[\d\s()-]{7,22}$/,
              message: 'Введите номер телефона: от 7 до 22 символов',
            },
          },
          props: { placeholder: '+375 …' },
        },
      ),
    );
  });
  values.branches.forEach((branch, index) => {
    fields.push(
      { name: `branches.${index}.name`, type: 'text', label: 'Название филиала', rules: required },
      {
        name: `branches.${index}.budget`,
        type: 'number',
        label: 'Бюджет филиала, BYN',
        rules: { min: { value: 0, message: 'Бюджет не может быть отрицательным' } },
        props: { step: 1000 },
      },
      {
        name: `branches.${index}.address.country`,
        type: 'select',
        label: 'Страна филиала',
        rules: required,
      },
      {
        name: `branches.${index}.address.city`,
        type: 'select',
        label: 'Город филиала',
        rules: required,
      },
      {
        name: `branches.${index}.address.street`,
        type: 'text',
        label: 'Адрес филиала',
        rules: required,
      },
    );
    branch.departments.forEach((department, departmentIndex) => {
      fields.push(
        {
          name: `branches.${index}.departments.${departmentIndex}.name`,
          type: 'text',
          label: 'Название отдела',
          rules: required,
        },
        {
          name: `branches.${index}.departments.${departmentIndex}.costCenter`,
          type: 'text',
          label: 'Центр затрат',
          props: { placeholder: 'DEV-01' },
        },
      );
      department.members.forEach((_, memberIndex) =>
        fields.push(
          {
            name: `branches.${index}.departments.${departmentIndex}.members.${memberIndex}.employeeId`,
            type: 'select',
            label: 'Сотрудник',
            rules: required,
          },
          {
            name: `branches.${index}.departments.${departmentIndex}.members.${memberIndex}.role`,
            type: 'select',
            label: 'Роль',
            rules: required,
            props: {
              options: [
                { value: 'lead', label: 'Руководитель' },
                { value: 'manager', label: 'Менеджер' },
                { value: 'specialist', label: 'Специалист' },
                { value: 'observer', label: 'Наблюдатель' },
              ],
            },
          },
          {
            name: `branches.${index}.departments.${departmentIndex}.members.${memberIndex}.allocation`,
            type: 'number',
            label: 'Загрузка, %',
            rules: {
              min: { value: 1, message: 'Минимум 1%' },
              max: { value: 100, message: 'Максимум 100%' },
            },
            props: { min: 1, max: 100 },
          },
        ),
      );
    });
  });
  return fields;
}
