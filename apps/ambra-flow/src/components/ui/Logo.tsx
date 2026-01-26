
import React from 'react';

export default function Logo({ className = "", textSize = "text-3xl" }: { className?: string, textSize?: string }) {
    return (
        <div className={`flex items-center gap-2 hover:opacity-80 transition-opacity ${className}`}>
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg transform rotate-3">
                <span className="material-symbols-outlined text-white text-2xl">point_of_sale</span>
            </div>
            <h1 className={`${textSize} font-bold tracking-tight text-text-light dark:text-text-dark font-display`}>
                Ambra<span className="text-primary">Flow</span>
            </h1>
        </div>
    );
}
