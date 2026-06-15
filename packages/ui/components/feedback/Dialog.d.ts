import * as React from 'react';

/** Centered modal dialog with overlay, title, body and footer slot. */
export interface DialogProps {
  /** Visibility. @default true */
  open?: boolean;
  /** Called when the overlay or close button is clicked. */
  onClose?: () => void;
  /** Heading text. */
  title?: React.ReactNode;
  /** Max width in px. @default 460 */
  width?: number;
  /** Footer node, right-aligned (usually action Buttons). */
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

export function Dialog(props: DialogProps): JSX.Element | null;
