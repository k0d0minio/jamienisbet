import * as React from 'react';

/** Binary toggle for settings and preferences. */
export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Trailing label text. */
  label?: React.ReactNode;
}

export function Switch(props: SwitchProps): JSX.Element;
