'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import Logo from '@/components/ui/Logo';
import { authService } from '@/services/auth.service';
import { masks } from '@/utils/masks';
import { viacepService } from '@/services/viacep';
import PendingActivationModal from '@/components/auth/PendingActivationModal';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle, School, Store, Eye, EyeOff, Info, Search, AlertCircle } from 'lucide-react';

// --- ZOD SCHEMAS ---

// Helper regex
const pwdRegex = /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;

// Step 1: Type
const stepTypeSchema = z.object({
    profileType: z.enum(['school', 'operator']),
});

// Step 2: User
const stepUserSchema = z.object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    email: z.string().email('E-mail inválido'),
    password: z.string()
        .min(8, 'Mínimo 8 caracteres')
        .regex(pwdRegex, 'Requer maiúscula, minúscula e número/símbolo'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
});

// Step 3: Entity
const stepEntitySchema = z.object({
    entityName: z.string().min(3, 'Nome da entidade obrigatório'),
    taxId: z.string().refine((val) => {
        const raw = val.replace(/\D/g, '');
        return raw.length === 11 || raw.length === 14;
    }, 'CPF ou CNPJ inválido'),
    // type is internal/hidden usually, but we keep it in state or main schema
});

// Step 4: Financial
const stepFinancialSchema = z.object({
    mobilePhone: z.string().refine((val) => {
        const raw = val.replace(/\D/g, '');
        return raw.length >= 10 && raw.length <= 11;
    }, 'Celular inválido'),
    postalCode: z.string().min(9, 'CEP incompleto'),
    address: z.string().min(5, 'Endereço obrigatório'),
    addressNumber: z.string().min(1, 'Número obrigatório'),
    termsAccepted: z.boolean().refine(val => val === true, {
        message: "Você deve aceitar os termos"
    }),
    birthDate: z.string().optional().refine((val) => {
         // This validation is context dependent (only if CPF), handled in component logic or comprehensive schema
         return true; 
    }),
});

// Combined Schema for final submission (Optional, but good for type inference)
const registerSchema = z.intersection(
    z.intersection(stepTypeSchema, stepUserSchema),
    z.intersection(stepEntitySchema, stepFinancialSchema)
);

type RegisterFormData = z.infer<typeof registerSchema>;

