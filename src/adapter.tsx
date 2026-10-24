'use client';
import { createContext, useContext, useMemo } from 'react';
import type { ComponentProps, ElementType, PropsWithChildren } from 'react';
import type { AdapterOverride, DefaultWrapperProps, FieldRegistry, FormAdapter } from './types';
export function defineField<C extends ElementType, B extends Record<string, unknown>>(definition: {
  component: C;
  bind: (context: import('./types').BindingContext) => B;
  defaults?: never;
}): { component: C; bind: (context: import('./types').BindingContext) => B; defaults?: {} };
export function defineField<
  C extends ElementType,
  B extends Record<string, unknown>,
  const D extends Partial<ComponentProps<C>>,
>(definition: {
  component: C;
  bind: (context: import('./types').BindingContext) => B;
  defaults: D;
}): { component: C; bind: (context: import('./types').BindingContext) => B; defaults: D };
export function defineField(definition: import('./types').FieldDefinition) {
  return definition;
}
export function createFormAdapter<
  const R extends FieldRegistry,
  W extends object = DefaultWrapperProps,
>(adapter: FormAdapter<R, W>): FormAdapter<R, W> {
  return adapter;
}
export const AdapterContext = createContext<FormAdapter | undefined>(undefined);
export function mergeAdapter(
  parent: FormAdapter | undefined,
  local?: AdapterOverride,
): FormAdapter | undefined {
  if (!parent && !local?.fields) return undefined;
  return { ...parent, ...local, fields: { ...parent?.fields, ...local?.fields } as FieldRegistry };
}
export function FormBuilderProvider<W extends object = DefaultWrapperProps>({
  adapter,
  children,
}: PropsWithChildren<{ adapter: AdapterOverride<FieldRegistry, W> }>) {
  const parent = useContext(AdapterContext);
  const value = useMemo(
    () => mergeAdapter(parent, adapter as unknown as AdapterOverride),
    [parent, adapter],
  );
  return <AdapterContext.Provider value={value}>{children}</AdapterContext.Provider>;
}
