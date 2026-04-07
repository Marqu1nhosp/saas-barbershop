'use server';

import {
    endOfDay,
    endOfMonth,
    endOfWeek,
    startOfDay,
    startOfMonth,
    startOfWeek
} from 'date-fns';

import { prisma } from '@/lib/prisma';

const SAO_PAULO_TIME_ZONE = 'America/Sao_Paulo';

function formatTimeInSaoPaulo(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: SAO_PAULO_TIME_ZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date);
}

function formatDateInSaoPaulo(date: Date): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: SAO_PAULO_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);

    const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
    const month = parts.find((part) => part.type === 'month')?.value ?? '01';
    const day = parts.find((part) => part.type === 'day')?.value ?? '01';

    return `${year}-${month}-${day}`;
}

export interface DashboardMetrics {
    bookingsToday: number;
    bookingsMonth: number;
    revenueToday: number;
    revenueMonth: number;
    clientsCount: number;
}

export interface WeeklyBookingData {
    day: string;
    count: number;
}

export interface PopularService {
    name: string;
    count: number;
}

export interface BookingData {
    id: string;
    client: string;
    service: string;
    professional: string;
    date: string;
    time: string;
    status: string;
}

export interface FinancialMetrics {
    totalRevenue: number;
    averageTicket: number;
    mostProfitableService: string;
    maxRevenueService: number;
}

export interface MonthlyRevenueData {
    month: string;
    revenue: number;
    [key: string]: string | number;
}

export async function getDashboardMetrics(barbershopId: string): Promise<DashboardMetrics> {
    const now = new Date();

    // HOJE (UTC)
    const startOfToday = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0, 0, 0, 0
    ));

    const endOfToday = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23, 59, 59, 999
    ));

    // MÊS ATUAL (UTC)
    const startOfCurrentMonth = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        1,
        0, 0, 0, 0
    ));

    const endOfCurrentMonth = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() + 1,
        0,
        23, 59, 59, 999
    ));

    //  Agendamentos do dia
    const bookingsToday = await prisma.booking.count({
        where: {
            barbershopId,
            cancelledAt: null,
            date: {
                gte: startOfToday,
                lte: endOfToday,
            },
        },
    });

    //  Agendamentos do mês
    const bookingsMonth = await prisma.booking.count({
        where: {
            barbershopId,
            cancelledAt: null,
            date: {
                gte: startOfCurrentMonth,
                lte: endOfCurrentMonth,
            },
        },
    });

    //  Faturamento do dia
    const bookingsTodayWithServices = await prisma.booking.findMany({
        where: {
            barbershopId,
            cancelledAt: null,
            date: {
                gte: startOfToday,
                lte: endOfToday,
            },
        },
        include: { service: true },
    });

    const revenueToday =
        bookingsTodayWithServices.reduce(
            (sum, booking) => sum + (booking.service?.priceInCents ?? 0),
            0
        ) / 100;

    //  Faturamento do mês
    const bookingsMonthWithServices = await prisma.booking.findMany({
        where: {
            barbershopId,
            cancelledAt: null,
            date: {
                gte: startOfCurrentMonth,
                lte: endOfCurrentMonth,
            },
        },
        include: { service: true },
    });

    const revenueMonth =
        bookingsMonthWithServices.reduce(
            (sum, booking) => sum + (booking.service?.priceInCents ?? 0),
            0
        ) / 100;

    //  Clientes únicos do mês
    const clientsAttended = await prisma.booking.groupBy({
        by: ['userId'],
        where: {
            barbershopId,
            cancelledAt: null,
            date: {
                gte: startOfCurrentMonth,
                lte: endOfCurrentMonth,
            },
        },
    });

    return {
        bookingsToday,
        bookingsMonth,
        revenueToday,
        revenueMonth,
        clientsCount: clientsAttended.length,
    };
}

export async function getWeeklyBookings(barbershopId: string): Promise<WeeklyBookingData[]> {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    const bookings = await prisma.booking.findMany({
        where: {
            barbershopId,
            date: {
                gte: weekStart,
                lte: weekEnd,
            },
        },
        include: {
            service: true,
        },
    });

    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
    const data = Array(7).fill(0);

    bookings.forEach((booking) => {
        const dayIndex = booking.date.getDay();
        data[dayIndex === 0 ? 6 : dayIndex - 1]++;
    });

    return data.map((count, index) => ({
        day: days[index],
        count,
    }));
}

