'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/MobileLayout';
import { User, LogOut, Shield } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userStr));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return null;

  return (
    <MobileLayout>
      <div className="p-6 space-y-6 safe-top">
        {/* Header */}
        <div className="text-center">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-gray-500 text-sm">{user.email}</p>
        </div>

        {/* Info Cards */}
        <div className="space-y-3">
          <div className="card-mobile">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tipo de Conta</p>
                <p className="font-semibold text-gray-900">
                  {user.role === 'GUARDIAN' ? 'Responsável' : 'Estudante'}
                </p>
              </div>
            </div>
          </div>

          <div className="card-mobile">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">ID do Usuário</p>
                <p className="font-mono text-xs text-gray-900">{user.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="space-y-3 pt-6">
          <button
            onClick={handleLogout}
            className="btn-secondary w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pt-8">
          <p>Ambra Food Web v1.0.0</p>
          <p className="mt-1">PWA Mobile-First</p>
        </div>
      </div>
    </MobileLayout>
  );
}
