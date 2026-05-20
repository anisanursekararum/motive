import React from 'react';
import styles from './ui.module.css';

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  colorClass?: string;
}

export function Chip({ children, className = '', colorClass, ...props }: ChipProps) {
  return (
    <span className={`${styles.chip} ${colorClass || ''} ${className}`} {...props}>
      {children}
    </span>
  );
}
