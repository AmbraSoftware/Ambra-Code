'use client';

import React, { useState, useEffect } from 'react';
import { Student } from '@/services/students.service';
import { posService } from '@/services/pos.service';
import { Input } from '@/components/ui/Input';

interface StudentSearchProps {
    onSelect: (student: Student) => void;
    selectedStudent: Student | null;
}

export function StudentSearch({ onSelect, selectedStudent }: StudentSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Student[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const getStudentClassLabel = (student: Student) => {
        return (student as any)?.class || (student as any)?.profile?.class;
    };

    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (query.length >= 3) {
                setIsSearching(true);
                try {
                    const data = await posService.searchStudent(query);
                    setResults(data);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [query]);

    if (selectedStudent) {
        const classLabel = getStudentClassLabel(selectedStudent);
        return (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-[72px] h-[72px] rounded-xl overflow-hidden bg-primary/20 flex items-center justify-center shrink-0">
                        {(selectedStudent as any)?.avatarUrl ? (
                            <img
                                src={(selectedStudent as any).avatarUrl}
                                alt={selectedStudent.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        ) : (
                            <span className="text-primary font-bold text-2xl">
                                {selectedStudent.name.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{selectedStudent.name}</p>
                        {classLabel && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Turma: {classLabel}</p>
                        )}
                        <p className="text-xs text-gray-600 dark:text-gray-400">Saldo: R$ {Number(selectedStudent.wallet?.balance || 0).toFixed(2)}</p>
                    </div>
                </div>
                <button
                    onClick={() => { onSelect(selectedStudent as any); setQuery(''); }}
                    className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>
        );
    }

    return (
        <div className="relative mb-4">
            <Input
                placeholder="Buscar Aluno (Nome ou Cartão)..."
                leftIcon="badge"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                className="bg-white dark:bg-zinc-800"
            />

            {/* Results Dropdown */}
            {(results.length > 0 || isSearching) && query.length >= 3 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 z-50 overflow-hidden">
                    {isSearching ? (
                        <div className="p-3 text-center text-sm text-gray-500">Buscando...</div>
                    ) : (
                        results.map(student => (
                            <button
                                key={student.id}
                                onClick={() => { onSelect(student); setResults([]); setQuery(''); }}
                                className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center justify-between border-b border-gray-100 dark:border-zinc-700/50 last:border-0"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-primary/20 flex items-center justify-center shrink-0">
                                        {(student as any)?.avatarUrl ? (
                                            <img
                                                src={(student as any).avatarUrl}
                                                alt={student.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <span className="text-primary font-bold">
                                                {student.name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <span className="font-medium text-gray-800 dark:text-gray-200 block truncate">{student.name}</span>
                                        {getStudentClassLabel(student) && (
                                            <span className="text-xs text-gray-500 block truncate">Turma: {getStudentClassLabel(student)}</span>
                                        )}
                                    </div>
                                </div>
                                <span className={`text-xs font-bold ${Number(student.wallet?.balance || 0) < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                    R$ {Number(student.wallet?.balance || 0).toFixed(2)}
                                </span>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
