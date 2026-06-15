import * as React from 'react';

/** Inline message banner with a status icon. */
export interface AlertProps {
  /** Color intent + default icon. @default "info" */
  variant?: 'info' | 'success' | 'warning' | 'danger';
  /** Bold title line. */
  title?: React.ReactNode;
  /** Override the default status icon. */
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function Alert(props: AlertProps): JSX.Element;
