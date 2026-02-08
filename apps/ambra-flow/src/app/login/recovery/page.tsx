'use client';

import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { useState } from 'react';
import { Loader2, ArrowLeft, ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

// Schema Validation
const recoverySchema = z.object({
    email: z.string().email('Insira um e-mail válido'),
});

type RecoveryForm = z.infer<typeof recoverySchema>;

export default function RecoveryPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<RecoveryForm>({
        resolver: zodResolver(recoverySchema)
    });

    const onSubmit = async (data: RecoveryForm) => {
        setIsLoading(true);
        try {
            await authService.requestPasswordRecovery(data.email);
            setIsSent(true);
            toast.success('Instruções enviadas para seu e-mail!');
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || 'Erro ao processar solicitação. Verifique o e-mail.';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="font-display bg-background-light dark:bg-background-dark min-h-screen flex flex-col w-full relative overflow-x-hidden antialiased selection:bg-primary/20 selection:text-primary">
            {/* Abstract Background Elements */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -right-[5%] w-[600px] h-[600px] bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl opacity-60"></div>
                <div className="absolute bottom-[10%] -left-[5%] w-[500px] h-[500px] bg-gradient-to-tr from-[#8a7460]/10 to-transparent rounded-full blur-3xl opacity-40"></div>
            </div>

            <div className="flex flex-1 justify-center items-center py-10 px-4 sm:px-6 z-10 relative">
                <div className="flex flex-col w-full max-w-[440px]">
                    {/* Brand Header */}
                    <div className="flex items-center justify-center mb-8">
                        <Link href="/"><Logo variant="horizontal" width={140} height={48} /></Link>
                    </div>

                    {/* Main Card */}
                    <div className="bg-white dark:bg-[#1e150f] rounded-2xl shadow-lg border border-[#f0ebe8] dark:border-[#3a2d25] p-8 sm:p-10 flex flex-col animate-fade-in-up">
                        {!isSent ? (
                            <>
                                <div className="flex flex-col gap-4 text-center mb-8">
                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary mb-2">
                                        <LockKeyhole size={28} />
                                    </div>
                                    <h1 className="text-[#181411] dark:text-white text-2xl font-extrabold leading-tight">
                                        Recuperar Senha
                                    </h1>
                                    <p className="text-[#8a7460] dark:text-[#a89688] text-sm sm:text-base font-medium leading-relaxed">
                                        Informe seu e-mail cadastrado para receber o link de redefinição.
                                    </p>
                                </div>

                                <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
                                    <div className="flex flex-col gap-2">
                                        <Input 
                                            label="E-mail Corporativo"
                                            placeholder="gestao@escola.com"
                                            {...register('email')}
                                            error={errors.email?.message}
                                            leftIcon="mail" // Using string for Input component prop compatibility if it handles it, or adapt Input to accept Lucide Node
                                            // The Input component might need adjustment if it expects material icon string
                                            // Let's assume standard Input usage or pass Icon component if supported
                                        />
                                    </div>

                                    <Button 
                                        type="submit" 
                                        isLoading={isLoading}
                                        className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20"
                                    >
                                        Enviar Instruções
                                        {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
                                    </Button>
                                </form>
                            </>
                        ) : (
                            <div className="text-center animate-fade-in">
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-600 mb-6">
                                    <Mail size={32} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Verifique seu e-mail</h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-8">
                                    Enviamos um link de recuperação para o endereço informado. O link expira em 1 hora.
                                </p>
                                <Button 
                                    variant="outline" 
                                    className="w-full"
                                    onClick={() => setIsSent(false)}
                                >
                                    Tentar outro e-mail
                                </Button>
                            </div>
                        )}

                        {/* Back to Login */}
                        <div className="mt-8 pt-6 border-t border-[#f5f2f0] dark:border-[#3a2d25] flex justify-center">
                            <button
                                onClick={() => window.history.back()}
                                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#8a7460] dark:text-[#a89688] hover:text-primary dark:hover:text-primary transition-colors cursor-pointer"
                            >
                                <ArrowLeft size={18} />
                                Voltar
                            </button>
                        </div>
                    </div>

                    {/* Footer Support */}
                    <p className="mt-8 text-center text-sm text-[#8a7460] dark:text-[#a89688]">
                        Dificuldade para acessar?{' '}
                        <a
                            href="#"
                            className="font-bold text-primary hover:underline decoration-2 underline-offset-2"
                        >
                            Fale com o suporte
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
