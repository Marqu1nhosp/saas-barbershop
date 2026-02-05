'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha inválida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();

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
            localStorage.setItem('token', token);

            if (user.barbershopId) {
                localStorage.setItem('barbershopId', user.barbershopId);
            }

            await new Promise((r) => setTimeout(r, 500));

            router.push('/barbershops/dashboard');
        } catch (err) {
            setError('root', {
                message: err instanceof Error ? err.message : 'Erro ao fazer login',
            });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2rem text-center">
                        Login Barbearia
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                type="email"
                                placeholder="seu@email.com"
                                disabled={isSubmitting}
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium">Senha</label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                disabled={isSubmitting}
                                {...register('password')}
                            />
                            {errors.password && (
                                <p className="text-sm text-red-500">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {errors.root && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                                <AlertCircle className="w-4 h-4 text-red-600" />
                                <span className="text-sm text-red-600">
                                    {errors.root.message}
                                </span>
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Entrando...' : 'Entrar'}
                        </Button>
                    </form>

                    <div className="mt-4 text-center text-sm text-slate-600">
                        Não tem uma conta?{' '}
                        <a href="/register" className="text-blue-600 hover:underline">
                            Registre-se aqui
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
