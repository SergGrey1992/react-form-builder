import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchCountries, fetchCities, searchEmployees } from '../app/mock-api';
import { createDemoValues, createEmptyValues, flattenErrors } from '../app/model';
afterEach(() => vi.useRealTimers());
describe('mock data and model', () => {
  it('loads countries and filters cities by parent country', async () => {
    vi.useFakeTimers();
    const countries = fetchCountries();
    const cities = fetchCities('by');
    await vi.runAllTimersAsync();
    expect((await countries).map((o) => o.value)).toContain('by');
    expect((await cities).map((o) => o.value)).toContain('minsk');
    expect((await cities).map((o) => o.value)).not.toContain('warsaw');
  });
  it('searches employee names and rejects a simulated server error', async () => {
    vi.useFakeTimers();
    const search = searchEmployees('Анна');
    await vi.runAllTimersAsync();
    expect(await search).toHaveLength(2);
    expect((await search).every((o) => o.label.includes('Анна'))).toBe(true);
    const failed = searchEmployees('ошибка');
    const assertion = expect(failed).rejects.toThrow('Моковый сервер');
    await vi.runAllTimersAsync();
    await assertion;
  });
  it('returns fresh nested defaults and includes three array levels', () => {
    const first = createDemoValues();
    const second = createDemoValues();
    first.branches[0]!.departments[0]!.members[0]!.role = 'changed';
    expect(second.branches[0]!.departments[0]!.members[0]!.role).not.toBe('changed');
    expect(second.contacts[0]!.phones.length).toBeGreaterThan(0);
    expect(createEmptyValues().branches).toEqual([]);
  });
  it('flattens error messages without traversing DOM refs or cycles', () => {
    const circular: Record<string, unknown> = {};
    circular.current = circular;
    expect(
      flattenErrors({
        company: { name: { message: 'Required', ref: circular } },
        branches: [{ name: { message: 'Branch required' } }],
      }),
    ).toEqual([
      { path: 'company.name', message: 'Required' },
      { path: 'branches.0.name', message: 'Branch required' },
    ]);
  });
});
