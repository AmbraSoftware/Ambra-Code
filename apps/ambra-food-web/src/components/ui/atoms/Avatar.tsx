import { HTMLAttributes } from 'react';
import { cn, getInitials } from '@/lib/utils';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
    src?: string;
    alt?: string;
    name?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Avatar({
    src,
    alt,
    name,
    size = 'md',
    className,
    ...props
}: AvatarProps) {
    const sizes = {
        sm: 'size-8 text-sm',
        md: 'size-12 text-base',
        lg: 'size-20 text-2xl',
        xl: 'size-32 text-4xl',
    };

    const initials = name ? getInitials(name) : '?';

    return (
        <div
            className={cn(
                'flex items-center justify-center rounded-full overflow-hidden bg-brand-primary text-white font-bold shrink-0',
                sizes[size],
                className
            )}
            {...props}
        >
            {src ? (
                <img src={src} alt={alt || name || 'Avatar'} className="w-full h-full object-cover" />
            ) : (
                <span>{initials}</span>
            )}
        </div>
    );
}
