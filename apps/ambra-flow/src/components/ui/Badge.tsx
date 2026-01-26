import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
    icon?: string;
}

export function Badge({ children, variant = 'neutral', className = '', icon }: BadgeProps) {
    const variants = {
        success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
        error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
        info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
        primary: 'bg-primary/10 text-primary border-primary/20',
    };

    return (
        <span className={`
            inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border
            ${variants[variant]}
            ${className}
        `}>
            {icon && <span className="material-symbols-outlined text-[14px]">{icon}</span>}
            {children}
        </span>
    );
}
