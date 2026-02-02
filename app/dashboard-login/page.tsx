'use client';

import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erro ao fazer login');
            }

            const { token, user } = await res.json();

            // Armazenar token no cookie com maxAge
            document.cookie = `token=${token}; path=/; max-age=${24 * 60 * 60}`;
            localStorage.setItem('token', token);

            if (user.barbershopId) {
                localStorage.setItem('barbershopId', user.barbershopId);
            }

            // Aguardar um pouco para o cookie ser definido
            await new Promise(resolve => setTimeout(resolve, 500));

            // Redirecionar para o dashboard
            router.push('/barbershops/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2rem text-center">Login Barbearia</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Senha</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={loading}
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                                <AlertCircle className="w-4 h-4 text-red-600" />
                                <span className="text-sm text-red-600">{error}</span>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? 'Entrando...' : 'Entrar'}
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