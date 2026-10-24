import type {
  ComponentProps,
  ElementType,
  ReactNode,
  HTMLAttributes,
  ButtonHTMLAttributes,
  FormHTMLAttributes,
} from 'react';
import type {
  ControllerFieldState,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  SubmitErrorHandler,
  SubmitHandler,
  UseControllerProps,
  UseControllerReturn,
  UseFormReturn,
} from 'react-hook-form';

export type DataAttributes = { [K in `data-${string}`]?: string | number | boolean | undefined };
export interface BindingContext {
  field: Omit<ControllerRenderProps, 'value'> & { value: unknown };
  fieldState: ControllerFieldState;
  controlProps: {
    id: string;
    name: string;
    disabled?: boolean;
    'aria-invalid': boolean;
    'aria-required'?: boolean;
    'aria-describedby'?: string;
  };
}
export interface FieldDefinition<C extends ElementType = ElementType> {
  component: C;
  bind: (context: BindingContext) => Record<string, unknown>;
  defaults?: Partial<ComponentProps<C>> & DataAttributes;
}
export type FieldRegistry = Record<string, FieldDefinition>;
export type DefaultWrapperProps = HTMLAttributes<HTMLDivElement> & DataAttributes;
export interface WrapperContext<W extends object = DefaultWrapperProps> {
  children: ReactNode;
  id: string;
  label?: ReactNode;
  description?: ReactNode;
  help?: ReactNode;
  required?: boolean;
  descriptionId: string;
  helpId: string;
  errorId: string;
  fieldState: ControllerFieldState;
  wrapperProps: W;
}
export interface FormAdapter<
  R extends FieldRegistry = FieldRegistry,
  W extends object = DefaultWrapperProps,
> {
  fields: R;
  renderWrapper?: (context: WrapperContext<W>) => ReactNode;
  renderSubmit?: (
    props: ButtonHTMLAttributes<HTMLButtonElement> & { loading: boolean },
  ) => ReactNode;
}
export type AdapterOverride<
  R extends FieldRegistry = FieldRegistry,
  W extends object = DefaultWrapperProps,
> = Partial<Omit<FormAdapter<R, W>, 'fields'>> & { fields?: Partial<R> };
type ProtectedProps = 'name' | 'value' | 'checked' | 'defaultValue' | 'defaultChecked';
type SuppliedKeys<D extends FieldDefinition> =
  keyof ReturnType<D['bind']> | keyof NonNullable<D['defaults']>;
export type FieldProps<D extends FieldDefinition> = Omit<
  ComponentProps<D['component']>,
  ProtectedProps | SuppliedKeys<D>
> &
  Partial<
    Pick<
      ComponentProps<D['component']>,
      Exclude<Extract<SuppliedKeys<D>, keyof ComponentProps<D['component']>>, ProtectedProps>
    >
  > &
  DataAttributes;
type RequiredKeys<P> = { [K in keyof P]-?: {} extends Pick<P, K> ? never : K }[keyof P];
type ConfigurationProps<D extends FieldDefinition> = [RequiredKeys<FieldProps<D>>] extends [never]
  ? { props?: FieldProps<D> }
  : { props: FieldProps<D> };
export type FieldConfig<
  T extends FieldValues,
  R extends FieldRegistry,
  N extends FieldPath<T> = FieldPath<T>,
  W extends object = DefaultWrapperProps,
> = {
  [K in keyof R & string]: {
    name: N;
    type: K;
    label?: ReactNode;
    description?: ReactNode;
    help?: ReactNode;
    required?: boolean;
    disabled?: boolean;
    rules?: UseControllerProps<T, N>['rules'];
    shouldUnregister?: boolean;
    wrapperProps?: W;
  } & ConfigurationProps<R[K]>;
}[keyof R & string];
export type BuilderProps<
  T extends FieldValues,
  R extends FieldRegistry,
  Context = unknown,
  Output extends FieldValues = T,
  W extends object = DefaultWrapperProps,
> = Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'onInvalid'> & {
  form: UseFormReturn<T, Context, Output>;
  fields: readonly FieldConfig<T, R, FieldPath<T>, W>[];
  adapter?: AdapterOverride<R, W>;
  onSubmit?: SubmitHandler<Output>;
  onInvalid?: SubmitErrorHandler<T>;
  loading?: boolean;
  submit?: ReactNode | false;
};
export type SlotProps<
  T extends FieldValues,
  R extends FieldRegistry,
  F extends readonly { name: FieldPath<T>; type: keyof R }[],
  N extends F[number]['name'],
  W extends object = DefaultWrapperProps,
> = {
  name: N;
  props?: Partial<FieldProps<R[Extract<F[number], { name: N }>['type']]>>;
  wrapperProps?: W;
  children?: (
    context: UseControllerReturn<T, N> & { controlProps: BindingContext['controlProps'] },
  ) => ReactNode;
};

/** Keeps literal field names without letting generic inference swallow excess props. */
export type CheckedFields<
  R extends FieldRegistry,
  F extends readonly { type: keyof R; props?: object; wrapperProps?: object }[],
  W extends object = DefaultWrapperProps,
> = {
  [I in keyof F]: F[I] & {
    props?: Record<
      Exclude<keyof NonNullable<F[I]['props']>, keyof FieldProps<R[F[I]['type']]>>,
      never
    >;
    wrapperProps?: Record<Exclude<keyof NonNullable<F[I]['wrapperProps']>, keyof W>, never>;
  };
};
