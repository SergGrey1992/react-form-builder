import { StrictMode, forwardRef, useState } from 'react';
import type { ComponentProps } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { describe, expect, it, vi } from 'vitest';
import { createFormAdapter, createFormBuilder, defineField, FormBuilder } from '../src';
const Input = forwardRef<HTMLInputElement, ComponentProps<'input'>>((props, ref) => (
  <input {...props} ref={ref} />
));
const text = defineField({
  component: Input,
  bind: ({ field, controlProps }) => ({ ...controlProps, ...field, value: field.value ?? '' }),
});
const adapter = createFormAdapter({ fields: { text } });
const kit = createFormBuilder({ adapter });
const basic = kit.defineFields<{ title: string }>()([
  { name: 'title', type: 'text', label: 'Title', description: 'Description' },
]);
describe('RHF lifecycle and diagnostics', () => {
  it('diagnoses missing adapter', () => {
    function Case() {
      const form = useForm();
      return <FormBuilder form={form} fields={[]} />;
    }
    expect(() => render(<Case />)).toThrow('no adapter');
  });
  it('diagnoses unknown slots', () => {
    function Case() {
      const form = useForm();
      return (
        <kit.FormBuilder form={form} fields={[]}>
          <kit.FormBuilder.Slot name="missing" />
        </kit.FormBuilder>
      );
    }
    expect(() => render(<Case />)).toThrow('unknown slot "missing"');
  });
  it('diagnoses duplicate slots in StrictMode', () => {
    function Case() {
      const form = useForm({ defaultValues: { title: '' } });
      return (
        <basic.Form form={form}>
          <basic.Form.Slot name="title" />
          <basic.Form.Slot name="title" />
        </basic.Form>
      );
    }
    expect(() =>
      render(
        <StrictMode>
          <Case />
        </StrictMode>,
      ),
    ).toThrow();
  });
  it('diagnoses duplicate configuration', () => {
    function Case() {
      const form = useForm();
      return (
        <kit.FormBuilder
          form={form}
          fields={[
            { name: 'title', type: 'text' },
            { name: 'title', type: 'text' },
          ]}
        />
      );
    }
    expect(() => render(<Case />)).toThrow('duplicate field');
  });
  it('custom render gets typed RHF controller without duplicate registration', async () => {
    const submit = vi.fn();
    function Case() {
      const form = useForm({ defaultValues: { title: '' } });
      return (
        <basic.Form form={form} onSubmit={submit}>
          <basic.Form.Slot name="title">
            {({ field, controlProps }) => (
              <input {...controlProps} {...field} data-testid="custom" />
            )}
          </basic.Form.Slot>
          <basic.Form.Submit>Send</basic.Form.Submit>
        </basic.Form>
      );
    }
    render(<Case />);
    fireEvent.change(screen.getByTestId('custom'), { target: { value: 'custom' } });
    fireEvent.click(screen.getByText('Send'));
    await waitFor(() => expect(submit.mock.calls[0]?.[0]).toEqual({ title: 'custom' }));
  });
  it.each([false, true])(
    'respects shouldUnregister=%s for conditional fields',
    async (unregister) => {
      const submit = vi.fn();
      function Case() {
        const form = useForm({ defaultValues: { title: '' }, shouldUnregister: unregister });
        const [visible, setVisible] = useState(true);
        return (
          <>
            <basic.Form
              form={form}
              fields={visible ? basic.fields : []}
              onSubmit={submit}
              submit="Send"
            />
            <button onClick={() => setVisible((v) => !v)}>Toggle</button>
          </>
        );
      }
      render(<Case />);
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'draft' } });
      fireEvent.click(screen.getByText('Toggle'));
      fireEvent.click(screen.getByText('Toggle'));
      expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe(
        unregister ? '' : 'draft',
      );
      fireEvent.click(screen.getByText('Send'));
      await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    },
  );
  it('composes refs and ARIA IDs', () => {
    const ref = vi.fn();
    function Case() {
      const form = useForm({ defaultValues: { title: '' } });
      return (
        <basic.Form form={form}>
          <basic.Form.Slot name="title" props={{ ref, 'aria-describedby': 'external external' }} />
        </basic.Form>
      );
    }
    render(<Case />);
    const input = screen.getByLabelText('Title');
    expect(ref).toHaveBeenCalledWith(input);
    expect(input.getAttribute('aria-describedby')?.split(' ')).toEqual([
      'external',
      `${input.id}-description`,
    ]);
  });
  it('supports select value callbacks and local adapter override', async () => {
    const Select = ({
      value,
      onValueChange,
      id,
    }: {
      value?: unknown;
      onValueChange?: (v: string) => void;
      id?: string;
    }) => (
      <select id={id} value={String(value ?? '')} onChange={(e) => onValueChange?.(e.target.value)}>
        <option value="">Choose</option>
        <option value="one">One</option>
      </select>
    );
    const select = defineField({
      component: Select,
      bind: ({ field, controlProps }) => ({
        ...controlProps,
        value: field.value,
        onValueChange: field.onChange,
      }),
    });
    const submit = vi.fn();
    function Case() {
      const form = useForm({ defaultValues: { title: '' } });
      return (
        <basic.Form
          adapter={{ fields: { text: select as unknown as typeof text } }}
          form={form}
          onSubmit={submit}
          submit="Send"
        />
      );
    }
    render(<Case />);
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'one' } });
    fireEvent.click(screen.getByText('Send'));
    await waitFor(() => expect(submit.mock.calls[0]?.[0]).toEqual({ title: 'one' }));
  });
  it('submits Zod transformed output and reports invalid inputs', async () => {
    const schema = z.object({ title: z.string().min(1, 'Enter title').transform(Number) });
    const submit = vi.fn();
    const invalid = vi.fn();
    function Case() {
      const form = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
        defaultValues: { title: '' },
        resolver: zodResolver(schema),
      });
      return <basic.Form form={form} onSubmit={submit} onInvalid={invalid} submit="Send" />;
    }
    render(<Case />);
    fireEvent.click(screen.getByText('Send'));
    await screen.findByText('Enter title');
    expect(invalid).toHaveBeenCalledOnce();
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: '42' } });
    fireEvent.click(screen.getByText('Send'));
    await waitFor(() => expect(submit.mock.calls[0]?.[0]).toEqual({ title: 42 }));
  });
  it('works with native useFieldArray and stable item IDs', async () => {
    const submit = vi.fn();
    function Case() {
      const form = useForm({ defaultValues: { rows: [{ title: 'A' }, { title: 'B' }] } });
      const array = useFieldArray({ control: form.control, name: 'rows' });
      return (
        <kit.FormBuilder
          form={form}
          fields={array.fields.map((_, i) => ({
            name: `rows.${i}.title` as const,
            type: 'text' as const,
            label: `Row ${i}`,
          }))}
          onSubmit={submit}
        >
          {array.fields.map((row, i) => (
            <kit.FormBuilder.Slot key={row.id} name={`rows.${i}.title`} />
          ))}
          <button type="button" onClick={() => array.move(0, 1)}>
            Move
          </button>
          <kit.FormBuilder.Submit>Send</kit.FormBuilder.Submit>
        </kit.FormBuilder>
      );
    }
    render(<Case />);
    fireEvent.click(screen.getByText('Move'));
    fireEvent.click(screen.getByText('Send'));
    await waitFor(() =>
      expect(submit.mock.calls[0]?.[0]).toEqual({ rows: [{ title: 'B' }, { title: 'A' }] }),
    );
  });
  it('hydrates SSR markup without ID mismatches or warnings', async () => {
    function Case() {
      const form = useForm({ defaultValues: { title: 'SSR' } });
      return <basic.Form form={form} />;
    }
    const container = document.createElement('div');
    document.body.append(container);
    container.innerHTML = renderToString(<Case />);
    const before = container.querySelector('input')!.id;
    const errors: unknown[] = [];
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, <Case />, {
        onRecoverableError: (error) => errors.push(error),
      });
    });
    expect(errors).toEqual([]);
    expect(container.querySelector('input')!.id).toBe(before);
    expect(container.querySelector('label')!.htmlFor).toBe(before);
    await act(async () => root.unmount());
    container.remove();
  });
});
