import * as React from 'react';

/** Square, icon-only button for toolbars and compact controls. Always pass `label` for accessibility. */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. @default "ghost" */
  variant?: 'ghost' | 'solid' | 'outline';
  /** Control size. @default "md" */
  size?: 'sm' | 'md' | 'lg';
  /** Accessible label (also used as tooltip title). Required. */
  label: string;
  /** Icon node (Lucide SVG). */
  children?: React.ReactNode;
}

export function IconButton(props: IconButtonProps): JSX.Element;
