import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// Skeleton patterns for common UI elements
export const SkeletonCard: React.FC = () => (
  <div className="rounded-2xl border border-gray-200 bg-white px-6 pt-6 dark:border-gray-800 dark:bg-white/[0.03]">
    <div className="mb-4">
      <Skeleton variant="text" width="60%" height={24} />
    </div>
    <Skeleton variant="rectangular" height={320} className="rounded-lg" />
  </div>
);

export const SkeletonStatCard: React.FC = () => (
  <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-white/[0.03]">
    <Skeleton variant="text" width="50%" height={16} className="mb-4" />
    <Skeleton variant="text" width="80%" height={40} />
  </div>
);

export default Skeleton;

