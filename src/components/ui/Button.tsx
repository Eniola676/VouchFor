import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  number?: number | string;
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  number,
  fullWidth = false,
  className,
  ...props
}: ButtonProps) {
  const baseStyles = 'relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-white text-black hover:bg-gray-100 focus:ring-white active:scale-[0.98]',
    secondary: 'bg-gray-800 text-white hover:bg-gray-700 focus:ring-gray-600 border border-gray-700 active:scale-[0.98]',
    ghost: 'bg-transparent text-white hover:bg-gray-900/50 focus:ring-gray-600 active:scale-[0.98]',
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-md',
    md: 'px-6 py-3 text-base rounded-md',
    lg: 'px-8 py-4 text-lg rounded-md',
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        number && 'pr-12',
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      {number !== undefined && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 text-xs font-semibold bg-black/20 text-white rounded-full border border-white/10 backdrop-blur-sm">
          {number}
        </span>
      )}
    </button>
  );
}
