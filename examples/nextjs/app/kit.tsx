'use client';
import { Input, Checkbox, Select, Form, Button } from 'antd';
import {
  createFormAdapter,
  createFormBuilder,
  defineField,
} from '@serggrey1992/react-form-builder';
const adapter = createFormAdapter({
  fields: {
    text: defineField({
      component: Input,
      bind: ({ field, controlProps }) => ({
        ...controlProps,
        ...field,
        value: String(field.value ?? ''),
      }),
    }),
    select: defineField({
      component: Select,
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
          <>
            {description && <span id={descriptionId}>{description}</span>}
            {help && <span id={helpId}>{help}</span>}
            {fieldState.error?.message && (
              <span id={errorId} role="alert">
                {fieldState.error.message}
              </span>
            )}
          </>
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
