import * as React from 'react';

/**
 * Surface container with hairline border. The default content block across the brand.
 * @startingPoint section="Core" subtitle="Card — surface container w/ eyebrow + title" viewport="700x240"
 */
export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  /** Apply internal padding. @default true */
  padded?: boolean;
  /** Lift + shadow on hover (use for clickable cards). */
  hover?: boolean;
  /** Resting soft shadow. */
  raised?: boolean;
  /** Mono uppercase eyebrow above the title. */
  eyebrow?: React.ReactNode;
  /** Card title (rendered as h3). */
  title?: React.ReactNode;
  /** Node aligned to the top-right of the header (e.g. an IconButton). */
  action?: React.ReactNode;
  /** Render element. @default "div" */
  as?: 'div' | 'a' | 'article' | 'section';
  children?: React.ReactNode;
}

export function Card(props: CardProps): JSX.Element;
