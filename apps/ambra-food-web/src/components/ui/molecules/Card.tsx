import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'gradient' | 'glass';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
    className,
    variant = 'default',
    padding = 'md',
    children,
    ...props
}: CardProps) {
    const variants = {
        default:
            'bg-white dark:bg-surface-card-dark border border-gray-200 dark:border-white/5 shadow-sm',
        gradient:
            'gradient-card text-white shadow-primary-lg',
        glass:
            'bg-white/80 dark:bg-surface-card-dark/80 ios-blur border border-gray-200/50 dark:border-white/10',
    };

    const paddings = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    return (
        <div
            className={cn(
                'rounded-xl overflow-hidden',
                variants[variant],
                paddings[padding],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
