'use client';
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  version,
} from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { FormProvider, useController, useFormState } from 'react-hook-form';
import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';
import { AdapterContext, FormBuilderProvider, mergeAdapter } from './adapter';
import type {
  AdapterOverride,
  BindingContext,
  BuilderProps,
  CheckedFields,
  DefaultWrapperProps,
  FieldConfig,
  FieldRegistry,
  FormAdapter,
  SlotProps,
  WrapperContext,
} from './types';

type RuntimeField = FieldConfig<FieldValues, FieldRegistry>;
interface RuntimeContext {
  form: UseFormReturn<FieldValues, unknown, FieldValues>;
  fields: Map<string, RuntimeField>;
  adapter: FormAdapter;
  loading: boolean;
  slots: Map<string, symbol>;
}
const FormContext = createContext<RuntimeContext | undefined>(undefined);
function useBuilderContext() {
  const context = useContext(FormContext);
  if (!context) throw new Error('FormBuilder.Slot/Submit must be inside a FormBuilder.');
  return context;
}
function ids(...values: unknown[]) {
  return (
    [
      ...new Set(
        values
          .filter((v): v is string => typeof v === 'string')
          .flatMap((v) => v.split(/\s+/))
          .filter(Boolean),
      ),
    ].join(' ') || undefined
  );
}
function DefaultWrapper({
  children,
  id,
  label,
  description,
  help,
  required,
  descriptionId,
  helpId,
  errorId,
  fieldState,
  wrapperProps,
}: WrapperContext) {
  return (
    <div {...wrapperProps}>
      {label != null && (
        <label htmlFor={id}>
          {label}
          {required ? ' *' : null}
        </label>
      )}
      {children}
      {description != null && <div id={descriptionId}>{description}</div>}
      {help != null && <div id={helpId}>{help}</div>}
      {fieldState.error?.message && (
        <div id={errorId} role="alert">
          {fieldState.error.message}
        </div>
      )}
    </div>
  );
}
function attachRef(ref: unknown, value: unknown): (() => void) | undefined {
  if (typeof ref === 'function') {
    const cleanup: unknown = ref(value);
    return typeof cleanup === 'function' ? (cleanup as () => void) : undefined;
  }
  if (ref && typeof ref === 'object' && 'current' in ref)
    (ref as { current: unknown }).current = value;
}
function composeProps(user: Record<string, unknown>, bound: Record<string, unknown>) {
  const result = { ...user, ...bound };
  for (const key of Object.keys(bound)) {
    const binding = bound[key];
    const callback = user[key];
    if (
      (key === 'ref' || /Ref$/.test(key)) &&
      typeof binding === 'function' &&
      callback &&
      binding !== callback
    ) {
      let bindingCleanup: (() => void) | undefined;
      let userCleanup: (() => void) | undefined;
      const cleanup = () => {
        if (bindingCleanup) bindingCleanup();
        else attachRef(binding, null);
        if (userCleanup) userCleanup();
        else attachRef(callback, null);
        bindingCleanup = undefined;
        userCleanup = undefined;
      };
      result[key] = (value: unknown) => {
        if (value == null) {
          cleanup();
          return;
        }
        bindingCleanup = attachRef(binding, value);
        userCleanup = attachRef(callback, value);
        // React 18 calls ref(null); React 19 honors a returned cleanup.
        if ((bindingCleanup || userCleanup) && Number(version.split('.')[0]) >= 19) return cleanup;
      };
    } else if (
      /^on[A-Z]/.test(key) &&
      typeof binding === 'function' &&
      typeof callback === 'function' &&
      binding !== callback
    ) {
      result[key] = (...args: unknown[]) => {
        binding(...args);
        callback(...args);
      };
    }
  }
  result['aria-describedby'] = ids(user['aria-describedby'], bound['aria-describedby']);
  return result;
}

