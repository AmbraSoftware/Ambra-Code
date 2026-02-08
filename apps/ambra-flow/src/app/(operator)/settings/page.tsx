'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';

export default function OperatorSettingsPage() {
    const router = useRouter();

    // Local State
    // NOTA: Dark mode desativado temporariamente para o MVP - sempre usando Light Mode
    // const [darkMode, setDarkMode] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [dataSaver, setDataSaver] = useState(false);

    useEffect(() => {
        // Load from localStorage on mount
        // NOTA: Dark mode desativado temporariamente
        // const savedDark = localStorage.getItem('theme') === 'dark';
        const savedSound = localStorage.getItem('ambra_sound_enabled') !== 'false'; // Default true
        const savedData = localStorage.getItem('ambra_data_saver') === 'true'; // Default false

        // setDarkMode(savedDark);
        setSoundEnabled(savedSound);
        setDataSaver(savedData);
    }, []);

    /* NOTA: Toggle de dark mode desativado temporariamente para o MVP
    const toggleDarkMode = () => {
        const newVal = !darkMode;
        setDarkMode(newVal);
        localStorage.setItem('theme', newVal ? 'dark' : 'light');
        if (newVal) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    };
    */

    const toggleSound = () => {
        const newVal = !soundEnabled;
        setSoundEnabled(newVal);
        localStorage.setItem('ambra_sound_enabled', String(newVal));
    };

    const toggleDataSaver = () => {
        const newVal = !dataSaver;
        setDataSaver(newVal);
        localStorage.setItem('ambra_data_saver', String(newVal));
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto p-4">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Preferências do PDV</h1>
                    <p className="text-sm text-gray-500">Ajustes locais para este dispositivo.</p>
                </div>
            </div>

            {/* Acessibilidade */}
            <Card title="Ambiente & Acessibilidade">
                <div className="divide-y divide-gray-100">
                    {/* NOTA: Toggle de dark mode oculto temporariamente para o MVP
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-gray-400">dark_mode</span>
                            <div>
                                <span className="font-bold text-sm block">Modo Escuro</span>
                                <span className="text-xs text-gray-500">Ideal para ambientes com pouca luz.</span>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={darkMode} onChange={toggleDarkMode} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                    */}

                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-gray-400">volume_up</span>
                            <div>
                                <span className="font-bold text-sm block">Sons do Sistema</span>
                                <span className="text-xs text-gray-500">Beep de confirmação e alertas de erro.</span>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={soundEnabled} onChange={toggleSound} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>
            </Card>

            {/* Performance */}
            <Card title="Performance & Dados">
                <div className="divide-y divide-gray-100">
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-gray-400">wifi_off</span>
                            <div>
                                <span className="font-bold text-sm block">Economia de Dados</span>
                                <span className="text-xs text-gray-500">Ocultar fotos dos alunos para economizar banda (3G/4G).</span>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={dataSaver} onChange={toggleDataSaver} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>
            </Card>
        </div>
    );
}
