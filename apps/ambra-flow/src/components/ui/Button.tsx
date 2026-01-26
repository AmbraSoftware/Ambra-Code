import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
    "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]",
    {
        variants: {
            variant: {
                primary:
                    "bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20 focus:ring-primary",
                secondary:
                    "bg-secondary-orange hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 focus:ring-secondary-orange",
                outline:
                    "border-2 border-primary text-primary hover:bg-primary/5 focus:ring-primary bg-transparent",
                danger:
                    "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 focus:ring-red-500",
                ghost:
                    "text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-white/10",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                sm: "px-3 py-1.5 text-xs h-8",
                md: "px-5 py-2.5 text-sm h-10",
                lg: "px-6 py-3 text-base h-12",
                icon: "h-10 w-10 p-0", // Useful for icon-only buttons
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "md",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    /** @deprecated Use leftIcon or rightIcon with a Lucide component instead */
    icon?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant,
            size,
            isLoading = false,
            leftIcon,
            rightIcon,
            icon,
            children,
            disabled,
            ...props
        },
        ref
    ) => {
        // Backward compatibility for 'icon' string prop (Material Symbols)
        const iconElement = icon ? (
            <span className="material-symbols-outlined text-[1.2em]">{icon}</span>
        ) : null;
        const finalLeftIcon = leftIcon || iconElement;

        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                disabled={isLoading || disabled}
                ref={ref}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!isLoading && finalLeftIcon && (
                    <span className="mr-2 flex items-center">{finalLeftIcon}</span>
                )}
                {children}
                {!isLoading && rightIcon && (
                    <span className="ml-2 flex items-center">{rightIcon}</span>
                )}
            </button>
        );
    }
);
Button.displayName = "Button";
