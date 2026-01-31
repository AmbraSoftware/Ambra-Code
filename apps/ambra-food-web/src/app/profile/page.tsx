'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/atoms/Button';
import { Card } from '@/components/ui/molecules/Card';
import { Avatar } from '@/components/ui/atoms/Avatar';
import { BottomNav } from '@/components/ui/organisms/BottomNav';
import { Shield, User as UserIcon, LogOut } from 'lucide-react';

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
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex flex-col">
      {/* TopAppBar */}
      <header className="bg-surface-light dark:bg-surface-dark p-4 pt-8 safe-area-top">
        <h2 className="text-text-primary dark:text-white text-xl font-bold leading-tight tracking-tight text-center">
          Perfil
        </h2>
      </header>

      <main className="flex-1 px-4 py-6 pb-24 overflow-y-auto">
        {/* Avatar & Name */}
        <div className="flex flex-col items-center mb-8">
          <Avatar
            name={user.name}
            size="xl"
            className="mb-4 shadow-lg"
          />
          <h1 className="text-text-primary dark:text-white text-2xl font-bold mb-1">
            {user.name}
          </h1>
          <p className="text-text-secondary dark:text-text-secondary-dark text-sm">
            {user.email}
          </p>
        </div>

        {/* Info Cards */}
        <div className="space-y-3 mb-8">
          <Card variant="default" padding="md">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 shrink-0">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-text-secondary dark:text-text-secondary-dark text-sm">
                  Tipo de Conta
                </p>
                <p className="text-text-primary dark:text-white font-semibold">
                  {user.role === 'GUARDIAN' ? 'Responsável' : 'Estudante'}
                </p>
              </div>
            </div>
          </Card>

          <Card variant="default" padding="md">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-full bg-green-100 dark:bg-green-900/30 shrink-0">
                <UserIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-text-secondary dark:text-text-secondary-dark text-sm">
                  ID do Usuário
                </p>
                <p className="text-text-primary dark:text-white font-mono text-xs">
                  {user.id}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            variant="danger"
            className="w-full"
            onClick={handleLogout}
            icon={<LogOut className="h-5 w-5" />}
          >
            Sair
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-8">
          <p>Ambra Food Web v1.0.0</p>
          <p className="mt-1">PWA Mobile-First</p>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
