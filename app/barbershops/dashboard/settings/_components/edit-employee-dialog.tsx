'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { updateEmployee } from '@/actions/manage-employees';
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

const editEmployeeSchema = z.object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    email: z.string().email('Email inválido'),
});

type EditEmployeeFormData = z.infer<typeof editEmployeeSchema>;

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

interface EditEmployeeDialogProps {
    isOpen: boolean;
    employee: Employee;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditEmployeeDialog({
    isOpen,
    employee,
    onClose,
    onSuccess,
}: EditEmployeeDialogProps) {
    const barbershopId = typeof window !== 'undefined' ? localStorage.getItem('barbershopId') : null;
    const [actionResult, setActionResult] = useState<ActionResult | null>(null);
    const hasProcessedResult = useRef(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<EditEmployeeFormData>({
        resolver: zodResolver(editEmployeeSchema),
        defaultValues: {
            name: employee.name,
            email: employee.email,
        },
    });

    const { execute: executeUpdateEmployee, isPending } = useAction(updateEmployee, {
        onSuccess: (result) => {
            setActionResult(result);
        },
        onError: (result) => {
            const message =
                result.error?.serverError ??
                'Erro ao atualizar funcionário';
            toast.error(message);
        },
    });

    useEffect(() => {
        if (!actionResult || hasProcessedResult.current) return;

        hasProcessedResult.current = true;

        // Debug: log the result
        console.log('Action result:', actionResult);

        // Check for validation errors
        if (actionResult.validationErrors?._errors?.[0]) {
            toast.error(actionResult.validationErrors._errors[0]);
            return;
        }

        // Check for successful response
        if (actionResult.data) {
            toast.success('Funcionário atualizado com sucesso!');
            onSuccess();
            onClose();
        } else {
            // Se não tem data e não tem validationErrors, é erro desconhecido
            toast.error('Erro ao atualizar funcionário: resposta inválida do servidor');
        }
    }, [actionResult, onSuccess, onClose]);

    useEffect(() => {
        if (isOpen) {
            hasProcessedResult.current = false;
        }
    }, [isOpen]);

    const onSubmit = async (data: EditEmployeeFormData) => {
        if (!barbershopId) {
            toast.error('Barbearia não identificada');
            return;
        }

        await executeUpdateEmployee({
            id: employee.id,
            name: data.name,
            email: data.email,
            barbershopId,
        });
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>Editar funcionário</AlertDialogTitle>
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

                    <p className="text-xs text-slate-500">
                        Para alterar a senha, o funcionário deve fazer isso em suas configurações de conta.
                    </p>

                    <div className="flex justify-end gap-2 pt-4">
                        <AlertDialogCancel className="rounded-lg border-slate-300">
                            Cancelar
                        </AlertDialogCancel>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                        >
                            {isPending ? 'Salvando...' : 'Salvar alterações'}
                        </Button>
                    </div>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}
