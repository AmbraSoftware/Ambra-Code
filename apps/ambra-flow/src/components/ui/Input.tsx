import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    onRightIconClick?: () => void;
}

const inputVariants = cva(
    "block w-full py-2.5 rounded-lg border text-text-light dark:text-text-dark transition-all duration-200 outline-none hover:border-gray-400 dark:hover:border-gray-500",
    {
        variants: {
            variant: {
                default:
                    "bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-muted-light dark:placeholder-muted-dark",
                error:
                    "border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 placeholder-red-300 bg-red-50 dark:bg-red-900/10",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className,
            label,
            error,
            helperText,
            leftIcon,
            rightIcon,
            onRightIconClick,
            id,
            disabled,
            ...props
        },
        ref
    ) => {
        const inputId = id || props.name;

        // Detect error state to switch variant
        const variant = error ? "error" : "default";

        // Helper for backward compatibility with string icons (Material Symbols)
        const renderIcon = (icon: React.ReactNode | string) => {
            if (typeof icon === "string") {
                return <span className="material-symbols-outlined text-[20px]">{icon}</span>;
            }
            return icon;
        };

        return (
            <div className={cn("w-full", className)}>
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-light dark:text-muted-dark">
                            {renderIcon(leftIcon)}
                        </div>
                    )}
                    <input
                        id={inputId}
                        disabled={disabled}
                        ref={ref}
                        className={cn(
                            inputVariants({ variant }),
                            leftIcon ? "pl-10" : "pl-3",
                            rightIcon ? "pr-10" : "pr-3",
                            disabled && "opacity-60 cursor-not-allowed bg-gray-50 dark:bg-zinc-800"
                        )}
                        {...props}
                    />
                    {rightIcon && (
                        <div
                            className={cn(
                                "absolute inset-y-0 right-0 pr-3 flex items-center text-muted-light dark:text-muted-dark",
                                onRightIconClick ? "cursor-pointer hover:text-text-light dark:hover:text-text-dark" : "pointer-events-none"
                            )}
                            onClick={onRightIconClick}
                        >
                            {renderIcon(rightIcon)}
                        </div>
                    )}
                </div>
                {error && (
                    <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1 animate-in slide-in-from-top-1 fade-in">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {error}
                    </p>
                )}
                {!error && helperText && (
                    <p className="mt-1.5 text-xs text-muted-light dark:text-muted-dark">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);
Input.displayName = "Input";