interface RuntimeSlotProps {
  name: string;
  props?: Record<string, unknown>;
  wrapperProps?: WrapperContext['wrapperProps'];
  children?: (context: unknown) => ReactNode;
}
function Slot({ name, props, wrapperProps, children }: RuntimeSlotProps) {
  const context = useBuilderContext();
  const config = context.fields.get(name);
  if (!config)
    throw new Error(
      `FormBuilder: unknown slot "${name}". Available: ${[...context.fields.keys()].join(', ')}`,
    );
  return (
    <ControlledField context={context} config={config} props={props} wrapperProps={wrapperProps}>
      {children}
    </ControlledField>
  );
}
function ControlledField({
  context,
  config,
  props: slotProps,
  wrapperProps,
  children,
}: {
  context: RuntimeContext;
  config: RuntimeField;
  props?: Record<string, unknown>;
  wrapperProps?: WrapperContext['wrapperProps'];
  children?: (context: unknown) => ReactNode;
}) {
  const generatedId = useId();
  const token = useRef(Symbol());
  const definition = context.adapter.fields[config.type];
  if (!definition) throw new Error(`FormBuilder: field type "${config.type}" is not registered.`);
  const user = { ...definition.defaults, ...config.props, ...slotProps } as Record<string, unknown>;
  const disabled =
    config.disabled ?? (typeof user.disabled === 'boolean' ? user.disabled : undefined);
  const controller = useController({
    name: config.name,
    control: context.form.control,
    rules: config.rules,
    shouldUnregister: config.shouldUnregister,
    disabled,
  });
  const id = typeof user.id === 'string' ? user.id : `fb-${generatedId}`;
  const descriptionId = `${id}-description`;
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const displayController = {
    ...controller,
    field: { ...controller.field, disabled: context.loading || controller.field.disabled },
  };
  const controlProps: BindingContext['controlProps'] = {
    id,
    name: config.name,
    disabled: displayController.field.disabled,
    'aria-invalid': controller.fieldState.invalid,
    'aria-required': config.required || undefined,
    'aria-describedby': ids(
      user['aria-describedby'],
      config.description != null && descriptionId,
      config.help != null && helpId,
      controller.fieldState.error?.message && errorId,
    ),
  };
  useEffect(() => {
    const registry = context.slots;
    const owner = token.current;
    if (registry.has(config.name))
      throw new Error(`FormBuilder: duplicate slot "${config.name}". Render each field once.`);
    registry.set(config.name, owner);
    return () => {
      if (registry.get(config.name) === owner) registry.delete(config.name);
    };
  }, [context.slots, config.name]);
  const bound = definition.bind({ ...displayController, controlProps });
  const control = children
    ? children({ ...displayController, controlProps })
    : createElement(definition.component, composeProps(user, bound));
  const renderWrapper = context.adapter.renderWrapper ?? DefaultWrapper;
  return renderWrapper({
    children: control,
    id,
    label: config.label,
    description: config.description,
    help: config.help,
    required: config.required,
    descriptionId,
    helpId,
    errorId,
    fieldState: controller.fieldState,
    wrapperProps: {
      ...config.wrapperProps,
      ...wrapperProps,
      className:
        [config.wrapperProps?.className, wrapperProps?.className].filter(Boolean).join(' ') ||
        undefined,
    },
  });
}
function Submit({
  children = 'Submit',
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const context = useBuilderContext();
  const { isSubmitting } = useFormState({ control: context.form.control });
  const button = {
    ...props,
    type: 'submit' as const,
    disabled: disabled || context.loading || isSubmitting,
    children,
  };
  return context.adapter.renderSubmit ? (
    context.adapter.renderSubmit({ ...button, loading: isSubmitting || context.loading })
  ) : (
    <button {...button} />
  );
}
function BaseBuilder<
  T extends FieldValues,
  R extends FieldRegistry,
  C = unknown,
  O extends FieldValues = T,
>({
  form,
  fields,
  adapter: localAdapter,
  onSubmit,
  onInvalid,
  loading = false,
  submit = false,
  children,
  ...formProps
}: BuilderProps<T, R, C, O> & { fallback?: FormAdapter<R> }) {
  const { fallback, ...htmlProps } = formProps;
  const provided = useContext(AdapterContext);
  const adapter = useMemo(
    () => mergeAdapter(mergeAdapter(fallback, provided), localAdapter),
    [fallback, provided, localAdapter],
  );
  if (!adapter)
    throw new Error(
      'FormBuilder: no adapter. Use FormBuilderProvider, adapter prop, or createFormBuilder({ adapter }).',
    );
  const slots = useMemo(() => new Map<string, symbol>(), []);
  const fieldMap = useMemo(() => {
    const map = new Map<string, RuntimeField>();
    for (const field of fields) {
      if (map.has(field.name))
        throw new Error(`FormBuilder: duplicate field configuration "${field.name}".`);
      map.set(field.name, field as RuntimeField);
    }
    return map;
  }, [fields]);
  const context = useMemo<RuntimeContext>(
    () => ({
      form: form as unknown as RuntimeContext['form'],
      fields: fieldMap,
      adapter,
      loading,
      slots,
    }),
    [form, fieldMap, adapter, loading, slots],
  );
  const submitting = useRef(false);
  return (
    <FormProvider {...form}>
      <FormContext.Provider value={context}>
        <form
          {...htmlProps}
          aria-busy={loading || undefined}
          onSubmit={async (event) => {
            event.preventDefault();
            if (loading || submitting.current || !onSubmit) return;
            submitting.current = true;
            try {
              await form.handleSubmit(onSubmit, onInvalid)(event);
            } finally {
              submitting.current = false;
            }
          }}
        >
          <fieldset
            disabled={loading}
            aria-label="Form fields"
            style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}
          >
            {children === undefined ? (
              <>
                <div
                  style={{
                    display: 'grid',
                    gap: '1rem',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 16rem), 1fr))',
                  }}
                >
                  {fields.map((field) => (
                    <Slot key={field.name} name={field.name} />
                  ))}
                </div>
                {submit !== false && <Submit>{submit}</Submit>}
              </>
            ) : (
              children
            )}
          </fieldset>
        </form>
      </FormContext.Provider>
    </FormProvider>
  );
}
export const FormBuilder = Object.assign(BaseBuilder, { Slot, Submit });
export function createFormBuilder<
  const R extends FieldRegistry,
  W extends object = DefaultWrapperProps,
