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
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET_KEY) {
        return NextResponse.error();
    }
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
        return NextResponse.error();
    }
    const body = await req.text();

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2025-08-27.basil",
    });

    const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET_KEY);
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const metadata = metadataSchema.parse(session.metadata);
        const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ["payment_intent"],
        });
        const paymentIntent = expandedSession.payment_intent as Stripe.PaymentIntent;
        const chargeId = typeof paymentIntent.latest_charge === "string"
            ? paymentIntent.latest_charge
            : paymentIntent.latest_charge?.id;

        await prisma.booking.create({
            data: {
                serviceId: metadata.serviceId,
                barbershopId: metadata.barbershopId,
                userId: metadata.userId,
                date: metadata.date,
                employeeId: metadata.employeeId && metadata.employeeId !== "auto" ? metadata.employeeId : undefined,
                stripeChargeId: chargeId,
            }
        });
    }

    return NextResponse.json({ received: true });

}
