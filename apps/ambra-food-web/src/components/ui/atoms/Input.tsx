import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    prefixIcon?: React.ReactNode;
    suffixIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className,
            type = 'text',
            label,
            error,
            prefixIcon,
            suffixIcon,
            ...props
        },
        ref
    ) => {
        const [showPassword, setShowPassword] = useState(false);
        const isPassword = type === 'password';
        const inputType = isPassword && showPassword ? 'text' : type;

        return (
            <div className="flex flex-col gap-1.5 w-full">
                {label && (
                    <label className="text-text-primary dark:text-gray-200 text-sm font-medium ml-1">
                        {label}
                    </label>
                )}

                <div className="relative flex items-center">
                    {prefixIcon && (
                        <div className="absolute left-4 text-text-secondary pointer-events-none">
                            {prefixIcon}
                        </div>
                    )}

                    <input
                        ref={ref}
                        type={inputType}
                        className={cn(
                            'form-input flex w-full h-12 rounded-lg',
                            'border border-gray-200 dark:border-zinc-700',
                            'bg-white dark:bg-zinc-900',
                            'text-text-primary dark:text-white',
                            'px-4 text-base', // CRÍTICO: 16px mínimo (evita zoom iOS)
                            'focus:border-brand-primary focus:ring-1 focus:ring-brand-primary',
                            'placeholder:text-gray-400',
                            'transition-colors',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            prefixIcon && 'pl-12',
                            (suffixIcon || isPassword) && 'pr-12',
                            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
                            className
                        )}
                        {...props}
                    />

                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 text-gray-400 dark:text-gray-500 hover:text-brand-primary transition-colors"
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    )}

                    {suffixIcon && !isPassword && (
                        <div className="absolute right-4 text-text-secondary">
                            {suffixIcon}
                        </div>
                    )}
                </div>

                {error && (
                    <p className="text-red-500 text-xs ml-1">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export { Input };
