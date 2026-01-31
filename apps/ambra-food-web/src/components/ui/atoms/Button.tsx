import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = 'primary',
            size = 'md',
            loading = false,
            icon,
            children,
            disabled,
            ...props
        },
        ref
    ) => {
        const baseStyles =
            'inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all tap-scale disabled:opacity-50 disabled:pointer-events-none';

        const variants = {
            primary:
                'bg-brand-primary text-white shadow-primary-sm hover:brightness-110 active:scale-95',
            secondary:
                'bg-gray-100 dark:bg-gray-800 text-text-primary dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700',
            ghost:
                'bg-transparent text-brand-primary hover:bg-brand-primary/10',
            danger:
                'bg-red-500 text-white hover:bg-red-600 active:scale-95',
        };

        const sizes = {
            sm: 'h-10 px-4 text-sm',
            md: 'h-12 px-5 text-base',
            lg: 'h-14 px-6 text-lg',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={disabled || loading}
                {...props}
            >
                {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : icon ? (
                    icon
                ) : null}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export { Button };
