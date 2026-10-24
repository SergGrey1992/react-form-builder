import type { ComponentProps } from 'react';
import { forwardRef } from 'react';
import { createFormBuilder, createFormAdapter, defineField } from '../src';
import type { BindingContext } from '../src';
const Input = forwardRef<HTMLInputElement, ComponentProps<'input'>>((props, ref) => (
  <input {...props} ref={ref} />
));
const bind = ({ field, controlProps }: BindingContext) => ({
  ...controlProps,
  ...field,
  value: String(field.value ?? ''),
});
const kit = createFormBuilder({
  adapter: createFormAdapter({
    fields: {
      text: defineField({ component: Input, bind }),
      password: defineField({ component: Input, defaults: { type: 'password' }, bind }),
    },
  }),
});
kit.defineFields<{ email: string; password: string }>()([
  { name: 'email', type: 'text', props: { type: 'email', autoComplete: 'email' } },
  { name: 'password', type: 'password', props: { autoComplete: 'current-password' } },
]);
