import { forwardRef } from 'react';
import type { ComponentProps } from 'react';
import { render } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { expect, it, vi } from 'vitest';
import { createFormAdapter, createFormBuilder, defineField } from '../src';
const Input = forwardRef<HTMLInputElement, ComponentProps<'input'>>((props, ref) => (
  <input {...props} ref={ref} />
));
const kit = createFormBuilder({
  adapter: createFormAdapter({
    fields: {
      text: defineField({
        component: Input,
        bind: ({ field, controlProps }) => ({
          ...controlProps,
          ...field,
          value: String(field.value ?? ''),
        }),
      }),
    },
  }),
});
const config = kit.defineFields<{ title: string }>()([{ name: 'title', type: 'text' }]);
it('preserves React 19 user callback ref cleanup', () => {
  const cleanup = vi.fn();
  function Case() {
    const form = useForm({ defaultValues: { title: '' } });
    return (
      <config.Form form={form}>
        <config.Form.Slot
          name="title"
          props={{
            ref: (element) => {
              if (element) return cleanup;
            },
          }}
        />
      </config.Form>
    );
  }
  const view = render(<Case />);
  cleanup.mockClear();
  view.unmount();
  expect(cleanup).toHaveBeenCalledOnce();
});