export async function getMostPopularServices(barbershopId: string): Promise<PopularService[]> {
    const today = new Date();
    const startOfCurrentMonth = startOfMonth(today);
    const endOfCurrentMonth = endOfMonth(today);

    const services = await prisma.booking.groupBy({
        by: ['serviceId'],
        where: {
            barbershopId,
            date: {
                gte: startOfCurrentMonth,
                lte: endOfCurrentMonth,
            },
        },
        _count: {
            serviceId: true,
        },
        orderBy: {
            _count: {
                serviceId: 'desc',
            },
        },
        take: 5,
    });

    const servicesWithDetails = await Promise.all(
        services.map(async (service) => {
            const details = await prisma.barbershopService.findUnique({
                where: { id: service.serviceId },
            });
            return {
                name: details?.name || 'Unknown',
                count: service._count.serviceId,
            };
        })
    );

    return servicesWithDetails;
}

export async function getBookings(barbershopId: string, date?: string): Promise<BookingData[]> {
    const now = new Date();
    const todayInSaoPaulo = formatDateInSaoPaulo(now);
    const today = new Date(`${todayInSaoPaulo}T00:00:00-03:00`);

    const where: { 
        barbershopId: string; 
        date?: { gte: Date; lte: Date } 
    } = { 
        barbershopId
    };

    if (date && date.trim() !== '') {
        try {
            // Interpreta o filtro como dia local de Sao Paulo e converte para UTC.
            const startOfDate = new Date(`${date}T00:00:00-03:00`);
            const endOfDate = new Date(`${date}T23:59:59.999-03:00`);

            where.date = {
                gte: startOfDate,
                lte: endOfDate,
            };
        } catch {
            // Error parsing date, continue without date filter
        }
    }

    // Obter TODOS os agendamentos

    const bookings = await prisma.booking.findMany({
        where,
        include: {
            service: true,
            user: true,
            employee: true,
        },
    // Ordenação em JavaScript para lidar com lógica customizada
    });

    // Ordenar agendamentos: atuais/futuros primeiro (asc), depois passados (desc)
    const sortedBookings = bookings.sort((a, b) => {
        const aIsCurrentOrFuture = a.date >= today;
        const bIsCurrentOrFuture = b.date >= today;

        // If both are current/future or both are past, sort by date
        if (aIsCurrentOrFuture === bIsCurrentOrFuture) {
            if (aIsCurrentOrFuture) {
                // Both are current/future: ascending order
                return a.date.getTime() - b.date.getTime();
            } else {
                // Both are past: descending order (most recent first)
                return b.date.getTime() - a.date.getTime();
            }
        }

        // Current/future comes first
        return aIsCurrentOrFuture ? -1 : 1;
    });

    return sortedBookings.map((booking) => {
        const time = formatTimeInSaoPaulo(booking.date);
        const localDate = formatDateInSaoPaulo(booking.date);

        return {
            id: booking.id,
            client: booking.user?.name || 'Desconhecido',
            service: booking.service?.name || 'Serviço desconhecido',
            professional: booking.employee?.name || 'Não atribuído',
            date: localDate,
            time,
            status: booking.cancelledAt ? 'cancelado' : 'confirmado',
            cancelledAt: booking.cancelledAt?.toISOString() || null,
        };
    });
}

export async function getFinancialMetrics(barbershopId: string): Promise<FinancialMetrics> {
    const today = new Date();
    const startOfCurrentMonth = startOfMonth(today);
    const endOfCurrentMonth = endOfMonth(today);

    // Total faturado no mês
    const bookingsMonth = await prisma.booking.findMany({
        where: {
            barbershopId,
            date: {
                gte: startOfCurrentMonth,
                lte: endOfCurrentMonth,
            },
        },
        include: {
            service: true,
        },
    });

    const totalRevenue = bookingsMonth.reduce((sum, booking) => {
        return sum + (booking.service?.priceInCents || 0);
    }, 0) / 100;

    const averageTicket = bookingsMonth.length > 0 ? totalRevenue / bookingsMonth.length : 0;

    // Serviço mais lucrativo
    const serviceRevenue = new Map<string, { name: string; revenue: number }>();
    bookingsMonth.forEach((booking) => {
        const key = booking.service?.id || 'unknown';
        const existing = serviceRevenue.get(key) || { name: booking.service?.name || 'Desconhecido', revenue: 0 };
        existing.revenue += (booking.service?.priceInCents || 0) / 100;
        serviceRevenue.set(key, existing);
    });

    let mostProfitableService = 'N/A';
    let maxRevenue = 0;
    serviceRevenue.forEach((data) => {
        if (data.revenue > maxRevenue) {
            maxRevenue = data.revenue;
            mostProfitableService = data.name;
        }
    });

    return {
        totalRevenue,
        averageTicket,
        mostProfitableService,
        maxRevenueService: maxRevenue,
    };
}

