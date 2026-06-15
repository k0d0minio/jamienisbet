import * as React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

/** Native select with brand styling and a custom caret. */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Label above the control. */
  label?: string;
  /** Options as strings or {value,label} objects. */
  options?: Array<string | SelectOption>;
  /** Disabled placeholder shown first. */
  placeholder?: string;
}

export function Select(props: SelectProps): JSX.Element;
