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
            <div className="flex flex-col items-center">
                <div className="text-2xl font-black tracking-tighter text-brand-primary leading-none">
                    AMBRA<span className="text-text-primary dark:text-white font-light text-xl ml-0.5">FLOW</span>
                </div>
            </div>
        </div>
    );
}
