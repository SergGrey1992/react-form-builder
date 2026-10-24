import { StrictMode, forwardRef, useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useForm, useWatch } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import {
  createFormAdapter,
  createFormBuilder,
  defineField,
  FormBuilderProvider,
} from '../src/index';

const Input = forwardRef<HTMLInputElement, React.ComponentProps<'input'>>((props, ref) => (
  <input {...props} ref={ref} />
));
const adapter = createFormAdapter({
  fields: {
    text: defineField({
      component: Input,
      bind: ({ field, controlProps }) => ({ ...controlProps, ...field, value: field.value ?? '' }),
    }),
    checkbox: defineField({
      component: Input,
      defaults: { type: 'checkbox' },
      bind: ({ field, controlProps }) => ({
        ...controlProps,
        name: field.name,
        ref: field.ref,
        onBlur: field.onBlur,
        checked: Boolean(field.value),
        onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
          field.onChange(event.target.checked),
      }),
    }),
  },
});
const kit = createFormBuilder({ adapter });
const fields = kit.defineFields<{ email: string; accepted: boolean }>()([
  {
    name: 'email',
    type: 'text',
    label: 'Email',
    description: 'Work email',
    rules: { required: 'Required' },
    props: { placeholder: 'Field' },
  },
  { name: 'accepted', type: 'checkbox', label: 'Accept' },
]);
function Demo({
  slots = false,
  loading = false,
  onSubmit = vi.fn(),
}: {
  slots?: boolean;
  loading?: boolean;
  onSubmit?: (v: { email: string; accepted: boolean }) => void | Promise<void>;
}) {
  const form = useForm({ defaultValues: { email: '', accepted: false } });
  return (
    <fields.Form form={form} loading={loading} onSubmit={onSubmit} submit="Save">
      {slots ? (
        <section>
          <fields.Form.Slot name="email" props={{ placeholder: 'Slot' }} />
          <fields.Form.Submit>Go</fields.Form.Submit>
        </section>
      ) : undefined}
    </fields.Form>
  );
}
describe('Form builder', () => {
  it('renders accessible fields and submits native values', async () => {
    const submit = vi.fn();
    render(<Demo onSubmit={submit} />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByLabelText('Accept'));
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith({ email: 'a@b.com', accepted: true }, expect.anything()),
    );
  });
  it('uses explicit deep slots only and lets slot props win', () => {
    render(<Demo slots />);
    expect(screen.getByPlaceholderText('Slot')).toBeTruthy();
    expect(screen.queryByLabelText('Accept')).toBeNull();
    expect(screen.queryByText('Save')).toBeNull();
  });
  it('displays errors linked to controls', async () => {
    render(<Demo />);
    fireEvent.click(screen.getByText('Save'));
    await screen.findByRole('alert');
    const input = screen.getByLabelText('Email');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toContain(screen.getByRole('alert').id);
    expect(document.activeElement).toBe(input);
  });
  it('composes user callbacks without losing RHF updates', async () => {
    const change = vi.fn();
    const submit = vi.fn();
    function Case() {
      const form = useForm({ defaultValues: { email: '', accepted: false } });
      return (
        <fields.Form form={form} onSubmit={submit}>
          <fields.Form.Slot name="email" props={{ onChange: change }} />
          <fields.Form.Submit>Send</fields.Form.Submit>
        </fields.Form>
      );
    }
    render(<Case />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ok' } });
    fireEvent.click(screen.getByText('Send'));
    expect(change).toHaveBeenCalledOnce();
    await waitFor(() => expect(submit.mock.calls[0]?.[0].email).toBe('ok'));
  });
  it('supports reset, setValue, useWatch and blur in StrictMode', async () => {
    function Case() {
      const form = useForm({ defaultValues: { email: '', accepted: false } });
      const value = useWatch({ control: form.control, name: 'email' });
      return (
        <>
          <fields.Form form={form} />
          <output>{value}</output>
          <button onClick={() => form.setValue('email', 'changed')}>Set</button>
          <button onClick={() => form.reset()}>Reset</button>
          <span>{form.formState.touchedFields.email ? 'Touched' : 'Untouched'}</span>
        </>
      );
    }
    render(
      <StrictMode>
        <Case />
      </StrictMode>,
    );
    fireEvent.click(screen.getByText('Set'));
    expect(screen.getByRole('textbox').getAttribute('value')).toBe('changed');
    fireEvent.blur(screen.getByRole('textbox'));
    await screen.findByText('Touched');
    fireEvent.click(screen.getByText('Reset'));
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('');
  });
  it('uses nearest provider and local override', () => {
    const alternate = defineField({
      component: Input,
      defaults: { placeholder: 'Override' },
      bind: ({ field, controlProps }) => ({ ...controlProps, ...field, value: field.value ?? '' }),
    });
    function Case() {
      const form = useForm({ defaultValues: { title: '' } });
      return <kit.FormBuilder form={form} fields={[{ name: 'title', type: 'text' }]} />;
    }
    render(
      <FormBuilderProvider adapter={adapter}>
        <FormBuilderProvider adapter={{ fields: { text: alternate } }}>
          <Case />
        </FormBuilderProvider>
      </FormBuilderProvider>,
    );
    expect(screen.getByPlaceholderText('Override')).toBeTruthy();
  });
  it('blocks loading submit without changing values', async () => {
    const submit = vi.fn();
    render(<Demo loading onSubmit={submit} />);
    expect(screen.getByRole('group').hasAttribute('disabled')).toBe(true);
    fireEvent.submit(screen.getByRole('textbox').closest('form')!);
    await act(async () => {});
    expect(submit).not.toHaveBeenCalled();
  });
  it('locks concurrent async submit', async () => {
    let resolve!: () => void;
    const submit = vi.fn(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );
    render(<Demo onSubmit={submit} />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ok' } });
    const form = screen.getByRole('textbox').closest('form')!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    await act(async () => resolve());
  });
});
it('projects loading disabled to adapter without excluding RHF values', async () => {
  const submit = vi.fn();
  function Case() {
    const form = useForm({ defaultValues: { email: 'kept', accepted: true } });
    const [loading, setLoading] = useState(true);
    return (
      <>
        <fields.Form form={form} loading={loading} onSubmit={submit} submit="Send" />
        <button onClick={() => setLoading(false)}>Ready</button>
      </>
    );
  }
  render(<Case />);
  expect((screen.getByLabelText('Email') as HTMLInputElement).disabled).toBe(true);
  fireEvent.click(screen.getByText('Ready'));
  fireEvent.click(screen.getByText('Send'));
  await waitFor(() => expect(submit.mock.calls[0]?.[0]).toEqual({ email: 'kept', accepted: true }));
});
it('restores async defaultValues through native RHF', async () => {
  function Case() {
    const form = useForm<{ email: string; accepted: boolean }>({
      defaultValues: async () => ({ email: 'restored', accepted: true }),
    });
    return <fields.Form form={form} />;
  }
  render(<Case />);
  await waitFor(() =>
    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('restored'),
  );
  expect((screen.getByLabelText('Accept') as HTMLInputElement).checked).toBe(true);
});
it('passes readOnly and RHF disabled while preserving uncontrolled warning safety', () => {
  const errors = vi.spyOn(console, 'error');
  function Case() {
    const form = useForm({ defaultValues: { email: '', accepted: false }, disabled: true });
    return (
      <fields.Form form={form}>
        <fields.Form.Slot name="email" props={{ readOnly: true }} />
      </fields.Form>
    );
  }
  const view = render(<Case />);
  const input = screen.getByLabelText('Email') as HTMLInputElement;
  expect(input.disabled).toBe(true);
  expect(input.readOnly).toBe(true);
  view.unmount();
  expect(errors).not.toHaveBeenCalled();
  errors.mockRestore();
});