type Step = 'TYPE' | 'USER' | 'ENTITY' | 'FINANCIAL';

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('TYPE');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);

    // React Hook Form
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        trigger,
        control,
        formState: { errors }
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        mode: 'onChange',
        defaultValues: {
            profileType: 'school',
            termsAccepted: false
        }
    });

    const formData = watch();

    // Password Strength Calc
    const passwordStrength = useMemo(() => {
        const pwd = formData.password || '';
        if (!pwd) return 0;
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[a-z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score++;
        return score;
    }, [formData.password]);

    // Handlers
    const handleBlurCep = async () => {
        const cepRaw = formData.postalCode?.replace(/\D/g, '') || '';
        if (cepRaw.length === 8) {
            setIsLoadingAddress(true);
            const addressData = await viacepService.getAddressByCep(cepRaw);
            setIsLoadingAddress(false);

            if (addressData) {
                setValue('address', `${addressData.logradouro}, ${addressData.bairro}, ${addressData.localidade} - ${addressData.uf}`);
                toast.success('Endereço encontrado!');
            } else {
                toast.error('CEP não encontrado.');
            }
        }
    };

    const validateCurrentStep = async () => {
        let isValid = false;
        if (step === 'TYPE') {
            isValid = await trigger(['profileType']);
        } else if (step === 'USER') {
            isValid = await trigger(['name', 'email', 'password', 'confirmPassword']);
        } else if (step === 'ENTITY') {
            isValid = await trigger(['entityName', 'taxId']);
        } else if (step === 'FINANCIAL') {
            // Manual check for BirthDate dependency
            const taxIdRaw = formData.taxId?.replace(/\D/g, '');
            if (taxIdRaw?.length === 11) {
                 if (!formData.birthDate) {
                     toast.error('Data de nascimento é obrigatória para CPF');
                     return false;
                 }
                 // Age check
                 const birth = new Date(formData.birthDate);
                 const today = new Date();
                 let age = today.getFullYear() - birth.getFullYear();
                 const m = today.getMonth() - birth.getMonth();
                 if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                 if (age < 18) {
                     toast.error('É necessário ser maior de 18 anos');
                     return false;
                 }
            }
            isValid = await trigger(['mobilePhone', 'postalCode', 'address', 'addressNumber', 'termsAccepted']);
        }
        return isValid;
    };

    const nextStep = async () => {
        const isValid = await validateCurrentStep();
        if (!isValid) return;

        if (step === 'TYPE') setStep('USER');
        else if (step === 'USER') setStep('ENTITY');
        else if (step === 'ENTITY') setStep('FINANCIAL');
    };

    const prevStep = () => {
        if (step === 'FINANCIAL') setStep('ENTITY');
        else if (step === 'ENTITY') setStep('USER');
        else if (step === 'USER') setStep('TYPE');
    };

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        try {
            await authService.register({
                profileType: data.profileType,
                email: data.email,
                password: data.password,
                entityName: data.entityName,
                taxId: masks.removeMask(data.taxId),
                mobilePhone: masks.removeMask(data.mobilePhone),
                postalCode: masks.removeMask(data.postalCode),
                address: data.address,
                addressNumber: data.addressNumber,
                birthDate: data.birthDate || '',
                consentVersion: 'v1.0-2026',
                termsAccepted: true
            });
            setIsSuccessModalOpen(true);
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.message || err.message || 'Erro ao realizar cadastro.';
            if (msg.includes('birthDate') || msg.includes('menor de idade')) {
                 toast.error('Ops! Idade mínima de 18 anos necessária.');
            } else {
                 toast.error(Array.isArray(msg) ? msg[0] : msg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-4 font-sans text-text-light dark:text-text-dark">
            <div className="mb-8">
                <Link href="/"><Logo /></Link>
            </div>

            <Card className="w-full max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-primary/5 p-6 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cadastro de Gestor</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Crie sua conta e gerencie sua cantina.</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold text-primary">
                        <span>{step === 'TYPE' ? '1' : step === 'USER' ? '2' : step === 'ENTITY' ? '3' : '4'}</span>
                        <span className="text-gray-300">/</span>
                        <span>4</span>
                    </div>
                </div>

                <div className="p-8">
                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full mb-8 overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: step === 'TYPE' ? '25%' : step === 'USER' ? '50%' : step === 'ENTITY' ? '75%' : '100%' }}
                        />
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {step === 'TYPE' && (
                            <div className="space-y-4 animate-fade-in">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 border-l-4 border-primary pl-3">Qual é o seu perfil?</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div 
                                        onClick={() => setValue('profileType', 'school')}
                                        className={`cursor-pointer p-6 rounded-xl border-2 transition-all hover:scale-[1.02] ${formData.profileType === 'school' ? 'border-primary bg-primary/5 shadow-md' : 'border-border-light dark:border-border-dark hover:border-primary/50'}`}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 text-primary">
                                            <School className="w-8 h-8" />
                                        </div>
                                        <h4 className="font-bold text-lg mb-2">Escola / Colégio</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Sou gestor ou diretor de uma instituição de ensino.
                                        </p>
                                    </div>

                                    <div 
                                        onClick={() => setValue('profileType', 'operator')}
                                        className={`cursor-pointer p-6 rounded-xl border-2 transition-all hover:scale-[1.02] ${formData.profileType === 'operator' ? 'border-primary bg-primary/5 shadow-md' : 'border-border-light dark:border-border-dark hover:border-primary/50'}`}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
                                            <Store className="w-8 h-8" />
                                        </div>
                                        <h4 className="font-bold text-lg mb-2">Cantina Terceirizada</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Sou dono de uma cantina ou restaurante escolar.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 'USER' && (
                            <div className="space-y-4 animate-fade-in">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 border-l-4 border-primary pl-3">Dados Pessoais</h3>
                                <div className="grid gap-4">
                                    <Input
                                        label="Nome Completo"
                                        placeholder="Seu nome"
                                        {...register('name')}
                                        error={errors.name?.message}
                                    />
                                    <Input
                                        label="E-mail Corporativo"
                                        type="email"
                                        placeholder="gestao@escola.com"
                                        {...register('email')}
                                        error={errors.email?.message}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="relative">
                                                <Input
                                                    label="Senha"
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder="******"
                                                    {...register('password')}
                                                    error={errors.password?.message}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                            {/* Password Strength */}
                                            {formData.password && (
                                                <div className="mt-2 flex gap-1">
                                                    {[1, 2, 3, 4].map((i) => (
                                                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= passwordStrength ? (passwordStrength < 3 ? 'bg-red-500' : passwordStrength === 3 ? 'bg-yellow-500' : 'bg-green-500') : 'bg-gray-200'}`} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <Input
                                            label="Confirmar Senha"
                                            type="password"
                                            placeholder="******"
                                            {...register('confirmPassword')}
                                            error={errors.confirmPassword?.message}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 'ENTITY' && (
                            <div className="space-y-4 animate-fade-in">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 border-l-4 border-primary pl-3">Dados do Negócio</h3>
                                <div className="grid gap-4">
                                    <Input
                                        label="Nome da Cantina/Escola"
                                        placeholder="Ex: Cantina do Colégio X"
                                        {...register('entityName')}
                                        error={errors.entityName?.message}
                                    />
                                    <Controller
                                        name="taxId"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                label="CPF ou CNPJ"
                                                placeholder="00.000.000/0000-00"
                                                maxLength={18}
                                                {...field}
                                                onChange={(e) => field.onChange(masks.cpfCnpj(e.target.value))}
                                                error={errors.taxId?.message}
                                            />
                                        )}
                                    />
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex gap-3 items-start text-sm text-blue-700 dark:text-blue-300">
                                        <Info className="shrink-0 mt-0.5 w-5 h-5" />
                                        <p>Para emissão de notas fiscais e recebimentos via PIX, os dados devem coincidir com o titular da conta bancária.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 'FINANCIAL' && (
                            <div className="space-y-4 animate-fade-in">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 border-l-4 border-primary pl-3">Conta Digital</h3>
                                
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Controller
                                            name="mobilePhone"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    label="Celular"
                                                    placeholder="(11) 99999-9999"
                                                    maxLength={15}
                                                    {...field}
                                                    onChange={(e) => field.onChange(masks.phone(e.target.value))}
                                                    error={errors.mobilePhone?.message}
                                                />
                                            )}
                                        />
                                        
                                        {/* BirthDate only for CPF */}
                                        {formData.taxId?.replace(/\D/g, '').length === 11 && (
                                            <Input
                                                label="Data de Nascimento"
                                                type="date"
                                                {...register('birthDate')}
                                                // Error handled manually in validateStep for now due to conditional logic
                                            />
                                        )}

                                        {(formData.taxId?.replace(/\D/g, '').length !== 11) && (
                                            <div className="relative">
                                                 <Controller
                                                    name="postalCode"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Input
                                                            label="CEP"
                                                            placeholder="00000-000"
                                                            maxLength={9}
                                                            {...field}
                                                            onChange={(e) => field.onChange(masks.cep(e.target.value))}
                                                            onBlur={() => { field.onBlur(); handleBlurCep(); }}
                                                            error={errors.postalCode?.message}
                                                        />
                                                    )}
                                                />
                                                {isLoadingAddress ? (
                                                    <Loader2 className="absolute right-3 top-[34px] animate-spin text-primary" size={20} />
                                                ) : (
                                                    <Search className="absolute right-3 top-[34px] text-gray-400" size={20} />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Fix layout gap for CPF case */}
                                    {formData.taxId?.replace(/\D/g, '').length === 11 && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="relative">
                                                 <Controller
                                                    name="postalCode"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Input
                                                            label="CEP"
                                                            placeholder="00000-000"
                                                            maxLength={9}
                                                            {...field}
                                                            onChange={(e) => field.onChange(masks.cep(e.target.value))}
                                                            onBlur={() => { field.onBlur(); handleBlurCep(); }}
                                                            error={errors.postalCode?.message}
                                                        />
                                                    )}
                                                />
                                                {isLoadingAddress ? (
                                                    <Loader2 className="absolute right-3 top-[34px] animate-spin text-primary" size={20} />
                                                ) : (
                                                    <Search className="absolute right-3 top-[34px] text-gray-400" size={20} />
                                                )}
                                            </div>
                                            <div></div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-2">
                                            <Input
                                                label="Endereço"
                                                placeholder="Rua, Av..."
                                                {...register('address')}
                                                error={errors.address?.message}
                                            />
                                        </div>
                                        <Input
                                            label="Número"
                                            placeholder="123"
                                            {...register('addressNumber')}
                                            error={errors.addressNumber?.message}
                                        />
                                    </div>

                                    <label className={`flex items-start gap-3 p-4 border border-dashed rounded-lg cursor-pointer transition-colors ${errors.termsAccepted ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                                        <input
                                            type="checkbox"
                                            {...register('termsAccepted')}
                                            className="mt-1 w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                        />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Li e concordo com os <a href="#" className="text-primary hover:underline">Termos de Uso</a> e <a href="#" className="text-primary hover:underline">Política de Privacidade</a>.
                                        </span>
                                    </label>
                                    {errors.termsAccepted && <span className="text-xs text-red-500">{errors.termsAccepted.message}</span>}
                                </div>
                            </div>
                        )}
                    </form>

                    <div className="flex items-center justify-between pt-8 mt-4">
                        {step !== 'TYPE' ? (
                            <Button
                                variant="ghost"
                                onClick={prevStep}
                                disabled={isLoading}
                                className="text-gray-500"
                            >
                                <ArrowLeft className="mr-2 w-4 h-4" />
                                Voltar
                            </Button>
                        ) : (
                            <Link href="/login">
                                <Button variant="ghost" className="text-gray-500">Cancelar</Button>
                            </Link>
                        )}

                        {step === 'FINANCIAL' ? (
                            <Button
                                onClick={handleSubmit(onSubmit)}
                                isLoading={isLoading}
                                className="bg-green-600 hover:bg-green-700 text-white px-8"
                            >
                                Finalizar
                                <CheckCircle className="ml-2 w-4 h-4" />
                            </Button>
                        ) : (
                            <Button onClick={nextStep} className="px-8">
                                Próximo
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            <PendingActivationModal 
                isOpen={isSuccessModalOpen} 
                onClose={() => setIsSuccessModalOpen(false)} 
                profileType={formData.profileType} 
            />
        </div>
    );
}
