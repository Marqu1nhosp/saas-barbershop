export const BARBERSHOP_SERVICE_TEMPLATES = [
    {
        key: 'haircut',
        name: 'Corte de Cabelo',
        description: 'Estilo personalizado com as últimas tendências.',
        priceInCents: 6000,
        durationMinutes: 60,
        imageUrl: '/images/services/corte-de-cabelo.png',
    },
    {
        key: 'beard',
        name: 'Barba',
        description: 'Modelagem completa para destacar seu estilo.',
        priceInCents: 4000,
        durationMinutes: 20,
        imageUrl: '/images/services/barba.png',
    },
    {
        key: 'lineup',
        name: 'Pézinho',
        description: 'Acabamento perfeito para um visual renovado.',
        priceInCents: 3500,
        durationMinutes: 30,
        imageUrl: '/images/services/pezinho.png',
    },
    {
        key: 'eyebrow',
        name: 'Sobrancelha',
        description: 'Modelagem precisa para valorizar sua expressão.',
        priceInCents: 2000,
        durationMinutes: 15,
        imageUrl: '/images/services/sombrancelha.png',
    },
    {
        key: 'massage',
        name: 'Massagem',
        description: 'Relaxe com uma massagem revigorante.',
        priceInCents: 5000,
        durationMinutes: 45,
        imageUrl: '/images/services/massagem.png',
    },
] as const;

export const BARBERSHOP_IMAGE_OPTIONS = [
    '/images/barbershops/salao-modelo-mauricio.png',
    '/images/barbershops/barbearia-vila-serrana.png',
    '/images/barbershops/barbearia-urbis-v.png',
] as const;