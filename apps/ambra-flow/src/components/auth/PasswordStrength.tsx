import React, { useEffect, useState } from 'react';

type PasswordStrengthProps = {
    password: string;
    onValidityChange: (isValid: boolean) => void;
};

export default function PasswordStrength({ password, onValidityChange }: PasswordStrengthProps) {
    const [requirements, setRequirements] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        numberOrSpecial: false,
    });

    useEffect(() => {
        const reqs = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            numberOrSpecial: /[\d\W]/.test(password),
        };
        setRequirements(reqs);

        const isValid = Object.values(reqs).every(Boolean);
        onValidityChange(isValid);
    }, [password, onValidityChange]);

    const strengthScore = Object.values(requirements).filter(Boolean).length;

    // 0-1: Red, 2-3: Yellow, 4: Green
    const getColor = () => {
        if (strengthScore <= 1) return 'bg-red-500';
        if (strengthScore <= 3) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const width = `${(strengthScore / 4) * 100}%`;

    if (!password) return null;

    return (
        <div className="mt-2 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Strength Bar */}
            <div className="h-1.5 w-full bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-300 ${getColor()}`}
                    style={{ width }}
                />
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-2 gap-1">
                <RequirementItem met={requirements.length} label="Mínimo 8 caracteres" />
                <RequirementItem met={requirements.uppercase} label="Letra Maiúscula" />
                <RequirementItem met={requirements.lowercase} label="Letra Minúscula" />
                <RequirementItem met={requirements.numberOrSpecial} label="Número ou Símbolo" />
            </div>
        </div>
    );
}

function RequirementItem({ met, label }: { met: boolean; label: string }) {
    return (
        <div className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${met ? 'text-green-600 dark:text-green-500' : 'text-muted-light dark:text-muted-dark'}`}>
            <span className="material-symbols-outlined text-[14px]">
                {met ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            {label}
        </div>
    );
}
