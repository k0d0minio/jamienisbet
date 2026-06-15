import * as React from 'react';

/**
 * Primary action control. Slate-fill primary, bordered secondary, quiet ghost.
 * @startingPoint section="Core" subtitle="Button — primary, secondary, ghost, danger" viewport="700x200"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual emphasis. @default "primary" */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Control height. @default "md" */
  size?: 'sm' | 'md' | 'lg';
  /** Stretch to fill container width. */
  block?: boolean;
  /** Icon node rendered before the label. */
  leftIcon?: React.ReactNode;
  /** Icon node rendered after the label. */
  rightIcon?: React.ReactNode;
  /** Render as a different element, e.g. "a" for links. @default "button" */
  as?: 'button' | 'a';
}

export function Button(props: ButtonProps): JSX.Element;
