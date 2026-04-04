"use server";
import { isPast } from "date-fns";
import { returnValidationErrors } from "next-safe-action";
import Stripe from "stripe";
import { z } from "zod";

import { protectedActionClient } from "@/lib/action-client";
import prisma from "@/lib/prisma";

const inputSchema = z.object({
    serviceId: z.uuid(),
    date: z.coerce.date(),
    employeeId: z.string().uuid().optional(),
});

export const createBookingCheckoutSession = protectedActionClient
    .inputSchema(inputSchema)
    .action(async ({ parsedInput: { serviceId, date, employeeId }, ctx: { user } }) => {
        if (!process.env.STRIPE_SECRET_KEY) {
            returnValidationErrors(inputSchema, {
                _errors: ["Chave secreta do Stripe não está definida"],
            });
        }
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: "2025-08-27.basil",
        });

        const service = await prisma.barbershopService.findUnique({
            where: { id: serviceId },
        });

        if (!service) {
            returnValidationErrors(inputSchema, {
                _errors: ["Serviço não encontrado"],
            });
        }

        if (isPast(date)) {
            returnValidationErrors(inputSchema, {
                date: ["A data e hora do agendamento devem ser no futuro"],
            });
        }

        // Exemplo de uso
        const checkoutSession = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}`,
            metadata: {
                serviceId: serviceId,
                barbershopId: service.barbershopId,
                userId: user.id,
                date: date.toISOString(),
                employeeId: employeeId || "auto",
            },
            line_items: [
                {
                    price_data: {
                        currency: "brl",
                        unit_amount: service?.priceInCents,
                        product_data: {
                            name: `${service?.name} `,
                            description: service?.description || ""
                        }
                    },
                    quantity: 1,
                },
            ],
        });

        return {
            id: checkoutSession.id,
            url: checkoutSession.url,
        };
    });
