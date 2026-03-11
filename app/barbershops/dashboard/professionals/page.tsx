'use client';

import { Users } from 'lucide-react';
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
import { EmployeesSection } from '@/app/barbershops/dashboard/settings/_components/employees-section';

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
            <div className="border-b border-slate-200 pb-6">
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-8 h-8 text-blue-600" />
                    Profissionais
                </h1>
                <p className="text-sm sm:text-base text-slate-500 mt-2">Gerencie os profissionais e funcionários da sua equipe</p>
            </div>

            {/* Employees/Users Section */}
            <EmployeesSection />
        </div>
    );
}