import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'verified' | 'approved' | 'published' | 'active' | 'pending' | 'under_review' | 'expiring' | 'rejected' | 'expired' | 'suspended' | 'info';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'info', className = '' }) => {
  return <span className={`badge badge-${variant} ${className}`}>{children}</span>;
};
