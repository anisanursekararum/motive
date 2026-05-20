import React from 'react';
import styles from './ui.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export function Button({ children, variant = 'primary', className = '', ...props }: ButtonProps) {
  const btnClass = variant === 'secondary' ? styles.btnSecondary : styles.btnPrimary;
  return (
    <button className={`${styles.btn} ${btnClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
