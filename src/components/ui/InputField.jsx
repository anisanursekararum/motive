import React from 'react';
import styles from './ui.module.css';

export function InputField({ label, error, className = '', ...props }) {
  return (
    <div className={`input-wrapper ${className}`} style={{ marginBottom: '16px', width: '100%' }}>
      {label && <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>{label}</label>}
      <input className={styles.input} {...props} />
      {error && <span style={{ color: 'red', fontSize: '12px', marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  );
}

export function TextareaField({ label, value = '', maxLength = 5000, error, onChange, className = '', ...props }) {
  const handleChange = (e) => {
    if (e.target.value.length <= maxLength) {
      onChange && onChange(e);
    }
  };

  return (
    <div className={`input-wrapper ${className}`} style={{ marginBottom: '16px', width: '100%' }}>
      {label && <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>{label}</label>}
      <textarea 
        className={styles.textarea} 
        value={value} 
        onChange={handleChange} 
        maxLength={maxLength}
        {...props} 
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px', color: 'var(--color-dark-gray)' }}>
        {error ? <span style={{ color: 'red' }}>{error}</span> : <span></span>}
        <span>{value?.length || 0}/{maxLength}</span>
      </div>
    </div>
  );
}
