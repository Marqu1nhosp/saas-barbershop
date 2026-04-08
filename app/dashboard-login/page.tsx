'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2, Lock, Mail } from 'lucide-react';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { clearDashboardSession, saveDashboardSession } from '@/lib/use-dashboard-session';

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha inválida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const [visiblePassword, setVisiblePassword] = useState(false);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            // Limpar qualquer sessão anterior antes de fazer login
            clearDashboardSession();

            // ❌ Fazer logout do better-auth (SaaS session) para evitar conflito
            try {
                await fetch('/api/auth/signout', {
                    method: 'POST',
                });
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (err) {
                console.log('[Dashboard Login] Signout attempt completed (may not exist)');
            }

            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error || 'Erro ao fazer login');
            }

            const { token, user } = await res.json();

            document.cookie = `token=${token}; path=/; max-age=${24 * 60 * 60}`;

            // Salvar com a chave específica do dashboard
            saveDashboardSession(user, token);

            if (user.barbershopId) {
                localStorage.setItem('barbershopId', user.barbershopId);
            } else {
                console.warn('[Dashboard Login] No barbershopId in response:', user);
            }

            // Maior delay para garantir que listeners sejam notificados
            await new Promise((r) => setTimeout(r, 300));

            router.push('/barbershops/dashboard');
        } catch (err) {
            console.error('[Dashboard Login] ❌ Login failed:', err);
            setError('root', {
                message: err instanceof Error ? err.message : 'Erro ao fazer login',
            });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
            <div className="w-full max-w-md">
                <Card className="w-full bg-white shadow-2xl border border-slate-200">
                    <CardHeader className="text-center pb-6">
                        <CardTitle className="text-3xl font-bold text-slate-900">
                            Acessar
                        </CardTitle>
                        <p className="text-slate-500 text-sm mt-2">Bem-vindo ao painel de controle</p>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-2 block">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <Input
                                        type="email"
                                        placeholder="seu@email.com"
                                        disabled={isSubmitting}
                                        className="pl-10 h-11 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                        {...register('email')}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-sm text-red-500 mt-2">
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-2 block">Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <Input
                                        type={visiblePassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        disabled={isSubmitting}
                                        className="pl-10 h-11 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                        {...register('password')}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
                                        onClick={() => setVisiblePassword(!visiblePassword)}
                                    >
                                        {visiblePassword ? <Eye /> : <EyeOff />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-red-500 mt-2">
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>

                            {errors.root && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                                    <span className="text-sm text-red-600 font-medium">
                                        {errors.root.message}
                                    </span>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Entrando...
                                    </>
                                ) : (
                                    'Entrar'
                                )}
                            </Button>
                        </form>
                        {/* 
                        <div className="mt-6 pt-6 border-t border-slate-200 text-center text-sm text-slate-600">
                            Não tem uma conta?{' '}
                            <a href="/register" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                                Registre-se aqui
                            </a>
                        </div> */}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
