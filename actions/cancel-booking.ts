"use server";

import { revalidatePath } from "next/cache";
import { returnValidationErrors } from "next-safe-action";
import Stripe from "stripe";
import { z } from "zod";

import { protectedActionClient } from "@/lib/action-client";
import prisma from "@/lib/prisma";

const inputSchema = z.object({
    bookingId: z.uuid(),
});

export const cancelBooking = protectedActionClient
    .inputSchema(inputSchema)
    .action(async ({ parsedInput: { bookingId }, ctx: { user } }) => {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
        });

        if (!booking) {
            return returnValidationErrors(inputSchema, {
                _errors: ["Agendamento não encontrado"],
            });
        }

        if (booking.userId !== user.id) {
            return returnValidationErrors(inputSchema, {
                _errors: ["Você não tem permissão para cancelar este agendamento"],
            });
        }

        if (booking.cancelledAt) {
            return returnValidationErrors(inputSchema, {
                _errors: ["Este agendamento já foi cancelado"],
            });
        }

        if (booking.stripeChargeId) {
            if (!process.env.STRIPE_SECRET_KEY) {
                return returnValidationErrors(inputSchema, {
                    _errors: ["Chave secreta do Stripe não está definida"],
                });
            }
            try {
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
                    apiVersion: "2025-08-27.basil",
                });

                await stripe.refunds.create({
                    charge: booking.stripeChargeId,
                    reason: 'requested_by_customer',
                });
            } catch (error) {
                return returnValidationErrors(inputSchema, {
                    _errors: ["Não foi possível processar o reembolso pelo Stripe"],
                });
            }
        }

        const cancelledBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: {
                cancelledAt: new Date(),
            },
        });

        revalidatePath("/");
        revalidatePath("/bookings");

        return cancelledBooking;
    });


