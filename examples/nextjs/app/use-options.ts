'use client';
import { useEffect, useState } from 'react';
import type { Option } from './mock-api';
export function useOptions(key: string, loader: () => Promise<Option[]>, enabled = true) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{
    key: string;
    options: Option[];
    loading: boolean;
    error: string | null;
  }>({ key, options: [], loading: enabled, error: null });
  useEffect(() => {
    let active = true;
    if (!enabled) {
      setState({ key, options: [], loading: false, error: null });
      return;
    }
    setState({ key, options: [], loading: true, error: null });
    void loader().then(
      (options) => {
        if (active) setState({ key, options, loading: false, error: null });
      },
      (error) => {
        if (active)
          setState({
            key,
            options: [],
            loading: false,
            error: error instanceof Error ? error.message : 'Ошибка загрузки',
          });
      },
    );
    return () => {
      active = false;
    };
  }, [key, loader, enabled, revision]);
  const current = state.key === key ? state : { key, options: [], loading: enabled, error: null };
  return {
    options: current.options,
    loading: current.loading,
    error: current.error,
    retry: () => setRevision((value) => value + 1),
  };
}
