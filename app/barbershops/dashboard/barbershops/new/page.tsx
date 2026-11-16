import { redirect } from 'next/navigation';

export default function NewBarbershopPage() {
    redirect('/barbershops/dashboard/barbershops?new=1');
}
