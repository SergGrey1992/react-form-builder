import type { ComponentProps } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFormAdapter, createFormBuilder, defineField } from '../src';
const Input = (props: ComponentProps<'input'>) => <input {...props} />;
const Select = (props: {
  options: readonly string[];
  mode?: 'single' | 'multiple';
  value?: unknown;
  onChange?: (value: string) => void;
}) => <span>{props.options.join(',')}</span>;
const kit = createFormBuilder({
  adapter: createFormAdapter({
    fields: {
      text: defineField({
        component: Input,
        bind: ({ field, controlProps }) => ({ ...controlProps, ...field }),
      }),
      select: defineField({
        component: Select,
        bind: ({ field }) => ({ value: field.value, onChange: field.onChange }),
      }),
    },
  }),
});
type Values = {
  email: string;
  address: { city: string };
  age: string;
  contacts: { name: string }[];
};
const config = kit.defineFields<Values>()([
  {
    name: 'email',
    type: 'text',
    props: { autoComplete: 'email', maxLength: 30, 'aria-label': 'Email', 'data-testid': 'email' },
  },
  { name: 'address.city', type: 'select', props: { options: ['a'], mode: 'single' } },
]);
kit.defineFields<Values>()([
  // @ts-expect-error nonexistent field
  { name: 'unknown', type: 'text' },
]);
kit.defineFields<Values>()([
  // @ts-expect-error unknown registry type
  { name: 'email', type: 'password' },
]);
kit.defineFields<Values>()([
  // @ts-expect-error wrong component props
  { name: 'email', type: 'text', props: { options: [] } },
]);
kit.defineFields<Values>()([
  // @ts-expect-error literal union preserved
  { name: 'email', type: 'select', props: { options: [], mode: 'bad' } },
]);
kit.defineFields<Values>()([
  // @ts-expect-error protected controlled value
  { name: 'email', type: 'text', props: { value: 'break' } },
]);
kit.defineFields<Values>()([{ name: 'contacts.0.name', type: 'text' }]);
<config.Form.Slot
  name="email"
  props={{ placeholder: 'x', onChange: (event) => event.target.value }}
/>;
<config.Form.Slot name="address.city" props={{ mode: 'multiple' }} />;
// @ts-expect-error field exists in values but not in configuration
<config.Form.Slot name="age" />;
// @ts-expect-error wrong slot name
<config.Form.Slot name="unknown" />;
// @ts-expect-error wrong slot props
<config.Form.Slot name="email" props={{ mode: 'single' }} />;
// @ts-expect-error wrong select props
<config.Form.Slot name="address.city" props={{ placeholder: 'x' }} />;
<config.Form.Slot name="email">
  {({ field, fieldState, formState, controlProps }) => {
    const text: string = field.value;
    return (
      <input
        {...controlProps}
        {...field}
        value={text}
        aria-invalid={fieldState.invalid || !formState.isValid}
      />
    );
  }}
</config.Form.Slot>;
const schema = z.object({ age: z.string().transform(Number) });
const ageForm = kit.defineFields<z.input<typeof schema>>()([{ name: 'age', type: 'text' }]);
export function Transformed() {
  const form = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
  });
  return (
    <ageForm.Form
      form={form}
      onSubmit={(values) => {
        const age: number = values.age;
        void age;
        // @ts-expect-error output is number
        const bad: string = values.age;
        void bad;
      }}
    />
  );
}
export function Inference() {
  const form = useForm<Values>();
  return (
    <kit.FormBuilder
      form={form}
      fields={[
        // @ts-expect-error infer values from native form
        { name: 'bad', type: 'text' },
      ]}
    />
  );
}
const wrapped = createFormBuilder({
  adapter: createFormAdapter({
    fields: { text: defineField({ component: Input, bind: ({ field }) => ({ ...field }) }) },
    renderWrapper: (context: import('../src').WrapperContext<{ tone?: 'quiet' | 'loud' }>) => (
      <div data-tone={context.wrapperProps.tone}>{context.children}</div>
    ),
  }),
});
const wrappedConfig = wrapped.defineFields<{ email: string }>()([
  { name: 'email', type: 'text', wrapperProps: { tone: 'quiet' } },
]);
<wrappedConfig.Form.Slot name="email" wrapperProps={{ tone: 'loud' }} />;
// @ts-expect-error wrapper props use independent literal unions
<wrappedConfig.Form.Slot name="email" wrapperProps={{ tone: 'invalid' }} />;
kit.defineFields<Values>()([
  // @ts-expect-error required Select options cannot be omitted
  { name: 'email', type: 'select' },
]);
const defaultSelectKit = createFormBuilder({
  adapter: createFormAdapter({
    fields: {
      select: defineField({
        component: Select,
        defaults: { options: ['default'] },
        bind: ({ field }) => ({ value: field.value }),
      }),
      bound: defineField({
        component: Select,
        bind: ({ field }) => ({ value: field.value, options: ['bound'] }),
      }),
    },
  }),
});
defaultSelectKit.defineFields<Values>()([
  { name: 'email', type: 'select' },
  { name: 'age', type: 'bound' },
]);
