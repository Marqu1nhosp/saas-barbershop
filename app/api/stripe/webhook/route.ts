import { NextResponse } from "next/server";
import Stripe from "stripe";
import z from "zod";

import prisma from "@/lib/prisma";

const metadataSchema = z.object({
    serviceId: z.uuid(),
    barbershopId: z.uuid(),
    userId: z.string(),
    date: z.iso.datetime(),
    employeeId: z.string().optional(),
});

export const POST = async (req: Request) => {
    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            console.error("❌ STRIPE_SECRET_KEY não configurada");
            return NextResponse.json({ error: "STRIPE_SECRET_KEY missing" }, { status: 500 });
        }

        if (!process.env.STRIPE_WEBHOOK_SECRET_KEY) {
            console.error("❌ STRIPE_WEBHOOK_SECRET_KEY não configurada");
            return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET_KEY missing" }, { status: 500 });
        }

        const signature = req.headers.get("stripe-signature");
        if (!signature) {
            console.error("❌ stripe-signature header não encontrado");
            return NextResponse.json({ error: "No signature" }, { status: 400 });
        }

        const body = await req.text();

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: "2025-08-27.basil",
        });

        let event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET_KEY);
        } catch (err) {
            console.error("❌ Erro ao validar assinatura:", err instanceof Error ? err.message : err);
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }


        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;


            if (!session.metadata) {
                console.warn("⚠️ Checkout sem metadata, pulando...");
                return NextResponse.json({ received: true });
            }

            try {
                const metadata = metadataSchema.parse(session.metadata);


                const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
                    expand: ["payment_intent"],
                });
                const paymentIntent = expandedSession.payment_intent as Stripe.PaymentIntent;
                const chargeId = typeof paymentIntent.latest_charge === "string"
                    ? paymentIntent.latest_charge
                    : paymentIntent.latest_charge?.id;



                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const booking = await prisma.booking.create({
                    data: {
                        serviceId: metadata.serviceId,
                        barbershopId: metadata.barbershopId,
                        userId: metadata.userId,
                        date: new Date(metadata.date),
                        employeeId: metadata.employeeId && metadata.employeeId !== "auto" ? metadata.employeeId : undefined,
                        stripeChargeId: chargeId,
                    }
                });
            } catch (error) {
                console.error("❌ Erro ao processar checkout:", error instanceof Error ? error.message : error);
                throw error;
            }
        } else {
            console.log(`Evento ignorado: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("❌ Erro geral no webhook:", error instanceof Error ? error.message : error);
        if (error instanceof Error) {
            console.error("   Stack:", error.stack);
        }
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
