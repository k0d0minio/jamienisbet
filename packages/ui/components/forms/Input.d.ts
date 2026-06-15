import * as React from 'react';

/** Single-line text field with label, hint/error, and optional icons. */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Field label rendered above the control. */
  label?: string;
  /** Helper text below the field. */
  hint?: string;
  /** Error message — turns the field red and overrides hint. */
  error?: string;
  /** Icon node inside the field, left side. */
  leftIcon?: React.ReactNode;
  /** Icon node inside the field, right side. */
  rightIcon?: React.ReactNode;
}

export function Input(props: InputProps): JSX.Element;
