'use client';
import { createContext, useContext } from 'react';
import { Button, Tag } from 'antd';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { kit } from './kit';
import type { ApplicationValues } from './model';
import { newBranch, newContact, newDepartment, newMember, newPhone } from './model';
import { CountryCityFields, EmployeeField } from './remote-fields';
const Slot = kit.FormBuilder.Slot;
const StructureContext = createContext<() => void>(() => {});
export const ArrayStructureProvider = StructureContext.Provider;
function useArrayMutation() {
  const refreshStructure = useContext(StructureContext);
  return (mutation: () => void) => {
    mutation();
    refreshStructure();
  };
}
function Phones({ contactIndex }: { contactIndex: number }) {
  const { control } = useFormContext<ApplicationValues>();
  const mutate = useArrayMutation();
  const array = useFieldArray({
    control,
    name: `contacts.${contactIndex}.phones`,
    rules: { required: 'Добавьте хотя бы один телефон контакта' },
  });
  return (
    <div className="nested-block">
      <div className="row-heading">
        <h4>
          Телефоны <Tag>{array.fields.length}</Tag>
        </h4>
        <Button
          htmlType="button"
          size="small"
          onClick={() => mutate(() => array.append(newPhone()))}
        >
          Добавить телефон
        </Button>
      </div>
      {array.fields.map((phone, index) => (
        <div className="phone-row" key={phone.id} data-testid={`phone-${contactIndex}-${index}`}>
          <Slot name={`contacts.${contactIndex}.phones.${index}.kind`} />
          <Slot name={`contacts.${contactIndex}.phones.${index}.number`} />
          <Button
            htmlType="button"
            danger
            aria-label={`Удалить телефон ${index + 1}`}
            onClick={() => mutate(() => array.remove(index))}
          >
            Удалить
          </Button>
        </div>
      ))}
      {!array.fields.length && (
        <p className="empty-note">Телефонов пока нет. Можно добавить новый объект в массив.</p>
      )}
    </div>
  );
}
export function ContactsSection() {
  const form = useFormContext<ApplicationValues>();
  const mutate = useArrayMutation();
  const array = useFieldArray({
    control: form.control,
    name: 'contacts',
    rules: { required: 'Добавьте хотя бы один контакт' },
  });
  return (
    <section className="form-section" aria-labelledby="contacts-heading">
      <div className="section-heading">
        <div>
          <span className="eyebrow">02 / Массив внутри массива</span>
          <h2 id="contacts-heading">
            Контактные лица <Tag>{array.fields.length}</Tag>
          </h2>
        </div>
        <Button htmlType="button" onClick={() => mutate(() => array.append(newContact()))}>
          Добавить контакт
        </Button>
      </div>
      <p className="section-note">
        У каждого контакта свой список телефонов. Перемещение сохраняет все вложенные значения.
      </p>
      {array.fields.map((contact, index) => (
        <article className="array-card" key={contact.id} data-testid={`contact-${index}`}>
          <div className="row-heading">
            <h3>Контакт {index + 1}</h3>
            <div className="row-actions">
              <Button
                htmlType="button"
                size="small"
                aria-label={`Поднять контакт ${index + 1}`}
                disabled={index === 0}
                onClick={() => mutate(() => array.move(index, index - 1))}
              >
                Выше
              </Button>
              <Button
                htmlType="button"
                size="small"
                disabled={index === array.fields.length - 1}
                onClick={() => mutate(() => array.move(index, index + 1))}
              >
                Ниже
              </Button>
              <Button
                htmlType="button"
                size="small"
                danger
                onClick={() => mutate(() => array.remove(index))}
              >
                Удалить контакт
              </Button>
            </div>
          </div>
          <div className="fields-grid">
            <Slot name={`contacts.${index}.fullName`} />
            <Slot name={`contacts.${index}.email`} />
            <Slot name={`contacts.${index}.position`} />
            <Slot name={`contacts.${index}.primary`} />
          </div>
          {/* useFieldArray does not support changing names: remount its hook when the parent index changes. RHF keeps the values. */}
          <Phones key={`contact-path-${index}`} contactIndex={index} />
        </article>
      ))}
      {!array.fields.length && (
        <p className="empty-note">
          Контакты удалены. Добавьте контакт или загрузите исходный пример.
        </p>
      )}
    </section>
  );
}
function Members({
  branchIndex,
  departmentIndex,
}: {
  branchIndex: number;
  departmentIndex: number;
}) {
  const { control } = useFormContext<ApplicationValues>();
  const mutate = useArrayMutation();
  const array = useFieldArray({
    control,
    name: `branches.${branchIndex}.departments.${departmentIndex}.members`,
    rules: { required: 'Добавьте сотрудника в отдел' },
  });
  return (
    <div className="members">
      <div className="row-heading">
        <h4>
          Сотрудники <Tag>{array.fields.length}</Tag>
        </h4>
        <Button
          htmlType="button"
          size="small"
          onClick={() => mutate(() => array.append(newMember()))}
        >
          Добавить сотрудника
        </Button>
      </div>
      {array.fields.map((member, index) => (
        <div
          className="member-card"
          key={member.id}
          data-testid={`member-${branchIndex}-${departmentIndex}-${index}`}
        >
          <div className="row-heading">
            <span className="item-index">Сотрудник {index + 1}</span>
            <div className="row-actions">
              <Button
                htmlType="button"
                size="small"
                disabled={index === 0}
                onClick={() => mutate(() => array.move(index, index - 1))}
              >
                Выше
              </Button>
              <Button
                htmlType="button"
                size="small"
                danger
                onClick={() => mutate(() => array.remove(index))}
              >
                Удалить сотрудника
              </Button>
            </div>
          </div>
          <div className="member-grid">
            <EmployeeField
              name={`branches.${branchIndex}.departments.${departmentIndex}.members.${index}.employeeId`}
            />
            <Slot
              name={`branches.${branchIndex}.departments.${departmentIndex}.members.${index}.role`}
            />
            <Slot
              name={`branches.${branchIndex}.departments.${departmentIndex}.members.${index}.allocation`}
            />
          </div>
        </div>
      ))}
      {!array.fields.length && (
        <p className="empty-note">
          Добавьте сотрудника. В поиске можно ввести «ошибка», чтобы проверить обработку отказа API.
        </p>
      )}
    </div>
  );
}
function Departments({ branchIndex }: { branchIndex: number }) {
  const form = useFormContext<ApplicationValues>();
  const mutate = useArrayMutation();
  const array = useFieldArray({
    control: form.control,
    name: `branches.${branchIndex}.departments`,
    rules: { required: 'Добавьте отдел в филиал' },
  });
  return (
    <div className="nested-block">
      <div className="row-heading">
        <h4>
          Отделы <Tag>{array.fields.length}</Tag>
        </h4>
        <Button htmlType="button" onClick={() => mutate(() => array.append(newDepartment()))}>
          Добавить отдел
        </Button>
      </div>
      {array.fields.map((department, index) => (
        <article
          className="department-card"
          key={department.id}
          data-testid={`department-${branchIndex}-${index}`}
        >
          <div className="row-heading">
            <h4>Отдел {index + 1}</h4>
            <div className="row-actions">
              <Button
                htmlType="button"
                size="small"
                disabled={index === 0}
                onClick={() => mutate(() => array.move(index, index - 1))}
              >
                Выше
              </Button>
              <Button
                htmlType="button"
                size="small"
                danger
                onClick={() => mutate(() => array.remove(index))}
              >
                Удалить отдел
              </Button>
            </div>
          </div>
          <div className="fields-grid">
            <Slot name={`branches.${branchIndex}.departments.${index}.name`} />
            <Slot name={`branches.${branchIndex}.departments.${index}.costCenter`} />
          </div>
          <Members
            key={`member-path-${branchIndex}-${index}`}
            branchIndex={branchIndex}
            departmentIndex={index}
          />
        </article>
      ))}
      {!array.fields.length && <p className="empty-note">В этом филиале пока нет отделов.</p>}
    </div>
  );
}
function BranchHeading({ index }: { index: number }) {
  const { control } = useFormContext<ApplicationValues>();
  const name = useWatch({ control, name: `branches.${index}.name` });
  return (
    <h3>
      <span className="item-index">Филиал {index + 1}</span> {name || 'Новый филиал'}
    </h3>
  );
}
export function BranchesSection() {
  const form = useFormContext<ApplicationValues>();
  const mutate = useArrayMutation();
  const array = useFieldArray({
    control: form.control,
    name: 'branches',
    rules: { required: 'Добавьте хотя бы один филиал' },
  });
  return (
    <section className="form-section" aria-labelledby="branches-heading">
      <div className="section-heading">
        <div>
          <span className="eyebrow">03 / Три уровня вложенности</span>
          <h2 id="branches-heading">
            Филиалы и команды <Tag>{array.fields.length}</Tag>
          </h2>
        </div>
        <Button htmlType="button" onClick={() => mutate(() => array.append(newBranch()))}>
          Добавить филиал
        </Button>
      </div>
      <p className="section-note">
        Филиал → отделы → сотрудники. Страна загружает свой справочник городов, сотрудников можно
        искать по имени.
      </p>
      {array.fields.map((branch, index) => (
        <article className="array-card branch-card" key={branch.id} data-testid={`branch-${index}`}>
          <div className="row-heading">
            <BranchHeading index={index} />
            <div className="row-actions">
              <Button
                htmlType="button"
                size="small"
                aria-label={`Поднять филиал ${index + 1}`}
                disabled={index === 0}
                onClick={() => mutate(() => array.move(index, index - 1))}
              >
                Выше
              </Button>
              <Button
                htmlType="button"
                size="small"
                disabled={index === array.fields.length - 1}
                onClick={() => mutate(() => array.move(index, index + 1))}
              >
                Ниже
              </Button>
              <Button
                htmlType="button"
                size="small"
                onClick={() =>
                  mutate(() =>
                    array.insert(index + 1, structuredClone(form.getValues(`branches.${index}`))),
                  )
                }
              >
                Копировать
              </Button>
              <Button
                htmlType="button"
                size="small"
                danger
                onClick={() => mutate(() => array.remove(index))}
              >
                Удалить филиал
              </Button>
            </div>
          </div>
          <div className="fields-grid">
            <Slot name={`branches.${index}.name`} />
            <Slot name={`branches.${index}.budget`} />
            <CountryCityFields
              countryName={`branches.${index}.address.country`}
              cityName={`branches.${index}.address.city`}
            />
            <div className="full-width">
              <Slot name={`branches.${index}.address.street`} />
            </div>
          </div>
          <Departments key={`department-path-${index}`} branchIndex={index} />
        </article>
      ))}
      {!array.fields.length && (
        <p className="empty-note">
          Филиалы удалены. Попробуйте добавить новую вложенную структуру с нуля.
        </p>
      )}
    </section>
  );
}
