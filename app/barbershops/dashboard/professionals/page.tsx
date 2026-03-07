'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const mockProfessionals = [
    {
        id: '1',
        name: 'Carlos Silva',
        specialties: 'Corte, Barba',
        availability: 'Seg-Sex 9h-18h',
        clients: 45,
    },
    {
        id: '2',
        name: 'Pedro Santos',
        specialties: 'Corte, Barba, Tratamento',
        availability: 'Seg-Sab 10h-20h',
        clients: 62,
    },
];

export default function ProfessionalsPage() {
    const [professionals] = useState(mockProfessionals);

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Profissionais</h1>
                    <p className="text-sm sm:text-base text-slate-500 mt-2">Gerencie os profissionais da sua equipe</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all">
                    Adicionar profissional
                </Button>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 hover:bg-slate-100">
                            <TableHead className="font-semibold text-slate-700 py-4">Nome</TableHead>
                            <TableHead className="font-semibold text-slate-700 py-4">Especialidades</TableHead>
                            <TableHead className="font-semibold text-slate-700 py-4">Disponibilidade</TableHead>
                            <TableHead className="font-semibold text-slate-700 py-4">Clientes atendidos</TableHead>
                            <TableHead className="font-semibold text-slate-700 py-4 text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {professionals.map((professional) => (
                            <TableRow key={professional.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors duration-200">
                                <TableCell className="font-semibold text-slate-900 py-4">{professional.name}</TableCell>
                                <TableCell className="text-slate-600 py-4">{professional.specialties}</TableCell>
                                <TableCell className="text-slate-600 py-4">{professional.availability}</TableCell>
                                <TableCell className="text-slate-600 py-4">{professional.clients}</TableCell>
                                <TableCell className="py-4">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" size="sm" className="border-slate-300 hover:bg-slate-100 text-slate-700">
                                            Editar
                                        </Button>
                                        <Button variant="destructive" size="sm" className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200">
                                            Remover
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
                {professionals.map((professional) => (
                    <div key={professional.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-slate-900 text-lg">{professional.name}</h3>
                                <p className="text-sm text-slate-500 mt-1">{professional.specialties}</p>
                            </div>
                        </div>

                        <div className="flex gap-6 text-sm">
                            <div>
                                <p className="text-slate-500 text-xs font-medium mb-1">Disponibilidade</p>
                                <p className="text-slate-900 font-medium">{professional.availability}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs font-medium mb-1">Clientes</p>
                                <p className="text-slate-900 font-medium">{professional.clients}</p>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button variant="outline" size="sm" className="flex-1 border-slate-300 hover:bg-slate-100 text-slate-700">
                                Editar
                            </Button>
                            <Button variant="destructive" size="sm" className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200">
                                Remover
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}