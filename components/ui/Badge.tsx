import React from 'react';

export type BadgeVariant =
  | 'verified'
  | 'approved'
  | 'published'
  | 'active'
  | 'pending'
  | 'pending_verification'
  | 'warning'
  | 'under_review'
  | 'expiring'
  | 'rejected'
  | 'danger'
  | 'expired'
  | 'suspended'
  | 'info'
  | 'primary'
  | 'popular'
  | 'default';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'info', className = '' }) => {
  // Normalize mapped CSS classes
  const cssClass =
    variant === 'warning' || variant === 'pending_verification'
      ? 'badge-pending'
      : variant === 'danger'
      ? 'badge-rejected'
      : variant === 'primary' || variant === 'popular' || variant === 'default'
      ? 'badge-info'
      : `badge-${variant}`;

  return <span className={`badge ${cssClass} ${className}`}>{children}</span>;
};
