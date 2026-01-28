'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { GraduationCap, Users } from 'lucide-react';

type LoginType = 'student' | 'guardian';

export default function LoginPage() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<LoginType>('student');
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

      // Validar role esperado
      const expectedRole = loginType === 'student' ? 'STUDENT' : 'GUARDIAN';
      if (data.user.role !== expectedRole) {
        setError(
          loginType === 'student'
            ? 'Este email não é de um aluno. Use a aba "Responsável".'
            : 'Este email não é de um responsável. Use a aba "Aluno".'
        );
        setLoading(false);
        return;
      }

      // Salvar token e user no localStorage
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirecionar para carteira
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white flex flex-col justify-between p-6 safe-top">
      {/* Logo e Título */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mb-6 shadow-lg">
          <span className="text-4xl font-bold text-white">AF</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ambra Food</h1>
        <p className="text-gray-500 text-center mb-8">Alimentação escolar saudável</p>

        {/* Tabs - Tipo de Login */}
        <div className="w-full max-w-sm mb-6">
          <div className="bg-gray-100 rounded-xl p-1 flex gap-1">
            <button
              type="button"
              onClick={() => {
                setLoginType('student');
                setError('');
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                loginType === 'student'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              <GraduationCap className="w-5 h-5" />
              Aluno
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginType('guardian');
                setError('');
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                loginType === 'guardian'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              <Users className="w-5 h-5" />
              Responsável
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Dica visual */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
            {loginType === 'student' ? (
              <p>👨‍🎓 <strong>Alunos:</strong> Usem o email da escola</p>
            ) : (
              <p>👨‍👩‍👧‍👦 <strong>Pais:</strong> Usem o email cadastrado</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={loginType === 'student' ? 'aluno@teste.com' : 'pai@teste.com'}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          {/* Credenciais de Teste (Remover em produção) */}
          <div className="text-xs text-center text-gray-500 mt-4">
            <details className="cursor-pointer">
              <summary className="font-medium">💡 Credenciais de Teste</summary>
              <div className="mt-2 space-y-1 bg-gray-50 rounded-lg p-3 text-left">
                {loginType === 'student' ? (
                  <>
                    <p className="font-semibold text-primary">✅ Aluno (Funciona)</p>
                    <p><strong>Email:</strong> aluno@elite.com</p>
                    <p><strong>Senha:</strong> password123</p>
                    <p className="text-gray-400 mt-2">Saldo: R$ 150,00</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-orange-600">⚠️ Responsável</p>
                    <p className="text-gray-600">Criar via Console ou API</p>
                    <p className="mt-2 text-gray-500">Próxima fase</p>
                  </>
                )}
              </div>
            </details>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 safe-bottom">
        <p>Versão 1.0.0 - MVP Web</p>
      </div>
    </div>
  );
}