export async function getMonthlyRevenue(barbershopId: string): Promise<MonthlyRevenueData[]> {
    // Pegar últimos 6 meses
    const months = [];
    const data = [];

    for (let i = 5; i >= 0; i--) {
        const date = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
        const startOfMonth = startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
        const endOfMonth = endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));

        const monthName = date.toLocaleString('pt-BR', { month: 'short' });
        months.push(monthName.charAt(0).toUpperCase() + monthName.slice(1));

        const bookings = await prisma.booking.findMany({
            where: {
                barbershopId,
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
            include: {
                service: true,
            },
        });

        const revenue = bookings.reduce((sum, booking) => {
            return sum + (booking.service?.priceInCents || 0);
        }, 0) / 100;

        data.push({ month: months[months.length - 1], revenue });
    }

    return data;
}

export async function getBarbershopName(barbershopId: string): Promise<string | null> {
    const barbershop = await prisma.barbershop.findUnique({
        where: { id: barbershopId },
    });

    return barbershop ? barbershop.name : null;
}

export async function getBarbershop(barbershopId: string) {
    const barbershop = await prisma.barbershop.findUnique({
        where: { id: barbershopId },
    });

    return barbershop;
}

export async function updateBarbershop(barbershopId: string, name: string, address: string, description: string, phone: string) {
    const uptatedBarbershop = await prisma.barbershop.update({
        where: { id: barbershopId },
        data: {
            name,
            address,
            description,
            phones: [phone],
        },
    });

    return uptatedBarbershop;

}

export async function updateBarbershopCancellationPolicy(
    barbershopId: string,
    cancellationNoticeHours: number,
) {
    const updatedBarbershop = await prisma.barbershop.update({
        where: { id: barbershopId },
        data: {
            cancellationNoticeHours,
        },
    });

    return updatedBarbershop;
}

export interface BusinessHour {
    id: string;
    barbershopId: string;
    dayOfWeek: number;
    openingTime: string | null;
    closingTime: string | null;
    isClosed: boolean;
    lunchStart: string | null;
    lunchEnd: string | null;
}

export async function getBusinessHours(barbershopId: string): Promise<BusinessHour[]> {
    let businessHours = await prisma.businessHours.findMany({
        where: { barbershopId },
        orderBy: { dayOfWeek: 'asc' },
    });

    // If no business hours exist, create defaults
    if (businessHours.length === 0) {
        const defaults = [
            { dayOfWeek: 0, isClosed: true }, // Sunday
            { dayOfWeek: 1, openingTime: '09:00', closingTime: '18:00', isClosed: false }, // Monday
            { dayOfWeek: 2, openingTime: '09:00', closingTime: '18:00', isClosed: false }, // Tuesday
            { dayOfWeek: 3, openingTime: '09:00', closingTime: '18:00', isClosed: false }, // Wednesday
            { dayOfWeek: 4, openingTime: '09:00', closingTime: '18:00', isClosed: false }, // Thursday
            { dayOfWeek: 5, openingTime: '09:00', closingTime: '18:00', isClosed: false }, // Friday
            { dayOfWeek: 6, openingTime: '09:00', closingTime: '13:00', isClosed: false }, // Saturday
        ];

        businessHours = await Promise.all(
            defaults.map((day) =>
                prisma.businessHours.create({
                    data: {
                        barbershopId,
                        ...day,
                    },
                })
            )
        );
    }

    return businessHours;
}

export async function updateBusinessHours(
    barbershopId: string,
    dayOfWeek: number,
    openingTime: string | null,
    closingTime: string | null,
    isClosed: boolean,
    lunchStart: string | null = null,
    lunchEnd: string | null = null,
) {
    const updatedHours = await prisma.businessHours.update({
        where: {
            barbershopId_dayOfWeek: {
                barbershopId,
                dayOfWeek,
            },
        },
        data: {
            openingTime: isClosed ? null : openingTime,
            closingTime: isClosed ? null : closingTime,
            isClosed,
            lunchStart,
            lunchEnd,
        },
    });

    return updatedHours;
}

export async function getClientsForBarbershop(barbershopId: string) {
    const clients = await prisma.user.findMany({
        where: {
            role: 'CLIENT',
            barbershopId: barbershopId,
        },
        select: {
            id: true,
            name: true,
            email: true,
        },
        orderBy: {
            name: 'asc',
        },
    });

    return clients;
}

export async function getServicesForBarbershop(barbershopId: string) {
    const services = await prisma.barbershopService.findMany({
        where: {
            barbershopId,
        },
        select: {
            id: true,
            name: true,
            priceInCents: true,
        },
        orderBy: {
            name: 'asc',
        },
    });

    return services;
}