'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/atoms/Badge';

export interface CartFloatingButtonProps {
    itemCount: number;
    onClick?: () => void;
    className?: string;
}

export function CartFloatingButton({
    itemCount,
    onClick,
    className,
}: CartFloatingButtonProps) {
    const [isPressed, setIsPressed] = useState(false);

    if (itemCount === 0) return null;

    return (
        <button
            onClick={onClick}
            onTouchStart={() => setIsPressed(true)}
            onTouchEnd={() => setIsPressed(false)}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
            className={cn(
                'fixed bottom-24 right-4 z-40 flex items-center justify-center size-14 rounded-full bg-brand-primary text-white shadow-lg shadow-primary-md transition-transform active:scale-95',
                isPressed && 'scale-95',
                className
            )}
        >
            <ShoppingCart className="h-6 w-6" />
            {itemCount > 0 && (
                <div className="absolute -top-1 -right-1">
                    <Badge variant="error" size="sm" className="min-w-[20px] h-5 flex items-center justify-center px-1.5">
                        {itemCount > 99 ? '99+' : itemCount}
                    </Badge>
                </div>
            )}
        </button>
    );
}
