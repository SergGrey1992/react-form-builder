import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { useOptions } from '../app/use-options';
import type { Option } from '../app/mock-api';
afterEach(cleanup);
it('ignores old promise results after the request changes', async () => {
  let resolveOld!: (options: Option[]) => void;
  let resolveNew!: (options: Option[]) => void;
  const oldLoader = () =>
    new Promise<Option[]>((resolve) => {
      resolveOld = resolve;
    });
  const newLoader = () =>
    new Promise<Option[]>((resolve) => {
      resolveNew = resolve;
    });
  const { result, rerender } = renderHook(({ key, loader }) => useOptions(key, loader), {
    initialProps: { key: 'old', loader: oldLoader },
  });
  rerender({ key: 'new', loader: newLoader });
  await act(async () => resolveNew([{ value: 'new', label: 'New' }]));
  await act(async () => resolveOld([{ value: 'old', label: 'Old' }]));
  expect(result.current.options).toEqual([{ value: 'new', label: 'New' }]);
  expect(result.current.loading).toBe(false);
});
it('exposes failures and supports retrying', async () => {
  let attempts = 0;
  const loader = async () => {
    if (++attempts === 1) throw new Error('Failed');
    return [{ value: 'ok', label: 'OK' }];
  };
  const { result } = renderHook(() => useOptions('request', loader));
  await waitFor(() => expect(result.current.error).toBe('Failed'));
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.options).toEqual([{ value: 'ok', label: 'OK' }]));
  expect(result.current.error).toBeNull();
});
