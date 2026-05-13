import styles from './ui.module.css';

export function Chip({ children, className = '', colorClass, ...props }) {
  return (
    <span className={`${styles.chip} ${colorClass || ''} ${className}`} {...props}>
      {children}
    </span>
  );
}
