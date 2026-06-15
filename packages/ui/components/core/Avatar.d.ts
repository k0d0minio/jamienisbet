import * as React from 'react';

/** Round (or squared) avatar; falls back to initials when no image is supplied. */
export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Image URL. Omit to render initials. */
  src?: string;
  /** Full name — used for alt text and initials fallback. */
  name?: string;
  /** Preset size or a raw pixel number. @default "md" */
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Rounded-square instead of circle. */
  square?: boolean;
}

export function Avatar(props: AvatarProps): JSX.Element;
