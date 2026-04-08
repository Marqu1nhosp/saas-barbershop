'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { createEmployee } from '@/actions/manage-employees';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const addEmployeeSchema = z.object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não correspondem',
    path: ['confirmPassword'],
});

type AddEmployeeFormData = z.infer<typeof addEmployeeSchema>;

interface Employee {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
}

interface ActionResult {
    data?: Employee;
    validationErrors?: {
        _errors?: string[];
    };
}

interface AddEmployeeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddEmployeeDialog({ isOpen, onClose, onSuccess }: AddEmployeeDialogProps) {
    const barbershopId = typeof window !== 'undefined' ? localStorage.getItem('barbershopId') : null;
    const [actionResult, setActionResult] = useState<ActionResult | null>(null);
    const hasProcessedResult = useRef(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<AddEmployeeFormData>({
        resolver: zodResolver(addEmployeeSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    });

    const { execute: executeCreateEmployee, isPending } = useAction(createEmployee, {
        onSuccess: (result) => {
            setActionResult(result);
        },
        onError: (result) => {

            let message = '';

            // Verificar se tem validationErrors
            if (result.error?.validationErrors) {
                if (result.error.validationErrors._errors?.[0]) {
                    message = result.error.validationErrors._errors[0];
                } else {
                    // Se tem validationErrors mas não tem _errors, log dos detalhes
                    message = 'Erro de validação: ' + JSON.stringify(result.error.validationErrors);
                }
            } else if (result.error?.serverError) {
                message = result.error.serverError;
            } else {
                message = 'Erro ao adicionar funcionário (detalhes não disponíveis)';
            }

            toast.error(message);
        },
    });

    useEffect(() => {
        if (!actionResult || hasProcessedResult.current) return;

        hasProcessedResult.current = true;

        // Check for validation errors
        if (actionResult.validationErrors?._errors?.[0]) {
            toast.error(actionResult.validationErrors._errors[0]);
            return;
        }

        // Check for successful response
        if (actionResult.data) {
            toast.success('Funcionário adicionado com sucesso!');
            reset();
            onSuccess();
            onClose();
        } else {
            // Se não tem data e não tem validationErrors, é erro desconhecido
            toast.error('Erro ao adicionar funcionário: resposta inválida do servidor');
        }
    }, [actionResult, reset, onSuccess, onClose]);

    useEffect(() => {
        if (isOpen) {
            hasProcessedResult.current = false;
        }
    }, [isOpen]);

    const onSubmit = async (data: AddEmployeeFormData) => {
        if (!barbershopId) {
            toast.error('Barbearia não identificada');
            return;
        }

        await executeCreateEmployee({
            name: data.name,
            email: data.email,
            password: data.password,
            barbershopId,
        });
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>Adicionar novo funcionário</AlertDialogTitle>
                </AlertDialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <Label className="text-slate-700 font-semibold mb-2 block">Nome</Label>
                        <Input
                            {...register('name')}
                            placeholder="Nome completo"
                            className="h-10 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <Label className="text-slate-700 font-semibold mb-2 block">Email</Label>
                        <Input
                            {...register('email')}
                            type="email"
                            placeholder="email@example.com"
                            className="h-10 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <Label className="text-slate-700 font-semibold mb-2 block">Senha</Label>
                        <Input
                            {...register('password')}
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            className="h-10 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                        {errors.password && (
                            <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
                        )}
                    </div>

                    <div>
                        <Label className="text-slate-700 font-semibold mb-2 block">Confirmar senha</Label>
                        <Input
                            {...register('confirmPassword')}
                            type="password"
                            placeholder="Confirme a senha"
                            className="h-10 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                        {errors.confirmPassword && (
                            <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <AlertDialogCancel className="rounded-lg border-slate-300">
                            Cancelar
                        </AlertDialogCancel>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                        >
                            {isPending ? 'Adicionando...' : 'Adicionar funcionário'}
                        </Button>
                    </div>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}
