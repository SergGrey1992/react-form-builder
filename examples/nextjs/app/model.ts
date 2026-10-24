export interface Phone {
  kind: 'work' | 'mobile';
  number: string;
}
export interface Contact {
  fullName: string;
  email: string;
  position: string;
  primary: boolean;
  phones: Phone[];
}
export interface Member {
  employeeId: string;
  role: string;
  allocation: number;
}
export interface Department {
  name: string;
  costCenter: string;
  members: Member[];
}
export interface Branch {
  name: string;
  address: { country: string; city: string; street: string };
  budget: number;
  departments: Department[];
}
export interface ApplicationValues {
  company: {
    kind: 'company' | 'individual';
    name: string;
    taxId: string;
    registrationNumber: string;
    website: string;
    industry: string;
    annualBudget: number;
    notes: string;
  };
  headquarters: { country: string; city: string; street: string; postalCode: string };
  contacts: Contact[];
  branches: Branch[];
  preferences: {
    notifications: boolean;
    notificationEmail: string;
    channels: string[];
    requiresApproval: boolean;
    approver: string;
    accepted: boolean;
  };
}
export const newPhone = (): Phone => ({ kind: 'mobile', number: '' });
export const newContact = (): Contact => ({
  fullName: '',
  email: '',
  position: '',
  primary: false,
  phones: [newPhone()],
});
export const newMember = (): Member => ({ employeeId: '', role: 'specialist', allocation: 100 });
export const newDepartment = (): Department => ({
  name: '',
  costCenter: '',
  members: [newMember()],
});
export const newBranch = (): Branch => ({
  name: '',
  address: { country: '', city: '', street: '' },
  budget: 10000,
  departments: [newDepartment()],
});
export function createEmptyValues(): ApplicationValues {
  return {
    company: {
      kind: 'company',
      name: '',
      taxId: '',
      registrationNumber: '',
      website: '',
      industry: '',
      annualBudget: 100000,
      notes: '',
    },
    headquarters: { country: '', city: '', street: '', postalCode: '' },
    contacts: [],
    branches: [],
    preferences: {
      notifications: false,
      notificationEmail: '',
      channels: [],
      requiresApproval: false,
      approver: '',
      accepted: false,
    },
  };
}
export function createDemoValues(): ApplicationValues {
  return {
    company: {
      kind: 'company',
      name: 'Северные технологии',
      taxId: '193847562',
      registrationNumber: 'REG-2026-1042',
      website: 'https://example.com',
      industry: 'it',
      annualBudget: 250000,
      notes: 'Заявка на подключение филиалов. Все данные в примере вымышлены.',
    },
    headquarters: {
      country: 'by',
      city: 'minsk',
      street: 'ул. Примерная, 12',
      postalCode: '220000',
    },
    contacts: [
      {
        fullName: 'Анна Демонстрационная',
        email: 'anna@example.com',
        position: 'Руководитель проекта',
        primary: true,
        phones: [
          { kind: 'work', number: '+375 17 000-00-01' },
          { kind: 'mobile', number: '+375 29 000-00-01' },
        ],
      },
      {
        fullName: 'Иван Примеров',
        email: 'ivan@example.com',
        position: 'Финансовый менеджер',
        primary: false,
        phones: [{ kind: 'work', number: '+375 17 000-00-02' }],
      },
    ],
    branches: [
      {
        name: 'Минский офис',
        address: { country: 'by', city: 'minsk', street: 'ул. Тестовая, 5' },
        budget: 85000,
        departments: [
          {
            name: 'Разработка',
            costCenter: 'DEV-01',
            members: [
              { employeeId: 'e1', role: 'lead', allocation: 100 },
              { employeeId: 'e2', role: 'specialist', allocation: 75 },
            ],
          },
          {
            name: 'Поддержка',
            costCenter: 'SUP-01',
            members: [{ employeeId: 'e3', role: 'manager', allocation: 50 }],
          },
        ],
      },
      {
        name: 'Варшавский офис',
        address: { country: 'pl', city: 'warsaw', street: 'Demo Street, 8' },
        budget: 65000,
        departments: [
          {
            name: 'Продажи',
            costCenter: 'SALE-02',
            members: [{ employeeId: 'e4', role: 'manager', allocation: 100 }],
          },
        ],
      },
    ],
    preferences: {
      notifications: true,
      notificationEmail: 'operations@example.com',
      channels: ['email', 'dashboard'],
      requiresApproval: true,
      approver: 'e5',
      accepted: false,
    },
  };
}
export function flattenErrors(value: unknown, path = ''): { path: string; message: string }[] {
  if (!value || typeof value !== 'object') return [];
  if ('message' in value && typeof value.message === 'string')
    return [{ path, message: value.message }];
  return Object.entries(value).flatMap(([key, nested]) =>
    key === 'ref' ? [] : flattenErrors(nested, path ? `${path}.${key}` : key),
  );
}
export function summarize(values: ApplicationValues) {
  const departments = values.branches.flatMap((branch) => branch.departments);
  return {
    contacts: values.contacts.length,
    phones: values.contacts.reduce((sum, contact) => sum + contact.phones.length, 0),
    branches: values.branches.length,
    departments: departments.length,
    members: departments.reduce((sum, department) => sum + department.members.length, 0),
    budget: values.branches.reduce((sum, branch) => sum + (Number(branch.budget) || 0), 0),
  };
}
