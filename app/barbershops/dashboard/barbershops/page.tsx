'use client';

import { Building2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { createBarbershop, deleteBarbershop, getGlobalBarbershops, toggleBarbershopStatus, updateBarbershopGlobal } from '@/actions/create-barbershop';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BARBERSHOP_SERVICE_TEMPLATES } from '@/lib/barbershop-service-templates';

const emptyForm = { name: '', address: '', phone: '', description: '', ownerName: '', ownerEmail: '', ownerPassword: '' };
type FormState = typeof emptyForm;
interface Unit { id: string; name: string; address: string; description: string; phones: string[]; imageUrl: string; isActive: boolean; _count: { services: number; bookings: number } }

export default function BarbershopsPage() {
    return (
        <Suspense fallback={<p className="text-sm text-slate-500">Carregando...</p>}>
            <BarbershopsContent />
        </Suspense>
    );
}

function BarbershopsContent() {
    const searchParams = useSearchParams();
    const isNewView = searchParams.get('new') === '1';
    const [units, setUnits] = useState<Unit[]>([]);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [editing, setEditing] = useState<Unit | null>(null);
    const [serviceKeys, setServiceKeys] = useState<string[]>(BARBERSHOP_SERVICE_TEMPLATES.map((item) => item.key));
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);

    const loadUnits = async () => {
        try { setUnits(await getGlobalBarbershops() as Unit[]); } catch (error) { toast.error(error instanceof Error ? error.message : 'Erro ao carregar barbearias'); } finally { setLoading(false); }
    };
    useEffect(() => { loadUnits(); }, []);

    const change = (field: keyof FormState, value: string) => setForm((current) => ({ ...current, [field]: value }));
    const startEdit = (unit: Unit) => {
        setEditing(unit);
        setForm({ name: unit.name, address: unit.address, phone: unit.phones?.[0] ?? '', description: unit.description, ownerName: '', ownerEmail: '', ownerPassword: '' });
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };
    const cancelEdit = () => { setEditing(null); setForm(emptyForm); setSelectedImage(null); };

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); setSaving(true);
        try {
            let result;
            if (editing) {
                result = await updateBarbershopGlobal({ id: editing.id, name: form.name, address: form.address, phone: form.phone, description: form.description });
            } else {
                if (!selectedImage) throw new Error('Selecione uma foto da barbearia');
                const token = localStorage.getItem('dashboard_auth_token');
                if (!token) throw new Error('Sessão expirada. Faça login novamente.');
                document.cookie = `token=${encodeURIComponent(token)}; path=/; max-age=${24 * 60 * 60}`;
                const data = new FormData(); data.append('file', selectedImage);
                const upload = await fetch('/api/dashboard/barbershops/upload', { method: 'POST', body: data, headers: { Authorization: `Bearer ${token}` } });
                const uploaded = await upload.json();
                if (!upload.ok) throw new Error(uploaded.error ?? 'Erro ao enviar imagem');
                result = await createBarbershop({ ...form, imageUrl: uploaded.imageUrl, serviceKeys });
            }
            if (!result.data) throw new Error(result.validationErrors?._errors?.[0] ?? 'Não foi possível salvar a barbearia');
            toast.success(editing ? 'Barbearia atualizada' : 'Barbearia cadastrada');
            cancelEdit(); await loadUnits();
        } catch (error) { toast.error(error instanceof Error ? error.message : 'Erro ao salvar barbearia'); } finally { setSaving(false); }
    };

    const toggle = async (id: string) => { const result = await toggleBarbershopStatus({ id }); if (result.data) { toast.success(result.data.isActive ? 'Unidade ativada' : 'Unidade desativada'); await loadUnits(); } else toast.error(result.validationErrors?._errors?.[0] ?? 'Erro ao alterar status'); };
    const remove = (id: string) => { setDeleteTarget(units.find((unit) => unit.id === id) ?? null); };
    const confirmRemove = async () => { if (!deleteTarget) return; const result = await deleteBarbershop({ id: deleteTarget.id }); if (result.data) { toast.success('Unidade excluída'); setDeleteTarget(null); await loadUnits(); } else toast.error(result.validationErrors?._errors?.[0] ?? 'Erro ao excluir unidade'); };

    if (!isNewView) {
        return <div className="space-y-6 sm:space-y-8"><div className="flex items-end justify-between border-b border-slate-200 pb-6"><div><h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900 sm:text-4xl"><Building2 className="h-8 w-8 text-blue-600" />Barbearias</h1><p className="mt-2 text-sm text-slate-500">Gerencie unidades, status e dados cadastrais.</p></div><Button asChild><Link href="/barbershops/dashboard/barbershops?new=1"><Plus className="h-4 w-4" />Nova barbearia</Link></Button></div><Card><CardHeader><CardTitle>Unidades cadastradas</CardTitle></CardHeader><CardContent>{loading ? <p className="text-sm text-slate-500">Carregando...</p> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{units.map((unit) => <div key={unit.id} className="overflow-hidden rounded-lg border border-slate-200"><img src={unit.imageUrl} alt={unit.name} className="h-32 w-full object-cover" /><div className="space-y-3 p-4"><div className="flex justify-between gap-2"><h2 className="font-semibold">{unit.name}</h2><span className={`rounded-full px-2 py-1 text-xs ${unit.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{unit.isActive ? 'Ativa' : 'Inativa'}</span></div><p className="text-sm text-slate-500">{unit.address}</p><p className="text-xs text-slate-500">{unit._count.services} serviços · {unit._count.bookings} agendamentos</p><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => startEdit(unit)}>Editar</Button><Button type="button" size="sm" variant="outline" onClick={() => toggle(unit.id)}>{unit.isActive ? 'Desativar' : 'Ativar'}</Button><Button type="button" size="sm" variant="destructive" onClick={() => remove(unit.id)}>Excluir</Button></div></div></div>)}</div>}</CardContent></Card>{deleteTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"><h2 className="text-lg font-semibold">Excluir {deleteTarget.name}?</h2><p className="mt-2 text-sm text-slate-600">Essa ação não pode ser desfeita. Unidades com agendamentos não podem ser excluídas.</p><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button><Button type="button" variant="destructive" onClick={confirmRemove}>Excluir unidade</Button></div></div></div>}</div>;
    }

    return <div className="space-y-6 sm:space-y-8">
        <div className="flex items-end justify-between border-b border-slate-200 pb-6"><div><h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900 sm:text-4xl"><Building2 className="h-8 w-8 text-blue-600" />{isNewView ? 'Nova barbearia' : 'Barbearias'}</h1><p className="mt-2 text-sm text-slate-500">{isNewView ? 'Cadastre uma nova unidade.' : 'Gerencie unidades, status e dados cadastrais.'}</p></div>{!isNewView && <Button asChild><Link href="/barbershops/dashboard/barbershops?new=1"><Plus className="h-4 w-4" />Nova barbearia</Link></Button>}</div>
        {!isNewView && <Card><CardHeader><CardTitle>Unidades cadastradas</CardTitle></CardHeader><CardContent>{loading ? <p className="text-sm text-slate-500">Carregando...</p> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{units.map((unit) => <div key={unit.id} className="overflow-hidden rounded-lg border border-slate-200"><img src={unit.imageUrl} alt={unit.name} className="h-32 w-full object-cover" /><div className="space-y-3 p-4"><div className="flex justify-between gap-2"><h2 className="font-semibold">{unit.name}</h2><span className={`rounded-full px-2 py-1 text-xs ${unit.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{unit.isActive ? 'Ativa' : 'Inativa'}</span></div><p className="text-sm text-slate-500">{unit.address}</p><p className="text-xs text-slate-500">{unit._count.services} serviços · {unit._count.bookings} agendamentos</p><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => startEdit(unit)}>Editar</Button><Button type="button" size="sm" variant="outline" onClick={() => toggle(unit.id)}>{unit.isActive ? 'Desativar' : 'Ativar'}</Button><Button type="button" size="sm" variant="destructive" onClick={() => remove(unit.id)}>Excluir</Button></div></div></div>)}</div>}</CardContent></Card>}
        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]"><Card><CardHeader><CardTitle>{editing ? 'Editar unidade' : 'Nova unidade'}</CardTitle></CardHeader><CardContent className="space-y-5"><Field label="Nome" value={form.name} onChange={(v) => change('name', v)} /><Field label="Endereço" value={form.address} onChange={(v) => change('address', v)} /><Field label="Telefone" value={form.phone} onChange={(v) => change('phone', v)} /><div><Label>Descrição</Label><textarea value={form.description} onChange={(e) => change('description', e.target.value)} className="mt-2 min-h-24 w-full rounded-md border p-2" /></div>{!editing && <div><Label>Foto da barbearia</Label><Input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setSelectedImage(e.target.files?.[0] ?? null)} className="mt-2" /><p className="mt-2 text-xs text-slate-500">JPG, PNG ou WEBP, até 5 MB.</p></div>}</CardContent></Card><div className="space-y-6">{!editing && <Card><CardHeader><CardTitle>Proprietário</CardTitle></CardHeader><CardContent className="space-y-4"><Field label="Nome" value={form.ownerName} onChange={(v) => change('ownerName', v)} /><Field label="Email" type="email" value={form.ownerEmail} onChange={(v) => change('ownerEmail', v)} /><Field label="Senha inicial" type="password" value={form.ownerPassword} onChange={(v) => change('ownerPassword', v)} placeholder="Mínimo de 6 caracteres" /></CardContent></Card>}{!editing && <Card><CardHeader><CardTitle>Serviços iniciais</CardTitle></CardHeader><CardContent className="space-y-3">{BARBERSHOP_SERVICE_TEMPLATES.map((item) => <label key={item.key} className="flex items-center gap-3"><input type="checkbox" checked={serviceKeys.includes(item.key)} onChange={() => setServiceKeys((current) => current.includes(item.key) ? current.filter((key) => key !== item.key) : [...current, item.key])} /><span className="text-sm">{item.name}</span><span className="ml-auto text-xs">R$ {(item.priceInCents / 100).toFixed(2)}</span></label>)}</CardContent></Card>}<div className="flex gap-2"><Button type="submit" disabled={saving} className="flex-1"><Plus className="h-4 w-4" />{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar barbearia'}</Button>{editing && <Button type="button" variant="outline" onClick={cancelEdit}>Cancelar</Button>}</div></div></form>
        {deleteTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"><h2 className="text-lg font-semibold text-slate-900">Excluir {deleteTarget.name}?</h2><p className="mt-2 text-sm text-slate-600">Essa ação não pode ser desfeita. Se houver agendamentos, a exclusão será bloqueada; nesse caso, desative a unidade.</p><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button><Button type="button" variant="destructive" onClick={confirmRemove}>Excluir unidade</Button></div></div></div>}
    </div>;
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) { return <div><Label>{label}</Label><Input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-2" /></div>; }
