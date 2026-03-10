'use client';

import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { deleteEmployee, getEmployeesByBarbershop } from '@/actions/manage-employees';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { AddEmployeeDialog } from './add-employee-dialog';
import { EditEmployeeDialog } from './edit-employee-dialog';

interface Employee {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
}

export function EmployeesSection() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const barbershopId = typeof window !== 'undefined' ? localStorage.getItem('barbershopId') : null;

    const fetchEmployees = async () => {
        if (!barbershopId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await getEmployeesByBarbershop(barbershopId);
            setEmployees(data);
        } catch (error) {
            console.error('Error fetching employees:', error);
            toast.error('Erro ao carregar funcionários');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [barbershopId]);



    const handleAddEmployee = async () => {
        await fetchEmployees();
        setIsAddDialogOpen(false);
    };

    const handleEditEmployee = (employee: Employee) => {
        setEditingEmployee(employee);
        setIsEditDialogOpen(true);
    };

    const handleUpdateEmployee = async () => {
        await fetchEmployees();
        setIsEditDialogOpen(false);
        setEditingEmployee(null);
    };

    const handleDeleteEmployee = async (id: string) => {
        if (!barbershopId) return;

        if (!confirm('Tem certeza que deseja remover este funcionário?')) {
            return;
        }

        try {
            await deleteEmployee({ id, barbershopId });
            toast.success('Funcionário removido com sucesso');
            await fetchEmployees();
        } catch (error) {
            console.error('Error deleting employee:', error);
            toast.error('Erro ao remover funcionário');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 bg-gradient-to-br from-blue-500 to-slate-600 rounded-full animate-spin mb-3"></div>
                    <p className="text-slate-600 font-medium">Carregando funcionários...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Gerenciar Funcionários</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        {employees.length} funcionário{employees.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar funcionário
                </Button>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {employees.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-slate-500 font-medium">Nenhum funcionário cadastrado</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Nome</th>
                                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Email</th>
                                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Data de Cadastro</th>
                                    <th className="px-6 py-4 text-right font-semibold text-slate-700">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((employee) => (
                                    <tr
                                        key={employee.id}
                                        className="border-b border-slate-200 hover:bg-slate-50 transition-colors duration-200"
                                    >
                                        <td className="px-6 py-4 font-semibold text-slate-900">{employee.name}</td>
                                        <td className="px-6 py-4 text-slate-600">{employee.email}</td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {new Date(employee.createdAt).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditEmployee(employee)}
                                                    className="border-slate-300 hover:bg-blue-50 text-blue-600"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDeleteEmployee(employee.id)}
                                                    className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {employees.length === 0 ? (
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent className="pt-6 text-center">
                            <p className="text-slate-500 font-medium">Nenhum funcionário cadastrado</p>
                        </CardContent>
                    </Card>
                ) : (
                    employees.map((employee) => (
                        <Card key={employee.id} className="border-slate-200 shadow-sm">
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-slate-900 text-lg">{employee.name}</h3>
                                        <p className="text-sm text-slate-500 mt-1">{employee.email}</p>
                                    </div>
                                </div>

                                <div className="text-sm text-slate-600">
                                    <p className="text-xs font-medium text-slate-500 mb-1">Data de Cadastro</p>
                                    <p className="font-medium">{new Date(employee.createdAt).toLocaleDateString('pt-BR')}</p>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditEmployee(employee)}
                                        className="flex-1 border-slate-300 hover:bg-blue-50 text-blue-600"
                                    >
                                        <Edit2 className="w-4 h-4 mr-2" />
                                        Editar
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteEmployee(employee.id)}
                                        className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Remover
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Dialogs */}
            <AddEmployeeDialog
                isOpen={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                onSuccess={handleAddEmployee}
            />

            {editingEmployee && (
                <EditEmployeeDialog
                    isOpen={isEditDialogOpen}
                    employee={editingEmployee}
                    onClose={() => {
                        setIsEditDialogOpen(false);
                        setEditingEmployee(null);
                    }}
                    onSuccess={handleUpdateEmployee}
                />
            )}
        </div>
    );
}
