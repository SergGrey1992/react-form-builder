'use client';
import '@ant-design/v5-patch-for-react-19';
import { forwardRef } from 'react';
import type { ComponentRef } from 'react';
import type { SelectProps } from 'antd';
import { Input, InputNumber, Checkbox, Select, Form, Button } from 'antd';
import {
  createFormAdapter,
  createFormBuilder,
  defineField,
} from '@serggrey1992/react-form-builder';
// UI-only blocking must not set RHF disabled (which excludes a field from submitted data).
const AsyncSelect = forwardRef<
  ComponentRef<typeof Select>,
  SelectProps<string | string[]> & { uiDisabled?: boolean }
>(({ uiDisabled, disabled, ...props }, ref) => (
  <Select {...props} ref={ref} disabled={disabled || uiDisabled} />
));
export const adapter = createFormAdapter({
  fields: {
    text: defineField({
      component: Input,
      bind: ({ field, controlProps }) => ({
        ...controlProps,
        ...field,
        value: String(field.value ?? ''),
      }),
    }),
    textarea: defineField({
      component: Input.TextArea,
      defaults: { rows: 3 },
      bind: ({ field, controlProps }) => ({
        ...controlProps,
        ...field,
        value: String(field.value ?? ''),
      }),
    }),
    number: defineField({
      component: InputNumber,
      defaults: { style: { width: '100%' }, min: 0 },
      bind: ({ field, controlProps }) => ({
        ...controlProps,
        ...field,
        value: typeof field.value === 'number' ? field.value : 0,
        onChange: (value: number | null) => field.onChange(value ?? 0),
      }),
    }),
    select: defineField({
      component: AsyncSelect,
      bind: ({ field, controlProps }) => ({ ...controlProps, ...field }),
    }),
    checkbox: defineField({
      component: Checkbox,
      bind: ({ field, controlProps }) => ({
        ...controlProps,
        name: field.name,
        ref: field.ref,
        onBlur: field.onBlur,
        checked: Boolean(field.value),
        onChange: (event: { target: { checked: boolean } }) => field.onChange(event.target.checked),
      }),
    }),
  },
  renderWrapper: ({
    children,
    id,
    label,
    description,
    help,
    descriptionId,
    helpId,
    errorId,
    fieldState,
    required,
    wrapperProps,
  }) => (
    <div {...wrapperProps}>
      <Form.Item
        label={label}
        htmlFor={id}
        required={required}
        validateStatus={fieldState.invalid ? 'error' : undefined}
        help={
          description || help || fieldState.error?.message ? (
            <>
              {description && <span id={descriptionId}>{description}</span>}
              {help && <span id={helpId}>{help}</span>}
              {fieldState.error?.message && (
                <span id={errorId} role="alert">
                  {fieldState.error.message}
                </span>
              )}
            </>
          ) : undefined
        }
      >
        {children}
      </Form.Item>
    </div>
  ),
  renderSubmit: ({ loading, children, disabled, onClick, className, style, id, name, form }) => (
    <Button
      id={id}
      name={name}
      form={form}
      className={className}
      style={style}
      onClick={onClick}
      disabled={disabled}
      htmlType="submit"
      type="primary"
      loading={loading}
    >
      {children}
    </Button>
  ),
});
export const kit = createFormBuilder({ adapter });