>({ adapter }: { adapter: FormAdapter<R, W> }) {
  function Builder<T extends FieldValues, C = unknown, O extends FieldValues = T>(
    props: BuilderProps<T, R, C, O, W>,
  ) {
    return (
      <BaseBuilder
        {...(props as unknown as BuilderProps<T, R, C, O>)}
        fallback={adapter as unknown as FormAdapter<R>}
      />
    );
  }
  const TypedBuilder = Object.assign(Builder, { Slot, Submit });
  function defineFields<T extends FieldValues>() {
    return <const F extends readonly FieldConfig<T, R, FieldPath<T>, W>[]>(
      fields: F & CheckedFields<R, F, W>,
    ) => {
      function Form<C = unknown, O extends FieldValues = T>(
        props: Omit<BuilderProps<T, R, C, O, W>, 'fields'> & {
          fields?: readonly FieldConfig<T, R, FieldPath<T>, W>[];
        },
      ) {
        return <Builder {...props} fields={props.fields ?? fields} />;
      }
      function TypedSlot<N extends F[number]['name']>(props: SlotProps<T, R, F, N, W>) {
        return <Slot {...(props as unknown as RuntimeSlotProps)} />;
      }
      return { fields, Form: Object.assign(Form, { Slot: TypedSlot, Submit }) };
    };
  }
  function Provider({
    children,
    adapter: local,
  }: {
    children?: ReactNode;
    adapter?: AdapterOverride<R, W>;
  }) {
    return (
      <FormBuilderProvider
        adapter={mergeAdapter(
          adapter as unknown as FormAdapter,
          local as unknown as AdapterOverride,
        )!}
      >
        {children}
      </FormBuilderProvider>
    );
  }
  return { FormBuilder: TypedBuilder, Provider, defineFields };
}
