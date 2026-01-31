import { HTMLAttributes, useState } from 'react';
import { cn } from '@/lib/utils';

export interface ToggleProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'onChange'> {
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    label?: string;
    description?: string;
}

export function Toggle({
    checked = false,
    onChange,
    disabled = false,
    label,
    description,
    className,
    ...props
}: ToggleProps) {
    const [isChecked, setIsChecked] = useState(checked);

    const handleToggle = () => {
        if (disabled) return;
        const newValue = !isChecked;
        setIsChecked(newValue);
        onChange?.(newValue);
    };

    return (
        <div className={cn('flex items-center justify-between gap-4', className)}>
            {(label || description) && (
                <div className="flex-1">
                    {label && (
                        <p className="text-text-primary dark:text-white text-sm font-medium">
                            {label}
                        </p>
                    )}
                    {description && (
                        <p className="text-text-secondary dark:text-text-secondary-dark text-xs mt-0.5">
                            {description}
                        </p>
                    )}
                </div>
            )}

            <button
                type="button"
                role="switch"
                aria-checked={isChecked}
                disabled={disabled}
                onClick={handleToggle}
                className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    isChecked ? 'bg-brand-primary' : 'bg-gray-200 dark:bg-gray-700'
                )}
                {...props}
            >
                <span
                    aria-hidden="true"
                    className={cn(
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                        isChecked ? 'translate-x-5' : 'translate-x-0'
                    )}
                />
            </button>
        </div>
    );
}
