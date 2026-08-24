import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline-primary' | 'danger' | 'outline-danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = true,
  className = '',
  children,
  ...props
}) => {
  const sizeClass = size === 'sm' ? 'btn-sm' : '';
  const widthClass = fullWidth ? '' : 'style="width: auto;"';

  return (
    <button
      className={`btn btn-${variant} ${sizeClass} ${className}`}
      style={!fullWidth ? { width: 'auto' } : undefined}
      {...props}
    >
      {children}
    </button>
  );
};
