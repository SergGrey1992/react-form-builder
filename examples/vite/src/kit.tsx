import { forwardRef } from 'react';
import type { ComponentProps } from 'react';
import {
  createFormAdapter,
  createFormBuilder,
  defineField,
} from '@serggrey1992/react-form-builder';
const Input = forwardRef<HTMLInputElement, ComponentProps<'input'>>((props, ref) => (
  <input {...props} ref={ref} />
));
// Adapter values are unknown: each adapter explicitly normalizes its input domain.
const bindText = ({
  field,
  controlProps,
}: import('@serggrey1992/react-form-builder').BindingContext) => ({
  ...controlProps,
  ...field,
  value: String(field.value ?? ''),
});
const adapter = createFormAdapter({
  fields: {
    text: defineField({ component: Input, bind: bindText }),
    password: defineField({ component: Input, defaults: { type: 'password' }, bind: bindText }),
  },
});
export const kit = createFormBuilder({ adapter });
