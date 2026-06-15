import * as React from 'react';

/** Small mono-set status label for states, counts, and categories. */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Color intent. @default "neutral" */
  variant?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'solid';
  /** Show a leading status dot. */
  dot?: boolean;
  children?: React.ReactNode;
}

export function Badge(props: BadgeProps): JSX.Element;
