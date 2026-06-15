import * as React from 'react';

/** Multi-line text field, vertically resizable. */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Label above the control. */
  label?: string;
  /** Helper text below the control. */
  hint?: string;
}

export function Textarea(props: TextareaProps): JSX.Element;
