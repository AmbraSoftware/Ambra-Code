import React from 'react';
import Image from 'next/image';

interface LogoProps {
    className?: string;
    textSize?: string;
    variant?: 'horizontal' | 'icon' | 'vertical';
    width?: number;
    height?: number;
}

export default function Logo({
    className = "",
    variant = 'horizontal',
    width,
    height
}: LogoProps) {
    const getLogoConfig = () => {
        switch (variant) {
            case 'icon':
                return {
                    src: '/ambra-icon.svg',
                    alt: 'Ambra',
                    defaultWidth: 40,
                    defaultHeight: 40
                };
            case 'vertical':
                return {
                    src: '/ambra-logo-vertical.svg',
                    alt: 'Ambra Logo',
                    defaultWidth: 120,
                    defaultHeight: 80
                };
            case 'horizontal':
            default:
                return {
                    src: '/ambra-logo-horizontal.svg',
                    alt: 'Ambra Logo',
                    defaultWidth: 140,
                    defaultHeight: 48
                };
        }
    };

    const config = getLogoConfig();

    return (
        <div className={`flex items-center hover:opacity-90 transition-opacity ${className}`}>
            <Image
                src={config.src}
                alt={config.alt}
                width={width || config.defaultWidth}
                height={height || config.defaultHeight}
                priority
                className="object-contain"
            />
        </div>
    );
}
