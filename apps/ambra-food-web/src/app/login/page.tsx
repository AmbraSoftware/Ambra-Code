'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/atoms/Button';
import { Input } from '@/components/ui/atoms/Input';
import { UserRole } from '@/types';
import { Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await authAPI.login({ email, password });

      // Salvar token e user no localStorage
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirecionar para carteira
      window.location.href = '/';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-surface-light dark:bg-surface-dark">
      {/* Top Spacer */}
      <div className="h-4 safe-area-top" />

      <div className="flex flex-col items-center px-6 pt-4 pb-8">
        {/* Logo & Brand */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <Image
              src="/ambra-icon.svg"
              alt="Ambra"
              width={80}
              height={80}
              priority
              className="object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-text-primary dark:text-white text-2xl font-bold leading-tight tracking-tight">
            Ambra Food
          </h1>
          <p className="text-brand-primary text-sm font-semibold uppercase tracking-wide">
            Cantina Digital
          </p>
        </div>

        {/* Segmented Control (Role Switcher) */}
        <div className="w-full max-w-sm mb-6">
          <div className="flex h-12 w-full items-center justify-center rounded-xl bg-gray-100 dark:bg-zinc-800 p-1">
            <label
              className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-semibold transition-all ${role === 'STUDENT'
                ? 'bg-white dark:bg-zinc-700 shadow-sm text-brand-primary'
                : 'text-gray-500 dark:text-gray-400'
                }`}
            >
              <span className="truncate">Aluno</span>
              <input
                type="radio"
                name="user_role"
                value="STUDENT"
                checked={role === 'STUDENT'}
                onChange={() => {
                  setRole('STUDENT');
                  setError('');
                }}
                className="invisible w-0"
              />
            </label>
            <label
              className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-semibold transition-all ${role === 'GUARDIAN'
                ? 'bg-white dark:bg-zinc-700 shadow-sm text-brand-primary'
                : 'text-gray-500 dark:text-gray-400'
                }`}
            >
              <span className="truncate">Responsável</span>
              <input
                type="radio"
                name="user_role"
                value="GUARDIAN"
                checked={role === 'GUARDIAN'}
                onChange={() => {
                  setRole('GUARDIAN');
                  setError('');
                }}
                className="invisible w-0"
              />
            </label>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Dica visual */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
            {role === 'STUDENT' ? (
              <p>👨‍🎓 <strong>Alunos:</strong> Usem o email da escola</p>
            ) : (
              <p>👨‍👩‍👧‍👦 <strong>Pais:</strong> Usem o email cadastrado</p>
            )}
          </div>

          <Input
            label="E-mail"
            type="email"
            placeholder={role === 'STUDENT' ? 'aluno@teste.com' : 'pai@teste.com'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            prefixIcon={<Mail className="h-5 w-5" />}
            required
            autoComplete="email"
          />

          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            prefixIcon={<Lock className="h-5 w-5" />}
            required
            autoComplete="current-password"
          />

          <div className="flex justify-end">
            <a
              href="#"
              className="text-brand-primary text-sm font-semibold hover:underline"
            >
              Esqueci minha senha
            </a>
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            Entrar
          </Button>

          {/* Credenciais de Teste */}
          <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
            <details className="cursor-pointer">
              <summary className="font-medium">💡 Credenciais de Teste</summary>
              <div className="mt-2 space-y-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-left">
                {role === 'STUDENT' ? (
                  <>
                    <p className="font-semibold text-brand-primary">✅ Aluno (Funciona)</p>
                    <p><strong>Email:</strong> aluno@elite.com</p>
                    <p><strong>Senha:</strong> password123</p>
                    <p className="text-gray-400 mt-2">Saldo: R$ 150,00</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-orange-600">⚠️ Responsável</p>
                    <p className="text-gray-600 dark:text-gray-400">Criar via Console ou API</p>
                    <p className="mt-2 text-gray-500">Próxima fase</p>
                  </>
                )}
              </div>
            </details>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-auto pt-12 pb-6 flex flex-col items-center gap-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Ainda não tem uma conta?</p>
          <button className="text-text-primary dark:text-white font-bold text-sm border-b border-text-primary dark:border-white pb-0.5">
            Cadastre-se agora
          </button>
        </div>
      </div>

      {/* iOS Home Indicator Spacer */}
      <div className="h-8 w-full bg-surface-light dark:bg-surface-dark safe-area-bottom" />
    </div>
  );
}
