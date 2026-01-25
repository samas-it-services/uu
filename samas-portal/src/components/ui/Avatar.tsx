import { FC, ImgHTMLAttributes, useState } from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  size?: 'sm' | 'md' | 'lg';
  fallback?: string;
}

export const Avatar: FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  fallback,
  className,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground font-medium',
          sizeClasses[size],
          className
        )}
        aria-label={alt}
      >
        {fallback ? getInitials(fallback) : '?'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={cn('rounded-full object-cover', sizeClasses[size], className)}
      {...props}
    />
  );
};
