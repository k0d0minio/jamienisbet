import * as React from 'react';

/** Checkbox with custom slate check, optional label and description. */
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Inline label text. */
  label?: React.ReactNode;
  /** Secondary description below the label. */
  description?: string;
}

export function Checkbox(props: CheckboxProps): JSX.Element;
