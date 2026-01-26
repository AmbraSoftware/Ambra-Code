import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
    "bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden flex flex-col transition-all duration-200",
    {
        variants: {
            variant: {
                default: "shadow-sm",
                elevated: "shadow-lg border-transparent",
                outline: "shadow-none bg-transparent border-dashed",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export interface CardProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
    children: React.ReactNode;
    title?: string;
    description?: string;
    footer?: React.ReactNode;
    noPadding?: boolean;
    actions?: React.ReactNode;
}

export function Card({
    children,
    title,
    description,
    footer,
    className,
    variant,
    noPadding = false,
    actions,
    ...props
}: CardProps) {
    return (
        <div className={cn(cardVariants({ variant, className }))} {...props}>
            {(title || actions) && (
                <div className="px-6 py-5 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                    <div>
                        {title && (
                            <h3 className="text-lg font-bold text-text-light dark:text-text-dark leading-tight">
                                {title}
                            </h3>
                        )}
                        {description && (
                            <p className="mt-1 text-sm text-muted-light dark:text-muted-dark">
                                {description}
                            </p>
                        )}
                    </div>
                    {actions && <div className="flex items-center gap-2">{actions}</div>}
                </div>
            )}

            <div className={cn("flex-1", noPadding ? "" : "p-6")}>{children}</div>

            {footer && (
                <div className="bg-gray-50 dark:bg-black/20 px-6 py-4 border-t border-border-light dark:border-border-dark">
                    {footer}
                </div>
            )}
        </div>
    );
}
