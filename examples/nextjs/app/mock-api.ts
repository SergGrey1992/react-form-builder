export interface Option {
  value: string;
  label: string;
}
const countries: Option[] = [
  { value: 'by', label: 'Беларусь' },
  { value: 'pl', label: 'Польша' },
  { value: 'de', label: 'Германия' },
];
const cities: Record<string, Option[]> = {
  by: [
    { value: 'minsk', label: 'Минск' },
    { value: 'brest', label: 'Брест' },
    { value: 'grodno', label: 'Гродно' },
  ],
  pl: [
    { value: 'warsaw', label: 'Варшава' },
    { value: 'krakow', label: 'Краков' },
    { value: 'gdansk', label: 'Гданьск' },
  ],
  de: [
    { value: 'berlin', label: 'Берлин' },
    { value: 'munich', label: 'Мюнхен' },
    { value: 'hamburg', label: 'Гамбург' },
  ],
};
const employees: Option[] = [
  { value: 'e1', label: 'Анна Волкова · разработка' },
  { value: 'e2', label: 'Михаил Соколов · разработка' },
  { value: 'e3', label: 'Елена Орлова · поддержка' },
  { value: 'e4', label: 'Дмитрий Ковалёв · продажи' },
  { value: 'e5', label: 'Мария Лебедева · финансы' },
  { value: 'e6', label: 'Алексей Новиков · аналитика' },
  { value: 'e7', label: 'Анна Морозова · дизайн' },
  { value: 'e8', label: 'Павел Тестов · инфраструктура' },
];
function request<T>(data: T, delay: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), delay));
}
export const fetchCountries = () => request(countries, 650);
export const fetchCities = (country: string) =>
  request(cities[country] ?? [], country === 'by' ? 950 : 450);
export const fetchIndustries = () =>
  request(
    [
      { value: 'it', label: 'IT и разработка' },
      { value: 'retail', label: 'Розничная торговля' },
      { value: 'logistics', label: 'Логистика' },
      { value: 'manufacturing', label: 'Производство' },
    ],
    800,
  );
export function searchEmployees(query: string): Promise<Option[]> {
  if (query.trim().toLocaleLowerCase('ru') === 'ошибка')
    return new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('Моковый сервер: справочник сотрудников временно недоступен')),
        600,
      ),
    );
  const normalized = query.trim().toLocaleLowerCase('ru');
  return request(
    employees.filter((employee) => employee.label.toLocaleLowerCase('ru').includes(normalized)),
    normalized.length <= 1 ? 900 : 400,
  );
}
export function selectedEmployee(value: string | undefined): Option[] {
  const employee = employees.find((item) => item.value === value);
  return employee ? [employee] : [];
}
export async function saveApplication<T>(values: T): Promise<{ requestId: string; values: T }> {
  return request({ requestId: `DEMO-${Date.now().toString(36).toUpperCase()}`, values }, 1200);
}
