import styles from './ui.module.css';

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const btnClass = variant === 'secondary' ? styles.btnSecondary : styles.btnPrimary;
  return (
    <button className={`${styles.btn} ${btnClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
