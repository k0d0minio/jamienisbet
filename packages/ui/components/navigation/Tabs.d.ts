import * as React from 'react';

export interface TabItem {
  value: string;
  label: string;
  /** Optional leading icon node. */
  icon?: React.ReactNode;
  /** Optional trailing count. */
  count?: number;
}

/** Underline tab bar. Controlled — supply `value` and `onChange`. */
export interface TabsProps {
  /** Tabs as strings or {value,label,icon,count}. */
  items: Array<string | TabItem>;
  /** Currently selected value. */
  value: string;
  /** Called with the next value on click. */
  onChange?: (value: string) => void;
  className?: string;
}

export function Tabs(props: TabsProps): JSX.Element;
