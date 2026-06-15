import * as React from 'react';

/** The brand's signature mono kicker label — sits above titles and marks sections. */
export interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Prepend a short horizontal rule. */
  rule?: boolean;
  /** Tint the label with the primary slate. */
  primary?: boolean;
  /** Optional leading index, e.g. "01" — rendered in full-strength text. */
  index?: React.ReactNode;
  children?: React.ReactNode;
}

export function Eyebrow(props: EyebrowProps): JSX.Element;
