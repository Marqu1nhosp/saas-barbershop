'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    const [professionals, setProfessionals] = useState(mockProfessionals);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3rem font-bold text-slate-900">Profissionais</h1>
                <Button>Adicionar profissional</Button>
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Profissionais</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Especialidades</TableHead>
                                <TableHead>Disponibilidade</TableHead>
                                <TableHead>Clientes atendidos</TableHead>
                                <TableHead>Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {professionals.map((professional) => (
                                <TableRow key={professional.id}>
                                    <TableCell className="font-medium">{professional.name}</TableCell>
                                    <TableCell>{professional.specialties}</TableCell>
                                    <TableCell>{professional.availability}</TableCell>
                                    <TableCell>{professional.clients}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm">
                                                Editar
                                            </Button>
                                            <Button variant="destructive" size="sm">
                                                Remover
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}