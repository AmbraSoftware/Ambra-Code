import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
    size?: 'sm' | 'md';
}

export function Badge({
    className,
    variant = 'neutral',
    size = 'sm',
    children,
    ...props
}: BadgeProps) {
    const variants = {
        success:
            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        warning:
            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        error:
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        info:
            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        neutral:
            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-1 text-xs',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center font-bold uppercase rounded-full tracking-wider',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}
